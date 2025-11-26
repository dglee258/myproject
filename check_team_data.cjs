const postgres = require("postgres");
require("dotenv").config();

async function checkTeamData() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log("=== 기존 팀 멤버 데이터 ===");
    const teamMembers = await sql`
      SELECT 
        team_id,
        user_id,
        email,
        role,
        status,
        COUNT(*) as member_count
      FROM work_team_members 
      GROUP BY team_id, user_id, email, role, status
      ORDER BY team_id, role
    `;
    console.log(teamMembers);

    console.log("\n=== 기존 팀 초대 데이터 ===");
    const teamInvites = await sql`
      SELECT 
        team_id,
        email,
        role,
        expires_at,
        accepted_at
      FROM work_team_invites 
      ORDER BY team_id
    `;
    console.log(teamInvites);

    console.log("\n=== 워크플로우에서 참조하는 팀 ID ===");
    const workflowTeams = await sql`
      SELECT 
        team_id,
        COUNT(*) as workflow_count,
        MIN(created_at) as first_workflow
      FROM work_workflows 
      WHERE team_id IS NOT NULL
      GROUP BY team_id
      ORDER BY team_id
    `;
    console.log(workflowTeams);

    console.log("\n=== 고유한 팀 ID 목록 ===");
    const distinctTeamIds = await sql`
      SELECT DISTINCT team_id FROM (
        SELECT team_id FROM work_team_members 
        WHERE team_id IS NOT NULL
        UNION 
        SELECT team_id FROM work_team_invites 
        WHERE team_id IS NOT NULL
        UNION
        SELECT team_id FROM work_workflows 
        WHERE team_id IS NOT NULL
      ) as all_teams
    `;
    console.log(distinctTeamIds);
  } catch (error) {
    console.error("데이터 확인 중 오류:", error);
  } finally {
    await sql.end();
  }
}

checkTeamData();
