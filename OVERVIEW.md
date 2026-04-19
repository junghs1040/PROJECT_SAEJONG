# OVERVIEW

## Project Name
Paper Reader & Technical Summarizer

---

## 1. Project Goal

이 프로젝트의 목표는 사용자가 **논문 링크(URL)** 를 입력하면,  
해당 논문을 자동으로 읽고 분석한 뒤,  
**단순 요약뿐 아니라 기술적인 설명까지 자세히 제공하는 웹사이트**를 만드는 것이다.

이 서비스는 다음과 같은 문제를 해결하는 것을 목표로 한다:

- 논문을 처음부터 끝까지 직접 읽는 데 시간이 많이 든다.
- 단순 요약만으로는 핵심 기여(contribution)와 기술적 차별점을 이해하기 어렵다.
- 수식, 알고리즘, 아키텍처, 실험 결과 등 기술적인 부분은 더 깊은 설명이 필요하다.
- 사용자마다 원하는 설명 수준(입문자 / 전공자 / 연구자)이 다르다.

따라서 본 서비스는 단순한 "TL;DR" 수준의 요약이 아니라,  
**사용자 목적과 수준에 맞는 구조화된 논문 해설 서비스**를 지향한다.

---

## 2. Core Concept

사용자는 논문 링크를 입력한다.  
시스템은 해당 논문의 본문(PDF 또는 웹페이지)을 가져와 텍스트를 추출하고,  
논문의 구조를 분석한 뒤,  
OpenAI API(GPT)를 활용하여 다음과 같은 결과를 생성한다:

- 전체 요약
- 핵심 기여점 정리
- 방법론 상세 설명
- 기술적 내용 심화 해설
- 실험 결과 해석
- 한계점 및 비판적 관점
- 구현 관점에서의 인사이트
- 필요 시 사용자 수준에 맞춘 쉬운 설명

즉, 이 프로젝트는  
**논문 링크 → 텍스트 추출 → 구조 분석 → GPT 기반 맞춤형 요약/설명 생성 → 웹페이지 출력**  
흐름으로 동작한다.

---

## 3. Main User Value

이 서비스가 제공하는 핵심 가치는 다음과 같다.

### 3.1 Fast Understanding
논문 전체를 일일이 읽지 않아도 핵심 내용을 빠르게 이해할 수 있다.

### 3.2 Technical Deep Dive
단순한 요약이 아니라, 기술적인 핵심(Method, Architecture, Training, Equation, Experiment 등)을 더 자세히 설명해준다.

### 3.3 Personalized Explanation
사용자의 수준과 목적에 따라 설명을 다르게 제공할 수 있다.

예시:
- 입문자: 쉬운 용어 중심 설명
- 엔지니어: 구현 포인트 중심 설명
- 연구자: novelty, assumption, limitation 중심 설명

### 3.4 Practical Usefulness
논문 이해뿐 아니라 다음 용도에도 활용 가능하다.

- 발표 준비
- 논문 리뷰
- 구현/재현
- 연구 아이디어 발굴
- 관련 논문 비교

---

## 4. OpenAI API Integration

이 프로젝트는 **OpenAI API key**를 연동하여,  
논문 요약 및 기술 설명 생성 작업을 GPT가 수행할 수 있도록 설계한다.

### 4.1 Purpose of OpenAI Integration
OpenAI API를 사용하는 목적은 다음과 같다:

- 논문 텍스트를 기반으로 자연스럽고 구조화된 요약 생성
- 기술적 내용을 더 깊고 명확하게 설명
- 사용자 수준에 맞춘 설명 방식 조절
- 특정 섹션(Method / Experiment / Limitation 등) 중심 분석
- 긴 논문을 chunk 단위로 나누어 단계적으로 요약한 후 통합 요약 생성
- 추가 질문(Q&A) 기능 확장 가능

### 4.2 Expected Workflow
1. 사용자가 논문 링크 입력
2. 서버가 논문 본문을 수집
3. 본문 텍스트를 정제 및 chunk 분할
4. OpenAI GPT API로 각 chunk 또는 전체 구조를 분석
5. 최종 요약/설명 결과를 생성
6. 웹페이지에 구조화된 형태로 표시

