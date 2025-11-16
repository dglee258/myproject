-- Migration: Team Hierarchy Structure
-- 팀 > 워크플로우 계층 구조 도입
-- 팀원은 팀에 속하고, 워크플로우는 팀에 속함
-- 워크플로우는 팀 전체 or 특정 멤버에게만 공유 가능

-- 1. 팀 멤버 상태 enum 생성
CREATE TYPE team_member_status AS ENUM ('active', 'pending', 'inactive');

-- 2. 팀 멤버 역할 enum 생성
CREATE TYPE team_member_role AS ENUM ('owner', 'admin', 'member');

-- 3. 팀 테이블 생성
CREATE TABLE work_teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. 팀 멤버 테이블 생성
CREATE TABLE work_team_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES work_teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- 초대된 이메일 (가입 전에는 user_id가 NULL일 수 있음)
  role team_member_role NOT NULL DEFAULT 'member',
  status team_member_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. 팀 초대 토큰 테이블 생성
CREATE TABLE work_team_invites (
  invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES work_teams(team_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_member_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. 워크플로우에 team_id 추가
ALTER TABLE work_workflows ADD COLUMN team_id UUID REFERENCES work_teams(team_id) ON DELETE CASCADE;

-- 7. 워크플로우 공유 테이블 생성
CREATE TABLE work_workflow_shares (
  share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id BIGINT NOT NULL REFERENCES work_workflows(workflow_id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES work_team_members(member_id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. 인덱스 생성
CREATE INDEX idx_team_members_team ON work_team_members(team_id);
CREATE INDEX idx_team_members_user ON work_team_members(user_id);
CREATE INDEX idx_team_invites_team ON work_team_invites(team_id);
CREATE INDEX idx_team_invites_token ON work_team_invites(token);
CREATE INDEX idx_workflow_shares_workflow ON work_workflow_shares(workflow_id);
CREATE INDEX idx_workflow_shares_member ON work_workflow_shares(team_member_id);
CREATE INDEX idx_workflows_team ON work_workflows(team_id);

-- 9. RLS 활성화 및 정책 설정

-- work_teams RLS
ALTER TABLE work_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams they belong to"
  ON work_teams FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM work_team_members
      WHERE work_team_members.team_id = work_teams.team_id
        AND work_team_members.user_id = auth.uid()
        AND work_team_members.status = 'active'
    )
  );

CREATE POLICY "Team owners can update their teams"
  ON work_teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create teams"
  ON work_teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams"
  ON work_teams FOR DELETE
  USING (auth.uid() = owner_id);

-- work_team_members RLS
ALTER TABLE work_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their teams"
  ON work_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_members.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members wm
            WHERE wm.team_id = work_teams.team_id
              AND wm.user_id = auth.uid()
              AND wm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Team owners and admins can insert members"
  ON work_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_members.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members wm
            WHERE wm.team_id = work_teams.team_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
              AND wm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Team owners and admins can update members"
  ON work_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_members.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members wm
            WHERE wm.team_id = work_teams.team_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
              AND wm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Team owners and admins can delete members"
  ON work_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_members.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members wm
            WHERE wm.team_id = work_teams.team_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
              AND wm.status = 'active'
          )
        )
    )
  );

-- work_team_invites RLS
ALTER TABLE work_team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invites for their teams"
  ON work_team_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_invites.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members
            WHERE work_team_members.team_id = work_teams.team_id
              AND work_team_members.user_id = auth.uid()
              AND work_team_members.role IN ('owner', 'admin')
              AND work_team_members.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Team owners and admins can create invites"
  ON work_team_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_teams
      WHERE work_teams.team_id = work_team_invites.team_id
        AND (
          work_teams.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members
            WHERE work_team_members.team_id = work_teams.team_id
              AND work_team_members.user_id = auth.uid()
              AND work_team_members.role IN ('owner', 'admin')
              AND work_team_members.status = 'active'
          )
        )
    )
  );

