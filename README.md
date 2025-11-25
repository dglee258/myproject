# 싱크로 (synchro)

React Router와 Supabase 기반의 현대적인 웹 애플리케이션

## 🚀 주요 기능

- **인증 시스템**: Supabase 기반 완전한 인증 (이메일, 소셜 로그인, OTP, Magic Link)
- **결제 통합**: TossPayments SDK 통합
- **다국어 지원**: i18next를 활용한 국제화 (한국어, 영어, 스페인어)
- **테마 관리**: 라이트/다크 모드 지원
- **타입 안전성**: TypeScript와 Zod를 활용한 완전한 타입 안전성
- **모니터링**: Sentry 통합으로 에러 추적
- **E2E 테스트**: Playwright 기반 테스트 환경

## 🛠 기술 스택

- **프론트엔드**: React 19, React Router 7
- **백엔드**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **스타일링**: TailwindCSS 4, Radix UI
- **인증**: Supabase Auth
- **결제**: TossPayments
- **배포**: Vercel

## 📦 시작하기

### 필수 요구사항

- Node.js 20+
- npm 또는 pnpm
- Supabase 계정

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 데이터베이스 마이그레이션
npm run db:migrate

# 개발 서버 실행
npm run dev
```

### 환경 변수

`.env` 파일에 다음 환경 변수를 설정하세요:

```env
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SITE_URL=http://localhost:5173
```

## 📝 스크립트

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run typecheck    # 타입 체크
npm run test:e2e     # E2E 테스트 실행
npm run format       # 코드 포맷팅
```

## 📂 프로젝트 구조

```
app/
├── core/              # 핵심 컴포넌트 및 유틸리티
├── features/          # 기능별 모듈
│   ├── auth/         # 인증 관련
│   ├── users/        # 사용자 관리
│   ├── payments/     # 결제 관련
│   ├── work/         # 업무 관리
│   └── ...
├── locales/          # 다국어 번역 파일
└── routes.ts         # 라우트 설정
```

## 🔒 보안

- 환경 변수는 절대 커밋하지 마세요
- `.env` 파일은 `.gitignore`에 포함되어 있습니다
- Supabase Row Level Security (RLS) 정책을 활용하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
