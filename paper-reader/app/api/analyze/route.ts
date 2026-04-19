import { NextRequest } from "next/server";
import OpenAI from "openai";
import { fetchPaperText } from "@/lib/fetchPaper";
import { buildPrompt, type AnalysisOptions } from "@/lib/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { url, depth, level } = await req.json();

  if (!url) {
    return Response.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  let paperText: string;
  try {
    paperText = await fetchPaperText(url);
  } catch {
    return Response.json(
      { error: "논문을 가져오는 데 실패했습니다. 링크를 확인해주세요." },
      { status: 422 }
    );
  }

  if (!paperText || paperText.length < 100) {
    return Response.json(
      { error: "논문 본문을 추출하지 못했습니다." },
      { status: 422 }
    );
  }

  const options: AnalysisOptions = {
    depth: (depth as AnalysisOptions["depth"]) || "medium",
    level: (level as AnalysisOptions["level"]) || "practitioner",
  };

  const prompt = buildPrompt(paperText, options);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    stream: true,
    temperature: 0.3,
    max_tokens: 3000,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
