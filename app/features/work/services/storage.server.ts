import adminClient from "~/core/lib/supa-admin-client.server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

/**
 * Supabase Storage에서 비디오를 임시 디렉토리로 다운로드합니다.
 * 서버 전용. 반환된 cleanup()을 호출해 파일을 제거하세요.
 */
export async function downloadVideoFromSupabase(storagePath: string) {
  if (!storagePath) throw new Error("Invalid storage path");

  const bucket = "work-videos";
  const { data, error } = await adminClient.storage.from(bucket).download(storagePath);
  if (error) throw error;

  // data는 Blob 유사 객체일 수 있으므로 ArrayBuffer 변환 후 Buffer로 저장
  // @ts-ignore
  const arrayBuffer = await data.arrayBuffer?.() ?? data;
  const buffer = Buffer.isBuffer(arrayBuffer) ? arrayBuffer : Buffer.from(arrayBuffer);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-"));
  const fileName = path.basename(storagePath).replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(tmpDir, fileName || `video_${Date.now()}.mp4`);
  await fs.writeFile(filePath, buffer);

  return {
    filePath,
    cleanup: async () => {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    },
  };
}
