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

  return `당신은 최고 수준의 논문 분석 전문가이자 교육자입니다.
아래 논문을 읽고 독자가 내용을 완전히 이해할 수 있도록 상세한 설명 리포트를 한국어로 작성하세요.

[핵심 원칙]
- 요약이 아니라 이해를 위한 설명. 단순히 "무엇을 했다"가 아니라 "왜", "어떻게", "무슨 의미인지"까지 풀어서 설명
- 대상 독자: ${LEVEL_INSTRUCTION[options.level]}
- 수식은 반드시 LaTeX로: 인라인 $수식$, 블록 $$수식$$
- 문장 종결은 명사형으로. "~이다" "~한다" 금지
- Figure/Table 참조 시 번호 명시

[서술 형식]
아래 기호를 적극적으로 사용하여 계층 구조와 흐름을 명확하게 표현할 것:
- (하이픈): 항목 나열
> (꺾쇠): 인과관계, 흐름, 결론 도출
▷ (삼각형): 세부 설명, 부연
◆ (다이아몬드): 핵심 포인트, 강조
→ (화살표): 단계 흐름, 입출력 관계
※ (참고): 주의사항, 보충 설명

하나의 개념을 설명할 때 여러 기호를 조합하여 입체적으로 서술할 것.
예시:
- Self-Attention 메커니즘
  > 각 토큰이 문장 내 다른 모든 토큰과의 관계를 계산
  ▷ Query, Key, Value 세 벡터로 분해하여 처리
  ◆ 병렬 처리 가능 → RNN의 순차 처리 한계 극복
  ※ 시퀀스 길이 $n$에 대해 $O(n^2)$ 복잡도 존재

${figureContext}
${sectionContext}
${equationContext}

---

[출력 형식] 아래 섹션을 순서대로 작성:

## 한 줄 요약
(논문 핵심을 한 문장으로)

## 왜 이 논문이 중요한가
기존 방법의 한계와 이 논문이 해결하는 문제를 구체적으로 설명.
> 기존 방법 → 한계 → 이 논문의 해결 방식 흐름으로 서술

## 핵심 기여 (Key Contributions)
◆ 표기로 기여 항목 나열, 각 항목마다 왜 중요한지 한두 줄 부연

## 방법론 개요 (Method Overview)
전체 파이프라인을 → 흐름으로 설명하고, 각 단계의 역할을 ▷로 부연

## 기술적 상세 (Technical Deep Dive)
중요: [논문 섹션 구조]의 모든 섹션을 빠짐없이 다룰 것.
각 섹션마다:

### [섹션 번호] [섹션 제목]
**핵심 아이디어:** 이 섹션의 핵심 개념
**배경/동기:** 왜 이 방법이 필요한지
**수식:**
$$수식 — 해당 섹션의 수식 모두 포함$$
**수식 풀이:**
- 각 기호 의미
> 수식이 계산하는 것
▷ 각 항의 역할
**직관적 이해:**
> 한 문장 핵심
▷ 비유나 예시로 구체화
◆ 왜 이렇게 설계했는지 (다른 방법 대비 장점)
**Figure 참조:** 관련 Figure/Table 번호 명시

수식 없는 섹션도 배경/동기와 직관적 이해는 반드시 작성.

## 실험 결과 분석
각 표/그래프별로:

### [표 또는 그래프 이름]
Table N 참조 또는 Figure N 참조
- 실험 설정 및 비교 대상
> 핵심 수치와 의미
▷ baseline 대비 차이점과 이유
◆ 왜 이 결과가 중요한지
※ 주목할 만한 패턴이나 예외

## 강점
◆ 항목별로 구체적 근거와 함께 서술

## 한계점 및 비판적 관점
- 항목별 한계
▷ 실제 상황에서 어떤 문제가 생기는지

## 구현 시 고려사항
→ 단계별 구현 포인트
※ 주의사항

---

[논문 본문]
${text}`;
}
