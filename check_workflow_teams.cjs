const postgres = require("postgres");
require("dotenv").config();

async function checkWorkflowTeams() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log("=== 워크플로우에서 사용하는 팀 ID 확인 ===");
    const workflowTeams = await sql`
      SELECT DISTINCT team_id
      FROM work_workflows 
      WHERE team_id IS NOT NULL
      ORDER BY team_id
    `;
    console.log("사용 중인 team_id:", workflowTeams);

    if (workflowTeams.length > 0) {
      console.log("\n=== 팀별 워크플로우 수 ===");
      const teamWorkflowCounts = await sql`
        SELECT 
          team_id,
          COUNT(*) as workflow_count,
          MIN(created_at) as first_created,
          MAX(created_at) as last_created
        FROM work_workflows 
        WHERE team_id IS NOT NULL
        GROUP BY team_id
        ORDER BY team_id
      `;
      console.log(teamWorkflowCounts);
    }
  } catch (error) {
    console.error("데이터 확인 중 오류:", error);
  } finally {
    await sql.end();
  }
}

checkWorkflowTeams();
