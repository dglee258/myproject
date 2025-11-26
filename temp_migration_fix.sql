-- 직접 실행: 비디오 분석 요청 제한 테이블 생성
-- 마이그레이션 시스템을 우회하여 직접 테이블 생성

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
