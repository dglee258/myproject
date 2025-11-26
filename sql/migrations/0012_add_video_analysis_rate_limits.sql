-- 비디오 분석 요청 제한 테이블 생성 마이그레이션
-- 
-- 이 마이그레이션은 사용자별 비디오 분석 요청 횟수를 추적하고 제한하기 위한
-- 독립적인 테이블을 생성합니다. 기존 시스템과 완전히 분리된 구조입니다.
-- 
-- 기능:
-- - 사용자별 일일 요청 횟수 추적
-- - (user_id, request_date) 유니크 제약으로 중복 방지
-- - RLS 정책으로 사용자 데이터 보호

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

-- 유니크 제약 생성: 동일 사용자가 같은 날짜에 중복 기록 방지
-- 이 제약은 upsert 작업을 위해 필수적입니다
ALTER TABLE work_video_analysis_rate_limits 
ADD CONSTRAINT unique_user_date_rate_limit 
UNIQUE (user_id, request_date);

-- 인덱스 생성: 사용자별 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_work_video_analysis_rate_limits_user_date 
ON work_video_analysis_rate_limits (user_id, DATE(request_date AT TIME ZONE 'UTC'));

-- RLS (Row Level Security) 활성화
ALTER TABLE work_video_analysis_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 제한 기록만 접근 가능
CREATE POLICY "users_access_own_rate_limits" ON work_video_analysis_rate_limits
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 테이블 코멘트 추가
COMMENT ON TABLE work_video_analysis_rate_limits IS '사용자별 비디오 분석 요청 제한 추적 테이블';
COMMENT ON COLUMN work_video_analysis_rate_limits.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN work_video_analysis_rate_limits.request_date IS '요청 날짜 (UTC 기준)';
COMMENT ON COLUMN work_video_analysis_rate_limits.request_count IS '해당 날짜의 요청 횟수';
COMMENT ON COLUMN work_video_analysis_rate_limits.last_request_at IS '마지막 요청 시간';
