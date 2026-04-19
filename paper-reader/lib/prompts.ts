import type { Figure, DisplayEquation } from "./fetchPaper";

export type AnalysisOptions = {
  depth: "short" | "medium" | "deep";
  level: "beginner" | "practitioner" | "researcher";
};

const DEPTH_INSTRUCTION: Record<string, string> = {
  short: "핵심만 간결하게, 각 섹션 2~3문장",
  medium: "균형 잡힌 깊이로, 각 섹션 4~6문장",
  deep: "가능한 한 자세하게, 수식·아키텍처·실험까지 심층 분석",
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
  equations: DisplayEquation[]
): string {
  const figureContext =
    figures.length > 0
      ? `\n[논문 피겨 목록]\n` +
        figures.map((f) => `- ${f.id}: ${f.caption}`).join("\n")
      : "";

  const equationContext =
    equations.length > 0
      ? `\n[논문 주요 수식 (LaTeX)]\n` +
        equations.map((e, i) => `- Eq.${i + 1}: $${e.latex}$`).join("\n")
      : "";

  return `당신은 최고 수준의 논문 분석 전문가입니다.
아래 논문을 분석하여 구조화된 리포트를 한국어로 작성하세요.

[분석 지침]
- 깊이: ${DEPTH_INSTRUCTION[options.depth]}
- 대상 독자: ${LEVEL_INSTRUCTION[options.level]}
- 단순 문장 압축이 아니라 논리 구조를 설명할 것
- 수식이 나오면 반드시 LaTeX 형식으로 인라인은 $수식$, 블록은 $$수식$$ 으로 작성할 것
- 논문의 피겨가 있으면 설명할 때 Figure 번호로 명시적으로 참조할 것 (예: "Figure 1에서 볼 수 있듯이...")
- 실험 결과는 숫자 나열이 아니라 의미까지 해석할 것
${figureContext}
${equationContext}

[출력 형식] — 아래 섹션을 순서대로 마크다운으로 작성:

## 한 줄 요약

## 왜 이 논문이 중요한가

## 핵심 기여 (Key Contributions)

## 방법론 개요 (Method Overview)

## 기술적 상세 (Technical Deep Dive)
이 섹션은 줄글 요약 금지. 아래 형식으로 핵심 개념마다 하나씩 블록을 만들 것:

### [개념 이름] (예: Scaled Dot-Product Attention)
**핵심 아이디어:** 한 문장으로 이 개념이 왜 존재하는지
**수식:**
$$수식$$
**수식 풀이:** 각 기호의 의미와 수식이 하는 일을 단계별로 설명
**직관적 이해:** 비유나 예시로 왜 이렇게 설계했는지
**Figure 참조:** 관련 Figure가 있으면 "Figure N 참조" 명시

위 블록을 논문의 핵심 기술 개념 수만큼 반복. 최소 3개 이상 작성.

## 실험 결과 분석

## 강점

## 한계점 및 비판적 관점

## 구현 시 고려사항

---

[논문 본문]
${text}`;
}
