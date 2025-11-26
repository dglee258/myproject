/**
 * 비디오 분석 제한 테이블 직접 생성 스크립트
 *
 * 마이그레이션 시스템을 우회하여 직접 테이블을 생성합니다.
 * 이 스크립트는 한 번만 실행하면 됩니다.
 */
import { createClient } from "@supabase/supabase-js";

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.",
  );
  process.exit(1);
}

// Admin 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRateLimitTable() {
  console.log("비디오 분석 제한 테이블 생성 시작...");

  try {
    // SQL 실행
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        -- 비디오 분석 요청 제한 테이블 생성
        CREATE TABLE IF NOT EXISTS work_video_analysis_rate_limits (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            request_count INTEGER NOT NULL DEFAULT 0,
            last_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- 유니크 제약 생성 (이미 존재하면 무시)
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'unique_user_date_rate_limit' 
                AND table_name = 'work_video_analysis_rate_limits'
            ) THEN
                ALTER TABLE work_video_analysis_rate_limits 
                ADD CONSTRAINT unique_user_date_rate_limit 
                UNIQUE (user_id, request_date);
            END IF;
        END $$;

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_work_video_analysis_rate_limits_user_date 
        ON work_video_analysis_rate_limits (user_id, DATE(request_date AT TIME ZONE 'UTC'));

        -- RLS 활성화
        ALTER TABLE work_video_analysis_rate_limits ENABLE ROW LEVEL SECURITY;

        -- RLS 정책 생성 (이미 존재하면 무시)
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'work_video_analysis_rate_limits' 
                AND policyname = 'users_access_own_rate_limits'
            ) THEN
                CREATE POLICY "users_access_own_rate_limits" ON work_video_analysis_rate_limits
                    FOR ALL TO authenticated
                    USING (auth.uid() = user_id)
                    WITH CHECK (auth.uid() = user_id);
            END IF;
        END $$;

        -- 테이블 코멘트 추가
        COMMENT ON TABLE work_video_analysis_rate_limits IS '사용자별 비디오 분석 요청 제한 추적 테이블';
      `,
    });

    if (error) {
      console.error("SQL 실행 실패:", error);

      // RPC가 없으면 직접 SQL 실행 시도
      console.log("직접 SQL 실행 시도...");
      const { error: directError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", "work_video_analysis_rate_limits");

      if (directError) {
        console.log("테이블이 이미 존재하는지 확인:", directError);
      } else {
        console.log("테이블이 존재합니다.");
      }
    } else {
      console.log("✅ 비디오 분석 제한 테이블 생성 완료!");
    }
  } catch (error) {
    console.error("테이블 생성 중 에러 발생:", error);
  }
}

// 스크립트 실행
createRateLimitTable()
  .then(() => {
    console.log("스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("스크립트 실행 실패:", error);
    process.exit(1);
  });
