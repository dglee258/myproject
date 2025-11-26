/**
 * 직접 테이블 생성 스크립트
 *
 * 마이그레이션 시스템을 우회하여 직접 SQL 실행
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 확인
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ 환경 변수가 필요합니다:");
  console.error("   SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  console.log("🔄 비디오 분석 제한 테이블 생성 시작...");

  // SQL 파일 읽기
  const sqlContent = readFileSync(
    join(
      __dirname,
      "sql",
      "migrations",
      "0012_add_video_analysis_rate_limits.sql",
    ),
    "utf8",
  );

  try {
    // SQL 실행 (PostgreSQL 함수가 있다고 가정)
    const { data, error } = await supabase.rpc("exec_sql", {
      query: sqlContent,
    });

    if (error) {
      console.log("⚠️  RPC 함수 없음. 대체 방법 시도...");

      // 테이블 존재 여부 확인
      const { data: tables, error: checkError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "work_video_analysis_rate_limits");

      if (checkError) {
        console.log("❌ 테이블 확인 실패:", checkError.message);
        return;
      }

      if (tables && tables.length > 0) {
        console.log("✅ 테이블이 이미 존재합니다!");
        return;
      }

      console.log("❌ 테이블이 존재하지 않습니다. 수동 생성이 필요합니다.");
      console.log("\n📋 수동 실행 SQL:");
      console.log("```sql");
      console.log(sqlContent);
      console.log("```");
    } else {
      console.log("✅ 테이블 생성 완료!");
    }
  } catch (err) {
    console.error("❌ 실행 중 에러:", err.message);
  }
}

executeSQL()
  .then(() => {
    console.log("🏁 스크립트 완료");
  })
  .catch((err) => {
    console.error("💥 스크립트 실패:", err);
  });
