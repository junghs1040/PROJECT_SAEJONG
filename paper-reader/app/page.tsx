"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = {
  depth: [
    { value: "short", label: "짧게" },
    { value: "medium", label: "보통" },
    { value: "deep", label: "자세히" },
  ],
  level: [
    { value: "beginner", label: "입문자" },
    { value: "practitioner", label: "엔지니어" },
    { value: "researcher", label: "연구자" },
  ],
};

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState("medium");
  const [level, setLevel] = useState("practitioner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams({ url, depth, level });
    router.push(`/result?${params.toString()}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">

        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Paper Reader
          </h1>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            논문 링크를 붙여넣으면 기술적인 요약과 상세 설명을 드립니다
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arxiv.org/abs/..."
              required
              className="w-full px-5 py-4 pr-14 rounded-xl border text-sm outline-none transition-all duration-200"
              style={{
                borderColor: url ? "var(--sky)" : "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "#fff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--sky)")}
              onBlur={(e) =>
                (e.target.style.borderColor = url ? "var(--sky)" : "var(--border)")
              }
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: "var(--sky)" }}
            >
              {loading ? (
                <LoadingDots />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8H13M13 8L9 4M13 8L9 12"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Options */}
          <div className="flex gap-3 justify-center flex-wrap">
            <SelectOption
              value={depth}
              onChange={setDepth}
              options={OPTIONS.depth}
              label="요약 깊이"
            />
            <SelectOption
              value={level}
              onChange={setLevel}
              options={OPTIONS.level}
              label="사용자 수준"
            />
          </div>
        </form>

        {error && (
          <p className="text-sm" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <p className="text-xs" style={{ color: "var(--text-placeholder)" }}>
          지원: arXiv, Semantic Scholar, PubMed, 직접 PDF 링크
        </p>
      </div>
    </main>
  );
}

function SelectOption({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm cursor-pointer outline-none"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--surface)",
        }}
      >
        <optgroup label={label}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      </select>
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs"
        style={{ color: "var(--text-placeholder)" }}
      >
        ▾
      </span>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
