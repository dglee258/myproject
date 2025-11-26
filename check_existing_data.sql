-- 기존 팀 데이터 확인 (손실 방지)

-- 기존 팀 멤버 데이터 확인
SELECT 
    team_id,
    user_id,
    email,
    role,
    status,
    COUNT(*) as member_count
FROM work_team_members 
GROUP BY team_id, user_id, email, role, status
ORDER BY team_id, role;

-- 기존 팀 초대 데이터 확인  
SELECT 
    team_id,
    email,
    role,
    expires_at,
    accepted_at
FROM work_team_invites 
ORDER BY team_id;

-- 워크플로우에서 참조하는 팀 ID 확인
SELECT 
    team_id,
    COUNT(*) as workflow_count,
    MIN(created_at) as first_workflow
FROM work_workflows 
WHERE team_id IS NOT NULL
GROUP BY team_id
ORDER BY team_id;