### 4.3 API Key Handling
OpenAI API key는 보안상 매우 중요하므로 다음 원칙을 따른다:

- API key는 프론트엔드에 직접 노출하지 않는다.
- API 호출은 반드시 백엔드 서버에서 수행한다.
- `.env` 파일 또는 안전한 secret manager를 통해 관리한다.
- 클라이언트에는 절대 API key를 전달하지 않는다.
- 요청 사용량 및 비용 추적을 고려한다.

예시:
```env
OPENAI_API_KEY=your_api_key_here
4.4 Model Usage Strategy

OpenAI 모델은 다음 작업에 활용할 수 있다:

빠른 1차 요약
기술적 상세 설명 생성
섹션별 분석
사용자 맞춤형 재설명
Q&A 기반 후속 질의응답

예시 작업:

"이 논문의 핵심 기여점 3개를 정리"
"Method 부분을 전공자 수준으로 자세히 설명"
"수식을 자연어로 풀어서 설명"
"실험 결과가 왜 중요한지 설명"
"이 접근법의 한계와 실제 구현 시 어려운 점 분석"
5. Target Users

이 서비스의 주요 사용자는 다음과 같다.

논문을 빠르게 이해하고 싶은 학생
기술 동향을 파악하려는 엔지니어
논문 발표를 준비하는 대학원생
연구 아이디어를 찾는 연구자
구현 가능성을 검토하는 개발자
최신 AI/로보틱스 논문을 정리하려는 실무자
6. Main Inputs

사용자로부터 받을 수 있는 주요 입력값은 다음과 같다.

Required Input
paper_url: 논문 링크
Optional Inputs
user_goal: 사용 목적
예: 이해 / 발표 준비 / 구현 / 연구 아이디어 탐색
summary_depth: 요약 깊이
예: short / medium / deep
technical_detail_level: 기술 설명 수준
예: low / medium / high
audience_level: 사용자 수준
예: beginner / practitioner / researcher
focus_topics: 중점적으로 볼 부분
예: contribution / method / math / experiments / limitations / implementation
output_language: 출력 언어
예: Korean / English
extra_request: 추가 요청사항
예: "Diffusion Policy와 비교해서 설명해줘"
7. Main Outputs

시스템이 생성하는 주요 출력은 다음과 같다.

한 줄 요약
전체 논문 요약
핵심 contribution 정리
방법론(Method) 상세 설명
기술적 내용 심화 설명
실험 결과 해석
한계점 및 비판적 관점
구현 시 고려사항
관련 배경지식 설명 (선택)
후속 질문 응답 (확장 기능)
8. Prompt Engineering Principles

이 프로젝트의 핵심은 프롬프트 엔지니어링이다.
GPT가 단순한 압축 요약이 아니라,
논문의 기술적 본질을 더 잘 설명하도록 유도해야 한다.

8.1 Basic Principles
단순 문장 축약이 아니라 논리 구조를 설명한다.
논문의 주장과 근거를 분리해서 설명한다.
technical section은 더 자세히 설명한다.
핵심 novelty를 명확히 짚는다.
실험 결과는 숫자 나열이 아니라 의미까지 설명한다.
한계점과 전제를 함께 설명한다.
사용자의 수준에 맞는 용어와 깊이로 재구성한다.
8.2 Technical Explanation Policy

기술적인 부분은 다음 요소를 우선적으로 설명할 수 있어야 한다:

문제 정의
기존 방법의 한계
제안 방법의 핵심 아이디어
모델 구조 / 아키텍처
학습 방식
입력과 출력
손실 함수
수식의 의미
실험 설계
baseline 대비 차이
왜 이 방법이 효과적인지
8.3 Example Prompt Direction

예시 프롬프트 방향:

이 논문을 단순 요약하지 말고 구조적으로 설명하라.
핵심 기여점과 기존 방법 대비 차별점을 분리해서 정리하라.
Method 부분은 기술적으로 자세히 설명하라.
수식이 나오면 가능하면 자연어로 의미를 풀어서 설명하라.
실험 결과는 무엇이 중요한지 해석하라.
한계점과 현실 적용 시 어려움도 함께 정리하라.
9. Recommended Output Structure

웹페이지 결과는 다음과 같은 구조를 권장한다.

Paper Title
One-line Summary
Why This Paper Matters
Key Contributions
Method Overview
Technical Deep Dive
Experiment Analysis
Strengths
Limitations
Implementation Insights
Easy Explanation for Beginners (optional)
Follow-up Questions (future feature)
10. System Workflow

전체 시스템 흐름은 다음과 같다.

Step 1. User Input

사용자가 논문 링크와 옵션을 입력한다.

Step 2. Paper Fetching

서버가 링크를 통해 논문 PDF 또는 웹페이지 본문을 가져온다.

Step 3. Text Extraction

논문 텍스트를 추출하고, 필요 시 섹션 단위로 분리한다.

Step 4. Preprocessing

불필요한 텍스트를 제거하고, GPT 입력에 적합하도록 chunking 한다.

Step 5. GPT Analysis via OpenAI API

OpenAI API를 호출하여:

전체 요약
기술 설명
contribution 정리
experiment 해석
등을 생성한다.
Step 6. Structured Rendering

생성된 결과를 웹 UI에서 읽기 쉽게 구조화하여 보여준다.

11. Security & Backend Rules

OpenAI API 사용 시 다음 원칙을 반드시 지킨다.

API key는 서버에서만 관리한다.
프론트엔드에서 직접 OpenAI API를 호출하지 않는다.
Rate limiting을 고려한다.
예외 처리 및 실패 응답을 정의한다.
긴 논문 처리 시 토큰 초과를 방지하기 위해 chunking 전략을 사용한다.
비용 절감을 위해 캐싱 및 재요청 최소화를 고려한다.
12. Error Cases to Handle

다음과 같은 예외 상황을 고려한다.

논문 링크가 유효하지 않음
PDF 다운로드 실패
본문 텍스트 추출 실패
OCR이 필요한 스캔 문서
논문이 아닌 일반 웹페이지 링크
토큰 초과
OpenAI API 호출 실패
응답 시간 초과
일부 표/수식/이미지 기반 정보 추출 한계
사용량 증가에 따른 비용 문제
13. Future Extensions

향후 다음과 같은 기능으로 확장할 수 있다.

논문 비교 기능
관련 논문 추천
논문 기반 질문응답 챗봇
발표용 슬라이드 자동 생성
블로그 글 스타일 재작성
구현 코드 초안 생성
수식 집중 해설 모드
그림/표 기반 설명 보조
사용자 히스토리 저장
즐겨찾기 및 요약 아카이빙
14. Suggested MVP Scope

초기 MVP에서는 다음 기능에 집중한다.

Must Have
논문 링크 입력
텍스트 추출
GPT 기반 요약 생성
기술 설명 강화
한국어/영어 출력
OpenAI API key 연동
기본 에러 처리
Nice to Have
사용자 수준 선택
focus topic 선택
섹션별 결과 분리
캐싱
결과 저장
Later
논문 비교
Q&A
발표 자료 생성
관련 논문 추천
15. Summary

이 프로젝트는 단순한 논문 요약기가 아니라,
OpenAI GPT를 활용해 논문을 더 깊이 이해할 수 있도록 돕는 기술 중심 웹 애플리케이션이다.

핵심은 다음 세 가지다:

논문 링크로부터 본문을 안정적으로 추출할 것
OpenAI API를 통해 구조적이고 기술적인 설명을 생성할 것
사용자 목적과 수준에 따라 결과를 유연하게 조정할 것

궁극적으로 이 서비스는
"논문을 읽는 시간"을 줄이는 것을 넘어서,
논문을 더 잘 이해하고, 더 잘 설명하고, 더 잘 활용하게 만드는 것을 목표로 한다.