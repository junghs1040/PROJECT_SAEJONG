"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { Figure } from "@/lib/fetchPaper";

type PaperMeta = {
  title: string;
  figures: Figure[];
  isAr5iv: boolean;
};

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") ?? "";
  const depth = searchParams.get("depth") ?? "medium";
  const level = searchParams.get("level") ?? "practitioner";

  const [meta, setMeta] = useState<PaperMeta | null>(null);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) { router.push("/"); return; }

    // Fetch figures/meta in parallel with streaming analysis
    fetch("/api/paper-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => setMeta(data))
      .catch(() => {});

    let cancelled = false;

    async function runStream() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, depth, level }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "분석 중 오류");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          setOutput((prev) => prev + decoder.decode(value, { stream: true }));
        }
        if (!cancelled) setStatus("done");
      } catch (e: unknown) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "알 수 없는 오류");
          setStatus("error");
        }
      }
    }

    runStream();
    return () => { cancelled = true; };
  }, [url, depth, level, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: "#fff", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          새 논문 분석
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {meta?.title || "Paper Reader"}
        </span>
        <StatusBadge status={status} />
      </header>

      <div
        className="px-6 py-2 border-b text-xs truncate"
        style={{ borderColor: "var(--border)", color: "var(--text-placeholder)" }}
      >
        {url}
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Figures panel */}
        {meta && meta.figures.length > 0 && (
          <FiguresPanel figures={meta.figures} />
        )}

        {/* Analysis output */}
        {status === "error" ? (
          <div className="rounded-xl p-6 border text-sm" style={{ borderColor: "#fca5a5", backgroundColor: "#fef2f2", color: "#dc2626" }}>
            <strong>오류:</strong> {errorMsg}
          </div>
        ) : (
          <>
            <MarkdownResult text={output} figures={meta?.figures ?? []} />
            {status === "loading" && output.length === 0 && <SkeletonLoader />}
            {status === "loading" && output.length > 0 && (
              <span className="inline-block w-2 h-4 animate-pulse rounded-sm" style={{ backgroundColor: "var(--sky)" }} />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </main>
    </div>
  );
}

function FiguresPanel({ figures }: { figures: Figure[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? figures : figures.slice(0, 3);

  return (
    <section className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="px-5 py-3 border-l-4 flex items-center justify-between"
        style={{ borderLeftColor: "var(--sky)", backgroundColor: "var(--surface)", borderBottomColor: "var(--border)", borderBottomWidth: 1 }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          논문 피겨 ({figures.length}개)
        </h2>
        {figures.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs"
            style={{ color: "var(--sky)" }}
          >
            {expanded ? "접기" : `전체 보기 (${figures.length})`}
          </button>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((fig) => (
          <FigureCard key={fig.id} fig={fig} />
        ))}
      </div>
    </section>
  );
}

function FigureCard({ fig }: { fig: Figure }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const num = fig.caption.match(/Figure\s*(\d+)/i)?.[1] ?? "";

  return (
    <div className="flex flex-col gap-2 rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="relative bg-gray-50 flex items-center justify-center" style={{ minHeight: 140 }}>
        {!error ? (
          <img
            src={fig.url}
            alt={fig.caption}
            className="w-full object-contain"
            style={{ maxHeight: 220, opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        ) : (
          <span className="text-xs" style={{ color: "var(--text-placeholder)" }}>이미지 로드 실패</span>
        )}
        {!loaded && !error && (
          <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: "var(--border)" }} />
        )}
      </div>
      <p className="px-3 pb-3 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
        {num && <strong style={{ color: "var(--sky)" }}>Fig.{num} </strong>}
        {fig.caption.replace(/^Figure\s*\d+[:\s]*/i, "")}
      </p>
    </div>
  );
}

function MarkdownResult({ text, figures }: { text: string; figures: Figure[] }) {
  if (!text) return null;

  const sections = text.split(/^(##\s.+)$/m).filter(Boolean);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i].trim();
    if (s.startsWith("## ")) {
      const title = s.replace(/^##\s/, "");
      const content = sections[i + 1] ?? "";
      i++;

      // Find referenced figures in this section
      const referencedFigs = figures.filter((f) => {
        const num = f.caption.match(/Figure\s*(\d+)/i)?.[1];
        return num && content.includes(`Figure ${num}`);
      });

      elements.push(
        <section key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div
            className="px-5 py-3 border-l-4"
            style={{ borderLeftColor: "var(--sky)", backgroundColor: "var(--surface)", borderBottomColor: "var(--border)", borderBottomWidth: 1 }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</h2>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <RichText text={content.trim()} />
            {referencedFigs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {referencedFigs.map((f) => <FigureCard key={f.id} fig={f} />)}
              </div>
            )}
          </div>
        </section>
      );
    } else if (s) {
      elements.push(
        <div key={i}>
          <RichText text={s} />
        </div>
      );
    }
  }

  return <div className="flex flex-col gap-4">{elements}</div>;
}

function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" />;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--sky)" }} />
              <span className="text-sm leading-7"><MathLine text={line.replace(/^[-•]\s/, "")} /></span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-7">
            <MathLine text={line} />
          </p>
        );
      })}
    </div>
  );
}