-- work_workflow_shares RLS
ALTER TABLE work_workflow_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for workflows they can access"
  ON work_workflow_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_workflows ww
      JOIN work_teams wt ON wt.team_id = ww.team_id
      WHERE ww.workflow_id = work_workflow_shares.workflow_id
        AND (
          wt.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members
            WHERE work_team_members.team_id = wt.team_id
              AND work_team_members.user_id = auth.uid()
              AND work_team_members.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Team owners and admins can manage workflow shares"
  ON work_workflow_shares FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM work_workflows ww
      JOIN work_teams wt ON wt.team_id = ww.team_id
      WHERE ww.workflow_id = work_workflow_shares.workflow_id
        AND (
          wt.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM work_team_members
            WHERE work_team_members.team_id = wt.team_id
              AND work_team_members.user_id = auth.uid()
              AND work_team_members.role IN ('owner', 'admin')
              AND work_team_members.status = 'active'
          )
        )
    )
  );

-- 10. 기존 워크플로우에 대한 자동 팀 생성 및 매핑 (옵션)
-- 기존 워크플로우가 있으면 각 owner별로 기본 팀을 생성하고 연결
-- 운영 환경에서는 주의해서 실행해야 함

-- 각 owner별로 "My Team" 생성
INSERT INTO work_teams (name, description, owner_id)
SELECT DISTINCT 
  '내 팀', 
  '자동 생성된 기본 팀',
  owner_id
FROM work_workflows
WHERE team_id IS NULL AND owner_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 워크플로우를 각 owner의 팀에 연결
UPDATE work_workflows w
SET team_id = (
  SELECT team_id 
  FROM work_teams t 
  WHERE t.owner_id = w.owner_id 
  LIMIT 1
)
WHERE w.team_id IS NULL AND w.owner_id IS NOT NULL;

-- 각 팀 owner를 팀 멤버로 자동 추가
INSERT INTO work_team_members (team_id, user_id, email, role, status, invited_by, joined_at)
SELECT DISTINCT
  t.team_id,
  t.owner_id,
  u.email,
  'owner'::team_member_role,
  'active'::team_member_status,
  t.owner_id,
  NOW()
FROM work_teams t
JOIN auth.users u ON u.id = t.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM work_team_members tm
  WHERE tm.team_id = t.team_id AND tm.user_id = t.owner_id
)
ON CONFLICT DO NOTHING;

-- 기존 workflow_members를 team_members로 이관
-- (work_workflow_members 데이터를 work_team_members로 복사)
INSERT INTO work_team_members (team_id, user_id, email, role, status, invited_by, joined_at)
SELECT DISTINCT
  ww.team_id,
  wwm.user_id,
  COALESCE(wwm.member_email_snapshot, u.email),
  CASE wwm.role
    WHEN 'admin' THEN 'admin'::team_member_role
    ELSE 'member'::team_member_role
  END,
  CASE wwm.status
    WHEN 'active' THEN 'active'::team_member_status
    WHEN 'pending' THEN 'pending'::team_member_status
    ELSE 'inactive'::team_member_status
  END,
  ww.owner_id,
  wwm.joined_at
FROM work_workflow_members wwm
JOIN work_workflows ww ON ww.workflow_id = wwm.workflow_id
JOIN auth.users u ON u.id = wwm.user_id
WHERE ww.team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM work_team_members tm
    WHERE tm.team_id = ww.team_id AND tm.user_id = wwm.user_id
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE work_teams IS '팀: 워크플로우의 최상위 엔티티';
COMMENT ON TABLE work_team_members IS '팀 멤버: active(활동중), pending(대기중), inactive(제외됨)';
COMMENT ON TABLE work_team_invites IS '팀 초대: 이메일/링크 기반 초대';
COMMENT ON TABLE work_workflow_shares IS '워크플로우 공유: 팀 내 특정 멤버에게만 공유';
