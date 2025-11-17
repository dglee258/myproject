-- RLS 정책 적용을 위한 마이그레이션
-- 모든 테이블에 RLS 활성화 및 정책 적용

-- 1. 팀 관련 테이블 RLS 활성화
ALTER TABLE work_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_workflow_shares ENABLE ROW LEVEL SECURITY;

-- 2. 워크플로우 관련 테이블 RLS 활성화
ALTER TABLE work_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_analysis_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_workflow_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_workflow_invites ENABLE ROW LEVEL SECURITY;

-- 3. 공유 관련 테이블 RLS 활성화
ALTER TABLE work_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_share_access_logs ENABLE ROW LEVEL SECURITY;

-- 4. 프로필 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. 기능 플래그 테이블 RLS 활성화 (필요시)
-- ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- 참고: 실제 RLS 정책은 Drizzle 스키마 파일에 정의되어 있으며
-- Drizzle 마이그레이션 실행 시 자동으로 적용됩니다.
