
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { REFINEMENT_PROMPT } from '@/lib/ai-config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export async function POST(req: NextRequest) {
  try {
    const { instruction, content, schema } = await req.json();

    const systemPrompt = REFINEMENT_PROMPT
      .replace('{instruction}', instruction)
      .replace('{content}', typeof content === 'string' ? content : JSON.stringify(content));

    // Prefer Gemini if key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { geminiModel, geminiTextModel } = await import('@/services/gemini');
        const isJson = instruction.includes("JSON");
        const model = isJson ? geminiModel : geminiTextModel;

        const prompt = `${systemPrompt}\n\n${isJson ? `Refine/Generate and return as JSON matching this schema: ${JSON.stringify(schema)}` : "Refine the content directly."}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (isJson) {
           return NextResponse.json(JSON.parse(text));
        }
        return NextResponse.json({ result: text.trim() });
      } catch (geminiError) {
        console.error("Gemini Refine Error:", geminiError);
        return NextResponse.json({ error: "Gemini failed." }, { status: 500 });
      }
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: instruction.includes("JSON") 
              ? `Refine/Generate and return as JSON matching this schema: ${JSON.stringify(schema)}`
              : "Refine the content directly."
          }
        ],
        temperature: 0.7,
        response_format: instruction.includes("JSON") ? { type: "json_object" } : { type: "text" }
      });

      const result = completion.choices[0].message.content;
      
      if (instruction.includes("JSON")) {
        return NextResponse.json(JSON.parse(result || '{}'));
      }
      return NextResponse.json({ result: result?.trim() });
    }

    return NextResponse.json({ 
      result: "AI Key Missing. This is a mock response to: " + instruction 
    });

  } catch (error) {
    console.error("Refine API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