function MathLine({ text }: { text: string }) {
  // Split by $$...$$ (block) then $...$ (inline)
  const parts = splitMath(text);
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "block-math") {
          return <BlockMath key={i} latex={part.content} />;
        }
        if (part.type === "inline-math") {
          return <InlineMath key={i} latex={part.content} />;
        }
        return <span key={i} style={{ color: "var(--foreground)" }}>{part.content}</span>;
      })}
    </>
  );
}

type Part = { type: "text" | "inline-math" | "block-math"; content: string };

function splitMath(text: string): Part[] {
  const parts: Part[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const blockIdx = remaining.indexOf("$$");
    const inlineIdx = remaining.indexOf("$");

    if (blockIdx !== -1 && (inlineIdx === blockIdx)) {
      // block math $$...$$
      const end = remaining.indexOf("$$", blockIdx + 2);
      if (end !== -1) {
        if (blockIdx > 0) parts.push({ type: "text", content: remaining.slice(0, blockIdx) });
        parts.push({ type: "block-math", content: remaining.slice(blockIdx + 2, end) });
        remaining = remaining.slice(end + 2);
        continue;
      }
    }

    if (inlineIdx !== -1) {
      const end = remaining.indexOf("$", inlineIdx + 1);
      if (end !== -1 && end !== inlineIdx + 1) {
        if (inlineIdx > 0) parts.push({ type: "text", content: remaining.slice(0, inlineIdx) });
        parts.push({ type: "inline-math", content: remaining.slice(inlineIdx + 1, end) });
        remaining = remaining.slice(end + 1);
        continue;
      }
    }

    parts.push({ type: "text", content: remaining });
    break;
  }

  return parts;
}

function InlineMath({ latex }: { latex: string }) {
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="text-xs px-1 rounded" style={{ backgroundColor: "var(--surface)" }}>{latex}</code>;
  }
}

function BlockMath({ latex }: { latex: string }) {
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
    return (
      <div
        className="overflow-x-auto py-3 px-4 rounded-lg my-2"
        style={{ backgroundColor: "var(--surface)", borderLeft: `3px solid var(--sky)` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <pre className="text-xs p-2 rounded" style={{ backgroundColor: "var(--surface)" }}>{latex}</pre>;
  }
}

function StatusBadge({ status }: { status: "loading" | "done" | "error" }) {
  if (status === "loading") return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sky)" }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--sky)" }} />
      분석 중
    </span>
  );
  if (status === "done") return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
      완료
    </span>
  );
  return <span className="text-xs" style={{ color: "#ef4444" }}>오류</span>;
}

function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div key={i} className="h-4 rounded" style={{ width: `${w}%`, backgroundColor: "var(--border)" }} />
      ))}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen text-sm" style={{ color: "var(--text-secondary)" }}>
        로딩 중...
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
