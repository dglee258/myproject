# 비디오 분석 요청 제한 기능

## 개요

이 기능은 사용자별 비디오 분석 요청 횟수를 제한하여 시스템 리소스를 보호하고 남용을 방지합니다. 기존 비즈니스 로직과 완전히 분리된 독립적인 모듈로 구현되어, 기존 시스템에 영향을 주지 않습니다.

## 주요 특징

- **독립적 구현**: 기존 데이터베이스 구조나 비즈니스 로직을 수정하지 않음
- **설정 가능**: 환경 변수를 통해 제한 값과 메시지를 쉽게 설정
- **RLS 보호**: 사용자는 자신의 제한 기록만 접근 가능
- **자동 초기화**: 매일 UTC 자정에 요청 횟수가 자동으로 초기화됨
- **에러 처리**: 제한 초과 시 명확한 에러 메시지와 초기화 시간 제공

## 파일 구조

```
app/features/work/rate-limiting/
├── schema.ts              # 데이터베이스 스키마 정의
├── rate-limit.service.ts  # 제한 확인 및 기록 서비스
├── rate-limit.guard.ts    # React Router 가드 함수
└── README.md              # 이 문서
```

## 환경 변수 설정

다음 환경 변수를 `.env` 파일에 추가하여 제한 설정을 구성할 수 있습니다:

```bash
# 일일 최대 비디오 분석 요청 횟수 (기본값: 3)
VIDEO_ANALYSIS_DAILY_LIMIT=3

# 제한 초과 시 표시할 에러 메시지 (한국어)
VIDEO_ANALYSIS_LIMIT_ERROR_MESSAGE=일일 비디오 분석 요청 한도를 초과했습니다. 내일 다시 시도해주세요.

# 제한 초기화 시간 (UTC 기준, 0-23시, 기본값: 0)
VIDEO_ANALYSIS_RESET_TIME_UTC=0
```

## 데이터베이스 마이그레이션

새로운 테이블을 생성하기 위해 마이그레이션을 실행해야 합니다:

```bash
# 마이그레이션 생성 (이미 생성됨)
npm run db:generate

# 마이그레이션 실행
npm run db:migrate
```

### 생성되는 테이블

- `work_video_analysis_rate_limits`: 사용자별 요청 제한 기록 테이블
- 유니크 제약: `(user_id, request_date)` 조합
- RLS 정책: 사용자는 자신의 데이터만 접근 가능

## 사용 방법

### 1. 라우트에 제한 적용

```typescript
// app/routes/api/work/analyze.ts
import { requireVideoAnalysisRateLimit } from "~/features/work/rate-limiting/rate-limit.guard";

export async function action({ request }: Route.ActionArgs) {
  const [supabase, headers] = makeServerClient(request);

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  // 비디오 분석 요청 제한 확인
  await requireVideoAnalysisRateLimit(supabase);

  // 기존 비즈니스 로직 계속...
}
```

### 2. 현재 제한 상태 확인

```typescript
import { checkVideoAnalysisRateLimitStatus } from "~/features/work/rate-limiting/rate-limit.guard";

// UI에서 현재 상태 표시
const status = await checkVideoAnalysisRateLimitStatus(supabase);
console.log(status);
// {
//   currentCount: 2,
//   maxDailyRequests: 3,
//   remainingRequests: 1,
//   resetTime: "2024-01-01T00:00:00.000Z",
//   isLimitExceeded: false
// }
```

### 3. 서비스 함수 직접 사용

```typescript
import {
  enforceVideoAnalysisRateLimit,
  getUserRateLimitStatus,
} from "~/features/work/rate-limiting/rate-limit.service";

// 제한 상태 조회
const status = await getUserRateLimitStatus(userId);

// 제한 적용 및 기록
await enforceVideoAnalysisRateLimit(userId);
```

## 에러 처리

제한 초과 시 `429 Too Many Requests` 상태 코드와 함께 다음 응답이 반환됩니다:

```json
{
  "error": "일일 비디오 분석 요청 한도를 초과했습니다. 내일 다시 시도해주세요.",
  "resetTime": "2024-01-01T00:00:00.000Z",
  "remainingRequests": 0
}
```

## 모니터링 및 로깅

제한 관련 주요 로그 메시지:

```text
[Rate Limit] User user_id: 2/3 requests
[Rate Limit] Request recorded for user user_id
[Rate Limit Guard] User user_id passed rate limit check
[Rate Limit Guard] User user_id exceeded rate limit
```

## 보안 고려사항

- **RLS 정책**: 사용자는 자신의 제한 기록만 접근 가능
- **인증 필수**: 인증된 사용자만 요청 가능
- **UTC 기준**: 시간대 조작 방지를 위해 UTC 기준으로 카운트 관리
- **데이터 무결성**: 유니크 제약으로 중복 기록 방지

## 테스트

제한 기능을 테스트하려면:

1. 테스트 사용자로 로그인
2. 환경 변수에 설정된 횟수만큼 비디오 분석 요청
3. 제한 초과 시 429 에러 확인
4. 다음 날 초기화 확인 (UTC 자정 기준)

## 유지보수

### 제한 값 변경

환경 변수만 수정하면 즉시 적용됩니다:

```bash
# 일일 5회로 변경
VIDEO_ANALYSIS_DAILY_LIMIT=5
```

### 제한 초기화 수동 실행

관리자가 특정 사용자의 제한을 초기화하려면:

```sql
-- 특정 사용자의 오늘 기록 삭제
DELETE FROM work_video_analysis_rate_limits
WHERE user_id = 'user-uuid'
AND DATE(request_date AT TIME ZONE 'UTC') = CURRENT_DATE;
```

## 확장 가능성

- **시간별 제한**: 현재 일일 제한만 지원하지만, 시간별/주별 제한으로 확장 가능
- **사용자 그룹별 제한**: 관리자/일반 사용자 등 그룹별 다른 제한 설정 가능
- **동적 제한**: 사용자의 구독 플랜에 따라 제한 값 동적 조정 가능

## 주의사항

- 이 기능은 기존 시스템과 완전히 분리되어 있어 독립적으로 관리 가능
- 데이터베이스 마이그레이션은 한 번만 실행하면 됨
- 환경 변수 변경 시 애플리케이션 재시작 필요 없음
- UTC 시간 기준으로 동작하므로 한국 사용자에게는 오전 9시에 초기화됨
