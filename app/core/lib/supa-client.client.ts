import { createClient } from "@supabase/supabase-js";

// 브라우저용 Supabase 클라이언트 (익명 키 사용)
// 환경변수는 빌드 시 주입되어야 합니다.
export const supabaseBrowser = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);
