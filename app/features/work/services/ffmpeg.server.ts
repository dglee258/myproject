import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
// Use bundled FFmpeg binary to avoid system dependency
import ffmpegPath from "ffmpeg-static";

export interface ExtractOptions {
  maxFrames?: number; // 상한선 (기본 8)
}

/**
 * FFmpeg로 키프레임/샘플 프레임을 추출합니다.
 * 서버에 ffmpeg가 설치되어 있어야 합니다.
 */
export async function extractFrames(
  videoPath: string,
  { maxFrames = 8 }: ExtractOptions = {},
): Promise<{ paths: string[]; cleanup: () => Promise<void> }> {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "frames-"));
  const pattern = path.join(outDir, "frame-%03d.jpg");

  // 장면 전환 감지 + 상한 적용: scene>0.3, 8장 상한
  // 상한은 -vframes와 조합, 또는 추출 후 잘라내기
  await runFfmpeg([
    "-i",
    videoPath,
    "-vf",
    "select='gt(scene,0.3)',metadata=print",
    "-vsync",
    "vfr",
    pattern,
  ]);

  // 상한 적용
  let files = (await fs.readdir(outDir))
    .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
    .sort();
  if (files.length === 0) {
    // 장면 전환이 안 잡힐 경우 균등 샘플링으로 대체
    await runFfmpeg(["-i", videoPath, "-vf", "fps=1", path.join(outDir, "sample-%03d.jpg")]);
    files = (await fs.readdir(outDir)).sort();
  }
  if (files.length > maxFrames) files = files.slice(0, maxFrames);

  const paths = files.map((f) => path.join(outDir, f));

  return {
    paths,
    cleanup: async () => {
      try {
        await fs.rm(outDir, { recursive: true, force: true });
      } catch {}
    },
  };
}

async function runFfmpeg(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const bin = (ffmpegPath as unknown as string) || "ffmpeg";
    const p = spawn(bin, ["-y", ...args]);
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr}`));
    });
  });
}
