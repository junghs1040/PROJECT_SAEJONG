import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const MAX_CHARS = 20000;

export type Figure = {
  id: string;
  url?: string;
  tableHtml?: string;
  caption: string;
  type: "figure" | "table" | "page";
};

export type DisplayEquation = {
  id: string;
  latex: string;
};

export type Section = {
  level: "section" | "subsection" | "subsubsection";
  numbering: string;
  title: string;
  text: string;
  equations: string[];
};

export type PaperMeta = {
  text: string;
  sections: Section[];
  figures: Figure[];
  equations: DisplayEquation[];
  title: string;
  isAr5iv: boolean;
};

export async function fetchPaperMeta(url: string): Promise<PaperMeta> {
  const arxivId = extractArxivId(url);

  if (arxivId) return fetchAr5iv(arxivId);

  const isPdf =
    url.endsWith(".pdf") ||
    url.includes("/pdf/") ||
    url.includes("arxiv.org/pdf");

  if (isPdf) {
    const [text, pageShots] = await Promise.all([
      fetchPdf(url),
      fetchPdfPageScreenshots(url).catch(() => [] as Figure[]),
    ]);
    return { text, sections: [], figures: pageShots, equations: [], title: "", isAr5iv: false };
  }

  const text = await fetchHtml(url);
  return { text, sections: [], figures: [], equations: [], title: "", isAr5iv: false };
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
  const title =
    $("h1.ltx_title").first().text().trim() ||
    $("title").text().replace("ar5iv", "").trim();

  // Figures: image-based
  const figures: Figure[] = [];
  $("figure.ltx_figure").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    const imgSrc = $(el).find("img").first().attr("src") ?? "";
    const caption = $(el).find("figcaption").text().trim();
    if (imgSrc && caption) {
      const fullUrl = imgSrc.startsWith("http") ? imgSrc : `https://ar5iv.org${imgSrc}`;
      figures.push({ id, url: fullUrl, caption, type: "figure" });
    }
  });

  // Tables: HTML-based
  $("figure.ltx_table").each((_, el) => {
    const id = $(el).attr("id") ?? "";
    const caption = $(el).find("figcaption").text().trim();
    const tableEl = $(el).find("table").first();
    if (!tableEl.length || !caption) return;
    tableEl.find("math").each((__, m) => {
      const alt = $(m).attr("alttext") ?? "";
      $(m).replaceWith(alt);
    });
    const tableHtml = $.html(tableEl);
    figures.push({ id, tableHtml, caption, type: "table" });
  });

  // Display equations
  const equations: DisplayEquation[] = [];
  $("math[display='block']").each((_, el) => {
    const latex = $(el).find("annotation[encoding='application/x-tex']").text().trim();
    const id = $(el).attr("id") ?? `eq-${equations.length + 1}`;
    if (latex) equations.push({ id, latex });
  });

  // Section structure: extract each section/subsection with its text + equations
  const sections: Section[] = [];
  const sectionSelectors = [
    { selector: "section.ltx_section", level: "section" as const },
    { selector: "section.ltx_subsection", level: "subsection" as const },
    { selector: "section.ltx_subsubsection", level: "subsubsection" as const },
  ];

  // Use ltx_section elements to get structured content
  $("section.ltx_section, section.ltx_subsection, section.ltx_subsubsection").each((_, el) => {
    const elClass = $(el).attr("class") ?? "";
    const level: Section["level"] = elClass.includes("ltx_subsubsection")
      ? "subsubsection"
      : elClass.includes("ltx_subsection")
      ? "subsection"
      : "section";

    const titleEl = $(el).children(".ltx_title").first();
    const numbering = titleEl.find(".ltx_tag").first().text().trim();
    const sectionTitle = titleEl.text().replace(numbering, "").trim();

    if (!sectionTitle || sectionTitle === "References" || sectionTitle === "Acknowledgments") return;

    // Extract section equations
    const sectionEqs: string[] = [];
    $(el).find("math[display='block']").each((__, mathEl) => {
      const latex = $(mathEl).find("annotation[encoding='application/x-tex']").text().trim();
      if (latex) sectionEqs.push(latex);
    });

    // Extract section text (replace math with alttext)
    const clone = $(el).clone();
    clone.find(".ltx_bibliography, figure, .ltx_section, .ltx_subsection, .ltx_subsubsection").remove();
    clone.find("math").each((__, m) => {
      const alt = $(m).attr("alttext") ?? "";
      $(m).replaceWith(`$${alt}$`);
    });
    const sectionText = clone.text().replace(/\s+/g, " ").trim().slice(0, 1500);

    sections.push({ level, numbering, title: sectionTitle, text: sectionText, equations: sectionEqs });
  });

  // Full text fallback
  $("script, style, .ltx_bibliography, nav").remove();
  $("math").each((_, el) => {
    const alttext = $(el).attr("alttext") ?? "";
    $(el).replaceWith(`$${alttext}$`);
  });
  const text = clean($("article").text() || $("body").text());

  return {
    text,
    sections: sections.slice(0, 40),
    figures: figures.slice(0, 20),
    equations: equations.slice(0, 30),
    title,
    isAr5iv: true,
  };
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });
  const $ = cheerio.load(data);
  $("script, style, nav, footer, header").remove();
  return clean($("article").text() || $("main").text() || $("body").text());
}

async function fetchPdf(url: string): Promise<string> {
  const { data } = await fetchPdfBuffer(url);
  const parser = new PDFParse({ data: Buffer.from(data) });
  const result = await parser.getText();
  await parser.destroy();
  return clean(result.text);
}

export async function fetchPdfBuffer(url: string): Promise<{ data: ArrayBuffer }> {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });
  return { data };
}

export async function fetchPdfPageScreenshots(url: string): Promise<Figure[]> {
  const { data } = await fetchPdfBuffer(url);
  const parser = new PDFParse({ data: Buffer.from(data) });

  const pagesToRender = 20;
  const figures: Figure[] = [];

  try {
    const result = await parser.getScreenshot({ last: pagesToRender });
    for (const page of result.pages) {
      if (page.dataUrl) {
        figures.push({
          id: `page-${page.pageNumber}`,
          url: page.dataUrl,
          caption: `Page ${page.pageNumber}`,
          type: "page",
        });
      }
    }
  } catch { /* canvas 없는 경우 등 */ }

  await parser.destroy();
  return figures;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
}
