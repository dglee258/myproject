/**
 * 비디오 분석 요청 제한 서비스
 *
 * 이 서비스는 사용자별 비디오 분석 요청 횟수를 추적하고 제한을 적용합니다.
 * 기존 시스템과 완전히 분리된 독립적인 모듈로 동작합니다.
 *
 * 주요 기능:
 * - 사용자의 현재 일일 요청 횟수 확인
 * - 요청 제한 초과 여부 검증
 * - 요청 횟수 기록 및 업데이트
 * - 자정 기준 카운터 초기화
 */
import { and, eq, gte, lte, sql } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";

import {
  DEFAULT_RATE_LIMIT_CONFIG,
  type RateLimitConfig,
  workVideoAnalysisRateLimits,
} from "./schema";

/**
 * 제한 초과 에러 클래스
 *
 * 사용자가 허용된 요청 한도를 초과했을 때 발생시키는 커스텀 에러입니다.
 */
export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public resetTime: Date,
  ) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

/**
 * 환경 변수에서 제한 설정 로드
 *
 * 환경 변수가 설정되어 있으면 해당 값을 사용하고,
 * 그렇지 않으면 기본 설정을 반환합니다.
 *
 * @returns {RateLimitConfig} 제한 설정 객체
 */
function loadRateLimitConfig(): RateLimitConfig {
  return {
    maxDailyRequests: parseInt(process.env.VIDEO_ANALYSIS_DAILY_LIMIT || "3"),
    errorMessage:
      process.env.VIDEO_ANALYSIS_LIMIT_ERROR_MESSAGE ||
      "일일 비디오 분석 요청 한도를 초과했습니다. 내일 다시 시도해주세요.",
    resetTimeUTC: parseInt(process.env.VIDEO_ANALYSIS_RESET_TIME_UTC || "0"),
  };
}

/**
 * 오늘 날짜의 시작 시간 (UTC 자정) 구하기
 *
 * @param {Date} date - 기준 날짜 (기본값: 현재)
 * @returns {Date} 해당 날짜의 UTC 자정 시간
 */
function getStartOfDayUTC(date: Date = new Date()): Date {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * 내일 날짜의 시작 시간 (UTC 자정) 구하기
 *
 * 제한이 초기화되는 시간을 계산합니다.
 *
 * @param {Date} date - 기준 날짜 (기본값: 현재)
 * @returns {Date} 다음 날의 UTC 자정 시간
 */
function getNextResetTimeUTC(date: Date = new Date()): Date {
  const tomorrow = new Date(date);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * 사용자의 현재 일일 요청 횟수 조회
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 오늘의 요청 횟수
 */
export async function getUserDailyRequestCount(
  userId: string,
): Promise<number> {
  const startOfDay = getStartOfDayUTC();
  const endOfDay = getNextResetTimeUTC();

  const [record] = await db
    .select({ request_count: workVideoAnalysisRateLimits.request_count })
    .from(workVideoAnalysisRateLimits)
    .where(
      and(
        eq(workVideoAnalysisRateLimits.user_id, userId),
        gte(workVideoAnalysisRateLimits.request_date, startOfDay),
        lte(workVideoAnalysisRateLimits.request_date, endOfDay),
      ),
    )
    .limit(1);

  return record?.request_count || 0;
}

/**
 * 사용자의 비디오 분석 요청 제한 확인
 *
 * 사용자가 추가 요청을 할 수 있는지 확인하고,
 * 제한을 초과한 경우 에러를 발생시킵니다.
 *
 * @param {string} userId - 사용자 ID
 * @param {RateLimitConfig} config - 제한 설정 (선택사항)
 * @throws {RateLimitExceededError} 제한 초과 시
 * @returns {Promise<void>}
 */
export async function checkVideoAnalysisRateLimit(
  userId: string,
  config?: RateLimitConfig,
): Promise<void> {
  const rateLimitConfig = config || loadRateLimitConfig();
  const currentCount = await getUserDailyRequestCount(userId);

  console.log(
    `[Rate Limit] User ${userId}: ${currentCount}/${rateLimitConfig.maxDailyRequests} requests`,
  );

  if (currentCount >= rateLimitConfig.maxDailyRequests) {
    const resetTime = getNextResetTimeUTC();
    throw new RateLimitExceededError(rateLimitConfig.errorMessage, resetTime);
  }
}

/**
 * 비디오 분석 요청 기록
 *
 * 사용자의 요청을 데이터베이스에 기록합니다.
 * 오늘의 기록이 없으면 새로 생성하고, 있으면 횟수를 증가시킵니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export async function recordVideoAnalysisRequest(
  userId: string,
): Promise<void> {
  const startOfDay = getStartOfDayUTC();
  const endOfDay = getNextResetTimeUTC();
  const now = new Date();

  // UPSERT 작업 수행 - request_date를 UTC 자정으로 정규화
  await db
    .insert(workVideoAnalysisRateLimits)
    .values({
      user_id: userId,
      request_date: startOfDay, // UTC 자정으로 정규화된 날짜 사용
      request_count: 1,
      last_request_at: now,
    })
    .onConflictDoUpdate({
      target: [
        workVideoAnalysisRateLimits.user_id,
        workVideoAnalysisRateLimits.request_date,
      ],
      set: {
        request_count: sql`${workVideoAnalysisRateLimits.request_count} + 1`,
        last_request_at: now,
        updated_at: now,
      },
    });

  console.log(`[Rate Limit] Request recorded for user ${userId}`);
}

/**
 * 비디오 분석 요청 제한 확인 및 기록
 *
 * 제한 확인과 요청 기록을 하나의 함수로 처리합니다.
 * 이 함수는 비디오 분석 요청이 들어올 때 가장 먼저 호출되어야 합니다.
 *
 * @param {string} userId - 사용자 ID
 * @param {RateLimitConfig} config - 제한 설정 (선택사항)
 * @throws {RateLimitExceededError} 제한 초과 시
 * @returns {Promise<void>}
 */
export async function enforceVideoAnalysisRateLimit(
  userId: string,
  config?: RateLimitConfig,
): Promise<void> {
  // 1. 제한 확인
  await checkVideoAnalysisRateLimit(userId, config);

  // 2. 요청 기록
  await recordVideoAnalysisRequest(userId);
}

/**
 * 사용자의 현재 제한 상태 정보 조회
 *
 * 관리자용 대시보드나 디버깅을 위해 사용자의 현재 제한 상태를 반환합니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 제한 상태 정보
 */
export async function getUserRateLimitStatus(userId: string) {
  const config = loadRateLimitConfig();
  const currentCount = await getUserDailyRequestCount(userId);
  const resetTime = getNextResetTimeUTC();
  const remainingRequests = Math.max(0, config.maxDailyRequests - currentCount);

  return {
    currentCount,
    maxDailyRequests: config.maxDailyRequests,
    remainingRequests,
    resetTime,
    isLimitExceeded: currentCount >= config.maxDailyRequests,
  };
}
