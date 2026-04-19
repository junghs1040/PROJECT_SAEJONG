import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const MAX_CHARS = 12000;

export async function fetchPaperText(url: string): Promise<string> {
  const isPdf =
    url.endsWith(".pdf") ||
    url.includes("/pdf/") ||
    url.includes("arxiv.org/pdf");

  if (isPdf) {
    return fetchPdf(url);
  }

  const htmlUrl = toHtmlUrl(url);
  return fetchHtml(htmlUrl);
}

function toHtmlUrl(url: string): string {
  if (url.includes("arxiv.org/pdf/")) {
    return url.replace("arxiv.org/pdf/", "arxiv.org/abs/").replace(/\.pdf$/, "");
  }
  return url;
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0 PaperReader/1.0" },
  });

  const $ = cheerio.load(data);
  $("script, style, nav, footer, header, .ads, #ads").remove();

  const text =
    $("article").text() ||
    $("main").text() ||
    $(".abstract").text() + $(".paper-content").text() ||
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
    .replace(/[^\S\n]+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}
