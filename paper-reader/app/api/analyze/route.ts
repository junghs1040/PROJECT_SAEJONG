import { NextRequest } from "next/server";
import OpenAI from "openai";
import { fetchPaperMeta } from "@/lib/fetchPaper";
import { buildPrompt, type AnalysisOptions } from "@/lib/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { url, depth, level } = await req.json();

  if (!url) {
    return Response.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  let meta: Awaited<ReturnType<typeof fetchPaperMeta>>;
  try {
    meta = await fetchPaperMeta(url);
  } catch {
    return Response.json(
      { error: "논문을 가져오는 데 실패했습니다. 링크를 확인해주세요." },
      { status: 422 }
    );
  }

  if (!meta.text || meta.text.length < 100) {
    return Response.json({ error: "논문 본문을 추출하지 못했습니다." }, { status: 422 });
  }

  const options: AnalysisOptions = {
    depth: (depth as AnalysisOptions["depth"]) || "medium",
    level: (level as AnalysisOptions["level"]) || "practitioner",
  };

  const prompt = buildPrompt(meta.text, options, meta.figures, meta.equations, meta.sections);

  let stream: Awaited<ReturnType<typeof openai.chat.completions.create>>;
  try {
    stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      stream: true,
      temperature: 0.3,
      max_tokens: 16000,
    });
  } catch (e: unknown) {
    const msg =
      e instanceof Error && e.message.includes("429")
        ? "OpenAI API 할당량이 초과되었습니다. 결제 정보를 확인해주세요."
        : e instanceof Error && e.message.includes("401")
        ? "OpenAI API 키가 유효하지 않습니다."
        : "GPT 호출 중 오류가 발생했습니다.";
    return Response.json({ error: msg }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
