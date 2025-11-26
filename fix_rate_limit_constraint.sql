-- Rate Limiting 테이블에 유니크 제약조건 추가
-- 이 제약조건은 ON CONFLICT 작업에 필요합니다

-- 먼저 기존 제약조건이 있는지 확인하고 삭제
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_video_analysis_rate_limits_user_id_request_date_key'
        AND table_name = 'work_video_analysis_rate_limits'
    ) THEN
        ALTER TABLE work_video_analysis_rate_limits 
        DROP CONSTRAINT work_video_analysis_rate_limits_user_id_request_date_key;
    END IF;
END $$;

-- 유니크 제약조건 생성
ALTER TABLE work_video_analysis_rate_limits 
ADD CONSTRAINT work_video_analysis_rate_limits_user_id_request_date_key 
UNIQUE (user_id, request_date);

-- 제약조건이 잘 생성되었는지 확인
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'work_video_analysis_rate_limits'
    AND tc.constraint_type = 'UNIQUE';
