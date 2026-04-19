"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") ?? "";
  const depth = searchParams.get("depth") ?? "medium";
  const level = searchParams.get("level") ?? "practitioner";

  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, depth, level }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "분석 중 오류가 발생했습니다.");
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

    run();
    return () => { cancelled = true; };
  }, [url, depth, level, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: "#fff", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 4L6 8L10 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          새 논문 분석
        </button>

        <span
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Paper Reader
        </span>

        <StatusBadge status={status} />
      </header>

      {/* URL display */}
      <div
        className="px-6 py-3 border-b text-xs truncate"
        style={{ borderColor: "var(--border)", color: "var(--text-placeholder)" }}
      >
        {url}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {status === "error" ? (
          <div
            className="rounded-xl p-6 border text-sm"
            style={{ borderColor: "#fca5a5", backgroundColor: "#fef2f2", color: "#dc2626" }}
          >
            <strong>오류:</strong> {errorMsg}
          </div>
        ) : (
          <>
            <MarkdownResult text={output} />
            {status === "loading" && output.length === 0 && <SkeletonLoader />}
            {status === "loading" && output.length > 0 && (
              <span
                className="inline-block w-2 h-4 ml-1 animate-pulse rounded-sm"
                style={{ backgroundColor: "var(--sky)" }}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: "loading" | "done" | "error" }) {
  if (status === "loading") {
    return (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sky)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--sky)" }} />
        분석 중
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        완료
      </span>
    );
  }
  return <span className="text-xs" style={{ color: "#ef4444" }}>오류</span>;
}

function MarkdownResult({ text }: { text: string }) {
  if (!text) return null;

  const sections = text.split(/^(##\s.+)$/m).filter(Boolean);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i].trim();
    if (s.startsWith("## ")) {
      const title = s.replace(/^##\s/, "");
      const content = sections[i + 1] ?? "";
      i++;
      elements.push(
        <section
          key={i}
          className="mb-6 rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="px-5 py-3 border-l-4 flex items-center gap-2"
            style={{
              borderLeftColor: "var(--sky)",
              backgroundColor: "var(--surface)",
              borderBottomColor: "var(--border)",
              borderBottomWidth: 1,
            }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {title}
            </h2>
          </div>
          <div className="px-5 py-4">
            <FormattedText text={content.trim()} />
          </div>
        </section>
      );
    } else if (s) {
      elements.push(
        <div key={i} className="mb-4">
          <FormattedText text={s} />
        </div>
      );
    }
  }

  return <div>{elements}</div>;
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--sky)" }} />
              <span className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
                {line.replace(/^[-•]\s/, "")}
              </span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{ width: `${w}%`, backgroundColor: "var(--border)" }}
        />
      ))}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm" style={{ color: "var(--text-secondary)" }}>로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
