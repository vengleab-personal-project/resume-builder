
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '@/lib/ai-config';
import { ENV } from '@/config/env';
import { AI_PROVIDERS, DEFAULT_AI_CONFIG } from '@/config/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: false,
});

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || 'dummy-key');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const provider = (formData.get('provider') as string) || DEFAULT_AI_CONFIG.PROVIDER;
    const model = (formData.get('model') as string) || DEFAULT_AI_CONFIG.MODEL;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";

    // 1. Extract Text
    if (file.type === "application/pdf") {
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const pdf = require('pdf-parse/lib/pdf-parse.js');
        const pdfData = await pdf(buffer);
        rawText = pdfData.text;
      } catch (e: unknown) {
        console.error("PDF Parse Error:", e);
        return NextResponse.json({ error: "PDF parsing is not supported on this server environment." }, { status: 500 });
      }
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (file.type === "text/plain") {
      rawText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: "Unsupported file format." }, { status: 400 });
    }

    // 2. AI Parsing
    if (provider === AI_PROVIDERS.GOOGLE) {
      if (!ENV.GEMINI_API_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
      }

      try {
        const geminiModel = genAI.getGenerativeModel({ 
          model: model === 'gemini-3-flash' ? 'gemini-3-flash-preview' : (model || "gemini-3-flash-preview") 
        });
        const prompt = `${SYSTEM_PROMPT}\n\nHere is the resume text:\n\n${rawText}`;

        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        });

        const response = await result.response;
        const text = response.text();
        const parsedData = JSON.parse(text);
        return NextResponse.json(parsedData);
      } catch (geminiError) {
        console.error("Gemini Error:", geminiError);
        return NextResponse.json({ error: "Failed to parse with Gemini: " + (geminiError as Error).message }, { status: 500 });
      }
    } else {
      // Default to OpenAI
      if (!ENV.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Returning mock data.");
        return NextResponse.json(mockResponse(rawText));
      }

      try {
        const completion = await openai.chat.completions.create({
          model: model || DEFAULT_AI_CONFIG.MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Here is the resume text:\n\n${rawText}` }
          ],
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from AI");

        const parsedData = JSON.parse(content);
        return NextResponse.json(parsedData);
      } catch (aiError) {
        console.error("OpenAI Error:", aiError);
        return NextResponse.json({ error: "Failed to parse with OpenAI: " + (aiError as Error).message }, { status: 500 });
      }
    }

  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// Mock fallback for when no API key is present
function mockResponse(text: string) {
  return {
    personalInfo: {
      name: "Mock User (AI Key Missing)",
      email: "mock@example.com",
      phone: "123-456-7890",
      address: "Mock City, MK",
      summary: "This is a mock summary because OPENAI_API_KEY was not found. " + text.slice(0, 50) + "..."
    },
    education: [],
    experience: [],
    skills: ["Mock Skill 1", "Mock Skill 2"],
    certifications: [],
    publications: []
  };
}
