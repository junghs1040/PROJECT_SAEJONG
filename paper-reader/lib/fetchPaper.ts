import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const MAX_CHARS = 14000;

export type Figure = {
  id: string;
  url: string;
  caption: string;
};

export type DisplayEquation = {
  id: string;
  latex: string;
};

export type PaperMeta = {
  text: string;
  figures: Figure[];
  equations: DisplayEquation[];
  title: string;
  isAr5iv: boolean;
};

export async function fetchPaperMeta(url: string): Promise<PaperMeta> {
  const arxivId = extractArxivId(url);

  if (arxivId) {
    return fetchAr5iv(arxivId);
  }

  const isPdf =
    url.endsWith(".pdf") ||
    url.includes("/pdf/") ||
    url.includes("arxiv.org/pdf");

  if (isPdf) {
    const text = await fetchPdf(url);
    return { text, figures: [], equations: [], title: "", isAr5iv: false };
  }

  const text = await fetchHtml(url);
  return { text, figures: [], equations: [], title: "", isAr5iv: false };
}

function extractArxivId(url: string): string | null {
  const m = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
  return m ? m[1] : null;
}

async function fetchAr5iv(arxivId: string): Promise<PaperMeta> {
  const ar5ivUrl = `https://ar5iv.org/abs/${arxivId}`;
  const { data } = await axios.get(ar5ivUrl, {
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });

  const $ = cheerio.load(data);

  // Title
  const title = $("h1.ltx_title").first().text().trim() ||
    $("title").text().replace("ar5iv", "").trim();

  // Figures + Tables: extract id, image url, caption
  const figures: Figure[] = [];
  $("figure.ltx_figure, figure.ltx_table").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    const imgSrc = $(el).find("img").first().attr("src") ?? "";
    const caption = $(el).find("figcaption").text().trim();

    if (imgSrc && caption) {
      const fullUrl = imgSrc.startsWith("http")
        ? imgSrc
        : `https://ar5iv.org${imgSrc}`;
      figures.push({ id, url: fullUrl, caption });
    }
  });

  // Display equations: extract LaTeX from alttext of display math
  const equations: DisplayEquation[] = [];
  $("math[display='block']").each((_, el) => {
    const latex = $(el).find("annotation[encoding='application/x-tex']").text().trim();
    const id = $(el).attr("id") ?? `eq-${equations.length + 1}`;
    if (latex) equations.push({ id, latex });
  });

  // Text: remove scripts, styles, math clutter, keep meaningful content
  $("script, style, .ltx_bibliography, .ltx_appendix nav").remove();
  $("math").each((_, el) => {
    const alttext = $(el).attr("alttext") ?? "";
    $(el).replaceWith(`$${alttext}$`);
  });

  const text = clean($("article").text() || $("body").text());

  return { text, figures: figures.slice(0, 20), equations: equations.slice(0, 20), title, isAr5iv: true };
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });

  const $ = cheerio.load(data);
  $("script, style, nav, footer, header").remove();

  const text =
    $("article").text() ||
    $("main").text() ||
    $("body").text();

  return clean(text);
}

async function fetchPdf(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });

  const parser = new PDFParse({ data: Buffer.from(data) });
  const result = await parser.getText();
  await parser.destroy();
  return clean(result.text);
}

function clean(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}
