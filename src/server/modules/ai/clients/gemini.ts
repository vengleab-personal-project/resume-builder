import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, type GenerativeModel } from "@google/generative-ai";
import {
  VertexAI,
  HarmCategory as VertexHarmCategory,
  HarmBlockThreshold as VertexHarmBlockThreshold,
} from "@google-cloud/vertexai";
import { serverEnv } from '@/server/config/env.server';
import { isChatModelAllowed } from '@/server/modules/ai/registry';
import { AI_CONFIG } from '@/shared/config/constants';

// ---------------------------------------------------------------------------
// Generation configs (shared between both backends)
// ---------------------------------------------------------------------------

// Default configuration for JSON response
const JSON_RESPONSE_CONFIG = {
  responseMimeType: "application/json",
  maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
};

const TEXT_RESPONSE_CONFIG = {
  maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
};

// ---------------------------------------------------------------------------
// Safety settings
// ---------------------------------------------------------------------------

// AI Studio safety settings (@google/generative-ai)
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Vertex AI safety settings (@google-cloud/vertexai) — identical policy,
// different enum source due to separate package type declarations.
const VERTEX_SAFETY_SETTINGS = [
  {
    category: VertexHarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: VertexHarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: VertexHarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: VertexHarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: VertexHarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: VertexHarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: VertexHarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: VertexHarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// ---------------------------------------------------------------------------
// Lazy singletons (one per backend; only the active one is ever created)
// ---------------------------------------------------------------------------

let aiStudioClient: GoogleGenerativeAI | null = null;
let vertexClient: VertexAI | null = null;

function getAiStudioClient(): GoogleGenerativeAI {
  if (!aiStudioClient) {
    aiStudioClient = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY || '');
  }
  return aiStudioClient;
}

function getVertexClient(): VertexAI {
  if (!vertexClient) {
    if (!serverEnv.GCP_PROJECT) {
      throw new Error(
        'GEMINI_BACKEND=vertex requires GCP_PROJECT to be set. ' +
        'Make sure GCP_SERVICE_ACCOUNT_KEY_PATH points to a valid service account key.'
      );
    }

    const location = serverEnv.GCP_LOCATION;
    const keyFilename = serverEnv.GCP_SERVICE_ACCOUNT_KEY_PATH || undefined;

    // @google-cloud/vertexai constructs the endpoint as:
    //   `https://${location}-aiplatform.googleapis.com`
    // With location='global' this produces 'global-aiplatform.googleapis.com'
    // which is not a real hostname → the server returns an HTML error page →
    // JSON.parse fails with "Unexpected token '<'".
    // The actual global endpoint is 'aiplatform.googleapis.com' (no prefix).
    const apiEndpoint =
      location === 'global' ? 'aiplatform.googleapis.com' : undefined;

    vertexClient = new VertexAI({
      project: serverEnv.GCP_PROJECT,
      location,
      ...(apiEndpoint ? { apiEndpoint } : {}),
      // Pass the key file explicitly so auth works regardless of whether
      // GOOGLE_APPLICATION_CREDENTIALS is visible in this process context.
      // Falls back to standard ADC chain when GCP_SERVICE_ACCOUNT_KEY_PATH
      // is not set (e.g. on Cloud Run / GKE with Workload Identity).
      ...(keyFilename ? { googleAuthOptions: { keyFilename } } : {}),
    });
  }
  return vertexClient;
}

// ---------------------------------------------------------------------------
// Vertex ↔ AI-Studio response adapter
// ---------------------------------------------------------------------------

/**
 * @google-cloud/vertexai's GenerateContentResponse has no .text() method,
 * but every caller of getGeminiModel does result.response.text().
 *
 * This adapter wraps the Vertex model's generateContent so that the returned
 * response has a .text() helper that concatenates all text parts from the
 * first candidate — exactly what @google/generative-ai's .text() does.
 *
 * All other methods (startChat, countTokens, …) are proxied through unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapVertexModel(vertexModel: any): GenerativeModel {
  return new Proxy(vertexModel as GenerativeModel, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target: any, prop: string | symbol) {
      if (prop !== 'generateContent') return target[prop];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        const result = await target.generateContent(...args);
        const { response } = result;
        // Inject .text() if the Vertex SDK didn't provide it.
        if (response && typeof response.text !== 'function') {
          response.text = () => {
            const parts: Array<{ text?: string }> =
              response.candidates?.[0]?.content?.parts ?? [];
            return parts.map((p) => p.text ?? '').join('');
          };
        }
        return result;
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

/**
 * Returns a Gemini generative model for the given modelId.
 *
 * The backend is selected by the GEMINI_BACKEND env var:
 * - 'ai-studio' (default): uses @google/generative-ai with GEMINI_API_KEY.
 * - 'vertex': uses @google-cloud/vertexai with Application Default Credentials
 *   (GOOGLE_APPLICATION_CREDENTIALS → service account JSON, Workload Identity,
 *   or any other ADC source). Requires GCP_PROJECT.
 *
 * Both backends expose an identical generateContent / startChat surface so
 * callers are backend-agnostic. The cast to GenerativeModel is safe because
 * @google-cloud/vertexai mirrors the same interface deliberately.
 *
 * Async because the allow-list is the ChatModel table, not a compile-time
 * constant. The check is unconditional: AIModel is now `string`, so this is
 * the only thing standing between a request body and the Gemini SDK.
 */
export const getGeminiModel = async (
  modelId: string,
  options?: { json?: boolean }
): Promise<GenerativeModel> => {
  if (!(await isChatModelAllowed(modelId, 'GOOGLE'))) {
    throw new Error(`Model ${modelId} is not allowed`);
  }

  const generationConfig =
    options?.json === false ? TEXT_RESPONSE_CONFIG : JSON_RESPONSE_CONFIG;

  if (serverEnv.GEMINI_BACKEND === 'vertex') {
    const model = getVertexClient().getGenerativeModel({
      model: modelId,
      generationConfig,
      safetySettings: VERTEX_SAFETY_SETTINGS,
    });
    // Wrap so result.response.text() works — @google-cloud/vertexai's response
    // object has no .text() method unlike @google/generative-ai's.
    return wrapVertexModel(model);
  }

  return getAiStudioClient().getGenerativeModel({
    model: modelId,
    generationConfig,
    safetySettings: SAFETY_SETTINGS,
  });
};
