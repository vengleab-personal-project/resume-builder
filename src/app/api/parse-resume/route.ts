import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_AI_CONFIG, HTTP_STATUS, API_ERROR_MESSAGES } from '@/config/constants';
import { orchestrateResumeParsing } from '@/services/parseResumeOrchestrator';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const provider = (formData.get('provider') as string) || DEFAULT_AI_CONFIG.PROVIDER;
    const model = (formData.get('model') as string) || DEFAULT_AI_CONFIG.MODEL;

    if (!file && !text) {
      return NextResponse.json(
        { error: API_ERROR_MESSAGES.NO_FILE_UPLOADED }, 
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const parsedData = await orchestrateResumeParsing({ file, text, provider, model });
    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    console.error("Parse resume error:", error);
    const message = error instanceof Error ? error.message : API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    return NextResponse.json(
      { error: message }, 
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
