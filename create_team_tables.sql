-- 팀 관련 테이블 생성 (기존 데이터 보존)

-- 팀 테이블
CREATE TABLE IF NOT EXISTS work_teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 팀 멤버 상태 ENUM
CREATE TYPE IF NOT EXISTS team_member_status AS ENUM ('active', 'pending', 'inactive');

-- 팀 멤버 역할 ENUM  
CREATE TYPE IF NOT EXISTS team_member_role AS ENUM ('owner', 'admin', 'member');

-- 팀 멤버 테이블
CREATE TABLE IF NOT EXISTS work_team_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES work_teams(team_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role team_member_role NOT NULL DEFAULT 'member',
    status team_member_status NOT NULL DEFAULT 'pending',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 팀 초대 토큰 테이블
CREATE TABLE IF NOT EXISTS work_team_invites (
    invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES work_teams(team_id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role team_member_role NOT NULL DEFAULT 'member',
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS 활성화
ALTER TABLE work_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_team_invites ENABLE ROW LEVEL SECURITY;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_teams_owner_id ON work_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_work_team_members_team_id ON work_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_work_team_members_user_id ON work_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_work_team_invites_team_id ON work_team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_work_team_invites_token ON work_team_invites(token);
