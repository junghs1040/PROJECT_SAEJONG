export type AnalysisOptions = {
  depth: "short" | "medium" | "deep";
  level: "beginner" | "practitioner" | "researcher";
};

const DEPTH_INSTRUCTION: Record<string, string> = {
  short: "핵심만 간결하게, 각 섹션 2~3문장으로 요약",
  medium: "균형 잡힌 깊이로, 각 섹션 4~6문장으로 설명",
  deep: "가능한 한 자세하게, 수식/아키텍처/실험까지 심층 분석",
};

const LEVEL_INSTRUCTION: Record<string, string> = {
  beginner: "비전공자도 이해할 수 있도록 쉬운 용어와 직관적인 비유를 사용",
  practitioner: "구현 관점에서 실용적인 포인트를 중심으로 설명",
  researcher: "novelty, assumption, limitation, 기존 연구 대비 차별점 중심으로 분석",
};

export function buildPrompt(text: string, options: AnalysisOptions): string {
  return `당신은 최고 수준의 논문 분석 전문가입니다.
아래 논문 본문을 분석하여 구조화된 리포트를 한국어로 작성하세요.

[분석 지침]
- 깊이: ${DEPTH_INSTRUCTION[options.depth]}
- 대상 독자: ${LEVEL_INSTRUCTION[options.level]}
- 단순 문장 압축이 아니라 논리 구조를 설명할 것
- 기술적인 핵심(Method, Architecture, 수식, 실험)은 더 자세히 설명할 것
- 실험 결과는 숫자 나열이 아니라 의미까지 해석할 것

[출력 형식] — 아래 섹션을 순서대로 마크다운으로 작성:

## 한 줄 요약
(논문의 핵심을 한 문장으로)

## 왜 이 논문이 중요한가
(문제의식, 기존 한계, 이 논문의 필요성)

## 핵심 기여 (Key Contributions)
(bullet 3~5개로 명확하게)

## 방법론 개요 (Method Overview)
(전체 파이프라인/아이디어를 설명)

## 기술적 상세 (Technical Deep Dive)
(모델 구조, 수식, 알고리즘, 학습 방식 등 상세 설명)

## 실험 결과 분석
(결과가 왜 중요한지, baseline 대비 무엇이 나아졌는지)

## 강점
(bullet로 정리)

## 한계점 및 비판적 관점
(bullet로 정리)

## 구현 시 고려사항
(실제 구현/재현할 때 알아야 할 것들)

---

[논문 본문]
${text}`;
}
