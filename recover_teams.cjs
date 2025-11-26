const postgres = require("postgres");
require("dotenv").config();

async function recoverTeams() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log("=== 팀별 owner 정보 확인 ===");
    const teamOwners = await sql`
      SELECT 
        team_id,
        owner_id,
        COUNT(*) as workflow_count,
        MIN(created_at) as first_created
      FROM work_workflows 
      WHERE team_id IS NOT NULL
      GROUP BY team_id, owner_id
      ORDER BY team_id
    `;
    console.log("팀별 owner:", teamOwners);

    // work_teams 테이블 생성
    console.log("\n=== work_teams 테이블 생성 ===");
    await sql`
      CREATE TABLE IF NOT EXISTS work_teams (
        team_id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    console.log("work_teams 테이블 생성 완료");

    // 기존 팀 데이터 복구
    for (const team of teamOwners) {
      console.log(`팀 복구: ${team.team_id} (owner: ${team.owner_id})`);
      await sql`
        INSERT INTO work_teams (team_id, name, description, owner_id)
        VALUES (${team.team_id}, 'Recovered Team', 'Automatically recovered team', ${team.owner_id})
        ON CONFLICT (team_id) DO NOTHING
      `;
    }
    console.log("팀 데이터 복구 완료");

    // 나머지 테이블들 생성
    console.log("\n=== 나머지 테이블 생성 ===");

    // ENUM 타입 생성
    await sql`CREATE TYPE IF NOT EXISTS team_member_status AS ENUM ('active', 'pending', 'inactive')`;
    await sql`CREATE TYPE IF NOT EXISTS team_member_role AS ENUM ('owner', 'admin', 'member')`;

    // work_team_members 테이블
    await sql`
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
      )
    `;

    // work_team_invites 테이블
    await sql`
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
      )
    `;

    console.log("모든 테이블 생성 완료");

    // 복구된 팀에 owner 멤버 추가
    console.log("\n=== 팀 owner 멤버 추가 ===");
    for (const team of teamOwners) {
      await sql`
        INSERT INTO work_team_members (team_id, user_id, role, status, joined_at)
        VALUES (${team.team_id}, ${team.owner_id}, 'owner', 'active', ${team.first_created})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log("팀 owner 멤버 추가 완료");

    // 최종 확인
    console.log("\n=== 최종 확인 ===");
    const teams = await sql`SELECT team_id, name, owner_id FROM work_teams`;
    console.log("복구된 팀들:", teams);
  } catch (error) {
    console.error("복구 중 오류:", error);
  } finally {
    await sql.end();
  }
}

recoverTeams();
