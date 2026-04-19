import type { Figure, DisplayEquation, Section } from "./fetchPaper";

export type AnalysisOptions = {
  depth: "short" | "medium" | "deep";
  level: "beginner" | "practitioner" | "researcher";
};

const LEVEL_INSTRUCTION: Record<string, string> = {
  beginner: "비전공자도 이해할 수 있도록 쉬운 용어와 직관적인 비유 사용",
  practitioner: "구현 관점에서 실용적인 포인트 중심으로 설명",
  researcher: "novelty, assumption, limitation, 기존 연구 대비 차별점 중심 분석",
};

export function buildPrompt(
  text: string,
  options: AnalysisOptions,
  figures: Figure[],
  equations: DisplayEquation[],
  sections: Section[]
): string {
  const figureContext =
    figures.length > 0
      ? `\n[논문 피겨/테이블 목록]\n` +
        figures.map((f) => `- ${f.id}: ${f.caption}`).join("\n")
      : "";

  // 섹션 구조 + 각 섹션의 수식 목록
  const sectionContext =
    sections.length > 0
      ? `\n[논문 섹션 구조 — 기술적 상세 작성 시 이 모든 섹션을 빠짐없이 다룰 것]\n` +
        sections
          .map((s) => {
            const indent = s.level === "subsubsection" ? "    " : s.level === "subsection" ? "  " : "";
            const eqNote = s.equations.length > 0 ? ` [수식 ${s.equations.length}개 포함]` : "";
            return `${indent}${s.numbering} ${s.title}${eqNote}`;
          })
          .join("\n")
      : "";

  const allSectionEquations =
    sections.length > 0
      ? sections
          .filter((s) => s.equations.length > 0)
          .map(
            (s) =>
              `[${s.numbering} ${s.title}]\n` +
              s.equations.map((eq, i) => `  수식${i + 1}: $$${eq}$$`).join("\n")
          )
          .join("\n\n")
      : "";

  const equationContext = allSectionEquations
    ? `\n[섹션별 수식 목록 — 모두 설명에 포함할 것]\n${allSectionEquations}`
    : equations.length > 0
    ? `\n[논문 주요 수식]\n` + equations.map((e, i) => `수식${i + 1}: $$${e.latex}$$`).join("\n")
    : "";

  return `당신은 최고 수준의 논문 분석 전문가입니다.
아래 논문을 분석하여 구조화된 리포트를 한국어로 작성하세요.

[공통 지침]
- 대상 독자: ${LEVEL_INSTRUCTION[options.level]}
- 수식은 반드시 LaTeX로: 인라인 $수식$, 블록 $$수식$$
- Figure/Table 참조 시 번호 명시 (예: "Figure 1 참조", "Table 2 참조")
- 문장 종결은 명사형으로. "~이다" "~한다" 금지. 예: "높은 성능을 달성", "기존 대비 개선된 결과"
${figureContext}
${sectionContext}
${equationContext}

---

[출력 형식] 아래 섹션을 순서대로 작성:

## 한 줄 요약
(논문 핵심을 한 문장으로)

## 왜 이 논문이 중요한가
(문제의식, 기존 한계, 이 논문의 필요성)

## 핵심 기여 (Key Contributions)
(bullet 3~5개)

## 방법론 개요 (Method Overview)
(전체 아이디어와 파이프라인 흐름)

## 기술적 상세 (Technical Deep Dive)
중요: 위의 [논문 섹션 구조]에 있는 모든 섹션을 빠짐없이 다룰 것.
각 섹션마다 아래 형식으로 블록 작성:

### [섹션 번호] [섹션 제목]
**핵심 아이디어:** 이 섹션이 다루는 핵심 개념 (한두 문장)
**수식:**
$$해당 섹션의 수식 — 반드시 모두 포함$$
**수식 풀이:** 각 기호의 의미와 수식이 하는 일을 단계별로 설명
**직관적 이해:** 왜 이렇게 설계했는지
**Figure 참조:** 관련 Figure/Table 있으면 번호 명시

수식이 없는 섹션도 핵심 아이디어와 직관적 이해는 반드시 작성.

## 실험 결과 분석
각 표/그래프별로 블록 작성:

### [표 또는 그래프 이름]
Table N 참조 또는 Figure N 참조
- 핵심 수치와 의미
- baseline 대비 차이점
- 왜 이 결과가 중요한지
- 주목할 만한 패턴이나 예외

## 강점
(bullet)

## 한계점 및 비판적 관점
(bullet)

## 구현 시 고려사항
(bullet)

---

[논문 본문]
${text}`;
}
