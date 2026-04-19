import { NextRequest } from "next/server";
import { fetchPaperMeta } from "@/lib/fetchPaper";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return Response.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  try {
    const meta = await fetchPaperMeta(url);
    return Response.json({
      title: meta.title,
      figures: meta.figures,
      equations: meta.equations,
      sections: meta.sections,
      isAr5iv: meta.isAr5iv,
    });
  } catch {
    return Response.json({ error: "논문 메타데이터를 가져오지 못했습니다." }, { status: 422 });
  }
}
