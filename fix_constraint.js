import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraint() {
  try {
    console.log("🔧 Rate Limiting 유니크 제약조건 추가 시작...");

    // SQL 파일 읽기
    const sql = fs.readFileSync("./fix_rate_limit_constraint.sql", "utf8");

    // SQL 실행
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      console.error("❌ SQL 실행 실패:", error);

      // exec_sql이 없으면 직접 SQL 실행 시도
      console.log("🔄 대체 방법으로 시도...");
      const { data: data2, error: error2 } = await supabase
        .from("work_video_analysis_rate_limits")
        .select("*")
        .limit(1);

      if (error2) {
        console.error("❌ 테이블 접근도 실패:", error2);
      } else {
        console.log("✅ 테이블은 정상. Dashboard에서 SQL을 직접 실행하세요.");
      }
    } else {
      console.log("✅ 유니크 제약조건 추가 완료!");
      console.log("📊 결과:", data);
    }
  } catch (error) {
    console.error("❌ 에러 발생:", error.message);
  }
}

fixConstraint();
