# PROJECT SAEJONG — Paper Reader

논문 URL을 입력하면 GPT-4o가 한국어로 번역 수준의 상세 해설 리포트를 생성해주는 웹 애플리케이션.

---

## 주요 기능

- **arXiv / ar5iv 지원** — arXiv 논문 URL을 입력하면 ar5iv.org에서 HTML 파싱하여 수식·Figure·Table 추출
- **PDF 지원** — 일반 PDF URL 입력 시 텍스트 추출 및 페이지 스크린샷 캡처
- **GPT-4o 스트리밍** — 분석 결과를 실시간으로 스트리밍하여 즉시 확인
- **LaTeX 렌더링** — 논문 내 수식을 KaTeX로 인라인/블록 렌더링
- **Figure & Table 인라인 표시** — 본문 섹션과 연동하여 관련 이미지·표를 본문 옆에 배치
- **HTML 테이블 렌더링** — ar5iv에서 추출한 HTML 테이블을 그대로 렌더링 (수식 포함)
- **계층 구조 표현** — ◆ > ▷ → ※ - 기호로 내용의 깊이를 시각적으로 표현

## 출력 섹션

| 섹션 | 설명 |
|------|------|
| 한 줄 요약 | 논문 전체를 한 문장으로 |
| 이 논문이 중요한 이유 | 핵심 문제, 파급력, 기존 연구 대비 차별점 |
| 배경 및 동기 | 기존 방법의 한계와 이 연구의 필요성 |
| 핵심 기여 | 각 기여를 구체적 근거와 함께 |
| 방법론 개요 | 전체 파이프라인 흐름 |
| 기술적 상세 | 모든 섹션/서브섹션 번역 수준 해설 + 수식 |
| 실험 결과 분석 | 각 Table/Figure별 실험 설정·수치·의미 |
| 강점 / 한계점 | 구체적 근거 기반 평가 |
| 구현 시 고려사항 | 단계별 구현 포인트 |

---

## 기술 스택

- **Framework** — Next.js 14 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **AI** — OpenAI GPT-4o (스트리밍)
- **Math** — KaTeX
- **HTML Parsing** — cheerio
- **PDF** — pdf-parse v2

---

## 시작하기

### 1. 의존성 설치

```bash
cd paper-reader
npm install
```

### 2. 환경변수 설정

`paper-reader/.env.local` 파일 생성:

```
OPENAI_API_KEY=sk-...
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속

---

## 사용법

1. 메인 화면에서 논문 URL 입력 (arXiv, ar5iv, PDF 링크 모두 지원)
2. 분석 깊이와 대상 독자 수준 선택
3. 분석 시작 버튼 클릭
4. 실시간으로 생성되는 해설 리포트 확인

### 지원 URL 형식

```
https://arxiv.org/abs/2301.00001
https://arxiv.org/pdf/2301.00001
https://ar5iv.org/abs/2301.00001
https://example.com/paper.pdf
```

---

## 프로젝트 구조

```
paper-reader/
├── app/
│   ├── page.tsx              # 메인 입력 화면
│   ├── result/page.tsx       # 분석 결과 화면
│   └── api/
│       ├── analyze/route.ts  # GPT 스트리밍 API
│       └── paper-meta/route.ts  # 논문 메타데이터 API
├── lib/
│   ├── fetchPaper.ts         # 논문 파싱 (ar5iv, PDF, HTML)
│   └── prompts.ts            # GPT 프롬프트 빌더
└── .env.local                # API 키 (Git 미포함)
```
