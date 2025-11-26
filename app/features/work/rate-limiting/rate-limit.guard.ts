/**
 * 비디오 분석 요청 제한 가드 모듈
 *
 * 이 모듈은 기존의 guards.server.ts 패턴을 따라서,
 * 비디오 분석 요청에 대한 제한을 적용하는 가드 함수를 제공합니다.
 *
 * 기존 인증 가드와 동일한 방식으로 사용할 수 있으며,
 * React Router의 loader 및 action 함수에서 쉽게 통합할 수 있습니다.
 *
 * 사용 예시:
 * ```typescript
 * export async function action({ request }: Route.ActionArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAuthentication(client);
 *   await requireVideoAnalysisRateLimit(client);
 *
 *   // 비디오 분석 로직 계속...
 * }
 * ```
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { data } from "react-router";

import {
  RateLimitExceededError,
  enforceVideoAnalysisRateLimit,
} from "./rate-limit.service";
import { type RateLimitConfig } from "./schema";

/**
 * 비디오 분석 요청 제한 적용
 *
 * 이 함수는 인증된 사용자의 비디오 분석 요청이 허용된 한도 내에 있는지
 * 확인하고, 한도를 초과한 경우 429 Too Many Requests 응답을 반환합니다.
 *
 * 함수는 다음 작업을 수행합니다:
 * 1. 사용자 인증 상태 확인
 * 2. 사용자의 일일 요청 횟수 확인
 * 3. 제한 초과 시 에러 응답 반환
 * 4. 제한 내에 있을 경우 요청 횟수 기록
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param config - 제한 설정 (선택사항, 기본값은 환경 변수 사용)
 * @throws {Response} 401 Unauthorized 인증되지 않은 사용자
 * @throws {Response} 429 Too Many Requests 제한 초과 시
 *
 * @example
 * // analyze.ts 라우트에서 사용
 * export async function action({ request }: Route.ActionArgs) {
 *   const [supabase, headers] = makeServerClient(request);
 *   await requireVideoAnalysisRateLimit(supabase);
 *
 *   // 기존 비디오 분석 로직 계속...
 * }
 */
export async function requireVideoAnalysisRateLimit(
  client: SupabaseClient,
  config?: RateLimitConfig,
): Promise<void> {
  // 1. 사용자 인증 확인
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    // 2. 비디오 분석 요청 제한 적용
    await enforceVideoAnalysisRateLimit(user.id, config);

    console.log(`[Rate Limit Guard] User ${user.id} passed rate limit check`);
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      // 3. 제한 초과 시 429 응답 반환
      console.log(`[Rate Limit Guard] User ${user.id} exceeded rate limit`);

      throw data(
        {
          error: error.message,
          resetTime: error.resetTime.toISOString(),
          remainingRequests: 0,
        },
        { status: 429 },
      );
    }

    // 4. 예기치 않은 에러는 다시 발생
    throw error;
  }
}

/**
 * 비디오 분석 요청 제한 확인 (기록 없음)
 *
 * 이 함수는 사용자의 제한 상태만 확인하고 요청을 기록하지 않습니다.
 * 주로 UI에서 현재 상태를 표시할 때 사용합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param config - 제한 설정 (선택사항)
 * @returns {Promise<Object>} 제한 상태 정보
 * @throws {Response} 401 Unauthorized 인증되지 않은 사용자
 */
export async function checkVideoAnalysisRateLimitStatus(
  client: SupabaseClient,
  config?: RateLimitConfig,
) {
  // 1. 사용자 인증 확인
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // 2. 현재 상태 조회 (서비스 함수 사용)
  const { getUserRateLimitStatus } = await import("./rate-limit.service");
  return await getUserRateLimitStatus(user.id);
}

/**
 * 비디오 분석 요청 제한 설정 로드
 *
 * 환경 변수나 기본값에서 현재 제한 설정을 로드합니다.
 * 관리자나 디버깅용으로 현재 설정을 확인할 때 사용합니다.
 *
 * @returns {RateLimitConfig} 현재 제한 설정
 */
export function getCurrentRateLimitConfig(): RateLimitConfig {
  const maxDailyRequests = parseInt(
    process.env.VIDEO_ANALYSIS_DAILY_LIMIT || "3",
  );
  const errorMessage =
    process.env.VIDEO_ANALYSIS_LIMIT_ERROR_MESSAGE ||
    "일일 비디오 분석 요청 한도를 초과했습니다. 내일 다시 시도해주세요.";
  const resetTimeUTC = parseInt(
    process.env.VIDEO_ANALYSIS_RESET_TIME_UTC || "0",
  );

  return {
    maxDailyRequests,
    errorMessage,
    resetTimeUTC,
  };
}
