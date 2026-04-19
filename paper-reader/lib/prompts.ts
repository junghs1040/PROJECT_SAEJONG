import type { Figure, DisplayEquation, Section } from "./fetchPaper";

export type AnalysisOptions = {
  depth: "short" | "medium" | "deep";
  level: "beginner" | "practitioner" | "researcher";
};

const LEVEL_INSTRUCTION: Record<string, string> = {
  beginner: "비전공자도 이해할 수 있도록 쉬운 용어와 직관적인 비유를 곁들여 설명",
  practitioner: "구현 관점에서 실용적인 포인트와 함께 설명",
  researcher: "novelty, assumption, limitation, 기존 연구 대비 차별점까지 포함하여 설명",
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

  const sectionContext =
    sections.length > 0
      ? `\n[논문 섹션 구조]\n` +
        sections
          .map((s) => {
            const indent = s.level === "subsubsection" ? "    " : s.level === "subsection" ? "  " : "";
            const eqNote = s.equations.length > 0 ? ` [수식 ${s.equations.length}개]` : "";
            return `${indent}${s.numbering} ${s.title}${eqNote}`;
          })
          .join("\n")
      : "";

  const equationContext =
    sections.filter((s) => s.equations.length > 0).length > 0
      ? `\n[섹션별 수식]\n` +
        sections
          .filter((s) => s.equations.length > 0)
          .map(
            (s) =>
              `[${s.numbering} ${s.title}]\n` +
              s.equations.map((eq, i) => `  수식${i + 1}: $$${eq}$$`).join("\n")
          )
          .join("\n\n")
      : equations.length > 0
      ? `\n[수식]\n` + equations.map((e, i) => `$$${e.latex}$$`).join("\n")
      : "";

  return `당신은 논문 번역 및 해설 전문가입니다.
아래 논문을 한국어로 번역하는 수준의 상세한 해설 리포트를 작성하세요.

[핵심 원칙]
- 요약 금지. 논문의 모든 내용을 빠짐없이 옮길 것
- 논문에 있는 내용을 한국어로 번역하듯 상세하게 풀어쓸 것
- 독자가 논문을 직접 읽지 않아도 모든 내용을 이해할 수 있을 정도의 완성도
- 대상 독자: ${LEVEL_INSTRUCTION[options.level]}
- 수식은 반드시 LaTeX로: 인라인은 $수식$, 블록은 $$수식$$
- 문장 종결은 명사형으로
- Figure/Table 참조 시 번호 명시
- 아래 기호로 계층 구조 표현:
  ◆ 핵심 포인트  > 인과/결론  ▷ 세부 부연  → 흐름/단계  ※ 주의사항  - 항목
${figureContext}
${sectionContext}
${equationContext}

[섹션별 작성 지침] — 아래 지침을 따르되 지침 문장 자체는 출력하지 말 것.
- 한 줄 요약: 논문 전체를 한 문장으로
- 이 논문이 중요한 이유: ◆ 핵심 문제와 파급력  ▷ 학계/산업 주목 이유  > 기존 연구 대비 차별점
- 배경 및 동기: 기존 방법의 한계와 이 연구의 필요성을 흐름/인과관계 중심으로 상세히 서술
- 핵심 기여: 각 기여를 ◆ 기호로 구체적 근거와 함께 서술
- 방법론 개요: 전체 파이프라인을 → 기호로 단계별 서술
- 기술적 상세: [논문 섹션 구조]의 모든 섹션/서브섹션을 ### 블록으로 빠짐없이 다룰 것. 각 블록은 **배경/동기** **핵심 내용** **수식** **수식 해설** **Figure 참조** 순서로 작성
- 실험 결과 분석: 각 Table/Figure를 ### 블록으로 작성. 실험 설정, 주요 수치, baseline 대비 차이, 의미, 예외 패턴 포함
- 강점: ◆ 기호로 근거와 함께
- 한계점: - 기호로 각 한계와 이유, ▷ 기호로 실제 적용 시 문제
- 구현 시 고려사항: → 기호로 단계별, ※ 기호로 주의사항

---

[출력 형식] — 아래 헤더 구조만 그대로 사용하여 작성할 것.

## 한 줄 요약

## 이 논문이 중요한 이유

## 배경 및 동기

## 핵심 기여 (Key Contributions)

## 방법론 개요

## 기술적 상세 (Technical Deep Dive)

### [번호] [섹션 제목]
**배경/동기:**
**핵심 내용:**
**수식:**
**수식 해설:**
**Figure 참조:**

## 실험 결과 분석

### [실험/Table/Figure 이름]

## 강점

## 한계점

## 구현 시 고려사항

---

[논문 본문]
${text}`;
}
