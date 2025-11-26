/**
 * 마이그레이션 수정 스크립트
 *
 * 기존 admin 클라이언트를 사용하여 직접 테이블 생성
 */
// 기존 admin 클라이언트 가져오기
import adminClient from "./app/core/lib/supa-admin-client.server.js";

async function createRateLimitTable() {
  console.log("🔄 비디오 분석 제한 테이블 직접 생성 시작...");

  try {
    // 1. 테이블 생성
    const { data: tableData, error: tableError } = await adminClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "work_video_analysis_rate_limits")
      .single();

    if (!tableError && tableData) {
      console.log("✅ 테이블이 이미 존재합니다!");
      return;
    }

    // 2. 직접 SQL 실행 (Supabase REST API 사용)
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          sql: `
          CREATE TABLE work_video_analysis_rate_limits (
              id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              request_count INTEGER NOT NULL DEFAULT 0,
              last_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
          
          ALTER TABLE work_video_analysis_rate_limits 
          ADD CONSTRAINT unique_user_date_rate_limit 
          UNIQUE (user_id, request_date);
          
          CREATE INDEX idx_work_video_analysis_rate_limits_user_date 
          ON work_video_analysis_rate_limits (user_id, DATE(request_date AT TIME ZONE 'UTC'));
          
          ALTER TABLE work_video_analysis_rate_limits ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "users_access_own_rate_limits" ON work_video_analysis_rate_limits
              FOR ALL TO authenticated
              USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);
        `,
        }),
      },
    );

    if (response.ok) {
      console.log("✅ 테이블 생성 완료!");
    } else {
      console.log("⚠️  REST API 실패. 수동 실행이 필요합니다.");
      console.log("\n📋 Supabase Dashboard에서 직접 실행하세요:");
      console.log("SQL Editor -> 아래 SQL 붙여넣기 -> 실행");
      console.log("\n```sql");
      console.log(`CREATE TABLE work_video_analysis_rate_limits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    request_count INTEGER NOT NULL DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE work_video_analysis_rate_limits 
ADD CONSTRAINT unique_user_date_rate_limit 
UNIQUE (user_id, request_date);

CREATE INDEX idx_work_video_analysis_rate_limits_user_date 
ON work_video_analysis_rate_limits (user_id, DATE(request_date AT TIME ZONE 'UTC'));

ALTER TABLE work_video_analysis_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_rate_limits" ON work_video_analysis_rate_limits
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);`);
      console.log("```");
    }
  } catch (error) {
    console.error("❌ 에러 발생:", error.message);
  }
}

createRateLimitTable();
