/**
 * 비디오 분석 요청 제한 스키마
 *
 * 이 모듈은 사용자별 비디오 분석 요청 횟수를 추적하고 제한하기 위한
 * 데이터베이스 스키마를 정의합니다. 기존 비즈니스 로직과 완전히 분리된
 * 독립적인 기능으로 구현됩니다.
 *
 * 기능:
 * - 사용자별 일일 요청 횟수 추적
 * - 제한 초과 시 적절한 에러 응답
 * - 설정 가능한 제한 값 지원
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

// Helper function for timestamps
const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull(),
};

/**
 * 사용자별 비디오 분석 요청 제한 기록 테이블
 *
 * 각 사용자의 일일 비디오 분석 요청 횟수를 추적합니다.
 * 이 테이블은 기존 워크플로우 시스템과 완전히 독립적으로 운영됩니다.
 *
 * 중요: (user_id, request_date) 조합에 유니크 제약이 있어야 합니다.
 * 이 제약은 데이터베이스 마이그레이션을 통해 생성됩니다.
 */
export const workVideoAnalysisRateLimits = pgTable(
  "work_video_analysis_rate_limits",
  {
    // 고유 ID
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),

    // 사용자 ID (인증된 사용자만 가능)
    user_id: uuid()
      .references(() => authUsers.id, { onDelete: "cascade" })
      .notNull(),

    // 요청 날짜 (UTC 자정 기준)
    request_date: timestamp().defaultNow().notNull(),

    // 해당 날짜의 요청 횟수
    request_count: integer().notNull().default(0),

    // 마지막 요청 시간
    last_request_at: timestamp().defaultNow().notNull(),

    ...timestamps,
  },
  (t) => [
    // RLS Policy: 사용자는 자신의 제한 기록만 접근 가능
    pgPolicy("users-access-own-rate-limits", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${t.user_id}`,
      withCheck: sql`${authUid} = ${t.user_id}`,
    }),
  ],
);

// Relations
export const workVideoAnalysisRateLimitsRelations = relations(
  workVideoAnalysisRateLimits,
  ({ one }) => ({
    user: one(authUsers, {
      fields: [workVideoAnalysisRateLimits.user_id],
      references: [authUsers.id],
    }),
  }),
);

/**
 * 제한 설정 타입 정의
 *
 * 환경 변수나 설정 파일에서 제한 값을 관리하기 위한 타입입니다.
 */
export interface RateLimitConfig {
  /** 일일 최대 요청 횟수 (기본값: 3) */
  maxDailyRequests: number;
  /** 제한 초과 시 표시할 에러 메시지 */
  errorMessage: string;
  /** 제한 초기화 시간 (UTC 기준 자정) */
  resetTimeUTC: number; // 0-23 시간
}

/**
 * 기본 제한 설정
 *
 * 환경 변수가 설정되지 않았을 때 사용되는 기본값입니다.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxDailyRequests: 3,
  errorMessage:
    "일일 비디오 분석 요청 한도를 초과했습니다. 내일 다시 시도해주세요.",
  resetTimeUTC: 0, // UTC 자정에 초기화
};
