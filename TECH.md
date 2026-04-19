# TECH STACK

## Framework
- **Next.js 14** (App Router)
- Full-stack: 프론트엔드 + API Routes 모두 Next.js로 처리
- 별도 백엔드 서버 없음 (API Routes가 백엔드 역할)

---

## Frontend
- **Next.js + React**
- **Tailwind CSS** — 스타일링
- **TypeScript** — 타입 안전성
- **shadcn/ui** — 기본 UI 컴포넌트

---

## Backend (Next.js API Routes)
- `/api/analyze` — 논문 링크를 받아 텍스트 추출 + GPT 분석 후 결과 반환
- OpenAI API 호출은 서버 사이드(API Routes)에서만 수행
- API key는 `.env.local`에 보관, 클라이언트에 노출 금지

---

## Key Libraries
| 역할 | 라이브러리 |
|------|------------|
| OpenAI 호출 | `openai` (공식 SDK) |
| PDF 텍스트 추출 | `pdf-parse` 또는 `pdfjs-dist` |
| 웹페이지 본문 추출 | `cheerio` + `axios` |
| 스트리밍 응답 | OpenAI Streaming + `ReadableStream` |
| 환경변수 | `.env.local` |

---

## Environment Variables
```env
OPENAI_API_KEY=your_api_key_here
```

---

## Deployment
- **Vercel** (Next.js 최적화 무료 배포)
- `.env.local`은 Vercel 환경변수 설정으로 관리

---

## MVP 디렉토리 구조 (예상)
```
PROJECT_SAEJONG/
├── app/
│   ├── page.tsx          # 메인 입력 화면
│   ├── result/
│   │   └── page.tsx      # 분석 결과 화면
│   └── api/
│       └── analyze/
│           └── route.ts  # 논문 분석 API
├── components/
│   ├── InputBox.tsx      # 논문 URL 입력창
│   └── ResultCard.tsx    # 결과 섹션 카드
├── lib/
│   ├── fetchPaper.ts     # PDF/URL 텍스트 추출
│   ├── openai.ts         # OpenAI API 호출 로직
│   └── prompts.ts        # 프롬프트 템플릿
├── .env.local
└── OVERVIEW.md
```
