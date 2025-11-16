import type { Route } from "./+types/upload";

import {
  CheckCircle2,
  FileVideo,
  Loader2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLoaderData, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Progress } from "~/core/components/ui/progress";
import makeServerClient from "~/core/lib/supa-client.server";
import { supabaseBrowser } from "~/core/lib/supa-client.client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "동영상 업로드 - AI 처리" },
    { name: "description", content: "동영상을 업로드하고 AI로 처리합니다" },
  ];
}

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

interface VideoFile {
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const [supabase] = makeServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null };
  }
  return { user };
}

export default function Upload() {
  const { user } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) =>
      file.type.startsWith("video/"),
    );

    if (videoFile) {
      processFile(videoFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    setVideoFile({
      file,
      preview,
      status: "idle",
      progress: 0,
    });
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;
    try {
      // 1) Storage 업로드 (서버 사이드로 전송)
      setVideoFile({ ...videoFile, status: "uploading", progress: 0 });

      const formData = new FormData();
      formData.append("file", videoFile.file);

      const uploadRes = await fetch("/api/work/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const j = await uploadRes.json().catch(() => ({}));
        throw new Error(j.error || `업로드 실패(${uploadRes.status})`);
      }

      const { path } = await uploadRes.json();

      // 2) 비디오 레코드 생성
      const createRes = await fetch("/api/work/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoFile.file.name.replace(/\.[^/.]+$/, ""),
          original_filename: videoFile.file.name,
          mime_type: videoFile.file.type,
          file_size: videoFile.file.size,
          storage_path: path,
        }),
      });
      if (!createRes.ok) {
        const j = await createRes.json().catch(() => ({}));
        throw new Error(j.error || `비디오 생성 실패(${createRes.status})`);
      }
      const { video_id } = await createRes.json();

      // 3) 분석 시작
      setVideoFile((prev) => (prev ? { ...prev, status: "processing", progress: 0 } : null));
      const analyzeBody: any = { video_id };
      if (teamId) {
        analyzeBody.team_id = teamId;
      }
      
      const analyzeRes = await fetch("/api/work/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      });
      if (!analyzeRes.ok) {
        const j = await analyzeRes.json().catch(() => ({}));
        throw new Error(j.error || `분석 시작 실패(${analyzeRes.status})`);
      }
      const { workflow_id } = await analyzeRes.json();

      // 4) 진행 상황 폴링
      await pollAnalysisProgress(workflow_id);
      setVideoFile((prev) => (prev ? { ...prev, status: "completed", progress: 100 } : null));

      // 5) 결과 페이지로 이동
      const resultUrl = teamId 
        ? `/work/business-logic?workflow=${workflow_id}&teamId=${teamId}`
        : `/work/business-logic?workflow=${workflow_id}`;
      window.location.href = resultUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      setVideoFile((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              error: error?.message || "업로드 중 오류가 발생했습니다",
            }
          : null,
      );
    }
  };

  async function pollAnalysisProgress(workflowId: number) {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/work/workflows/${workflowId}/status`);
          if (!res.ok) throw new Error(`상태 조회 실패(${res.status})`);
          const { status, progress } = await res.json();
          setVideoFile((prev) =>
            prev ? { ...prev, progress, status: status === "analyzed" ? "completed" : "processing" } : null,
          );
          if (status === "analyzed") {
            clearInterval(interval);
            resolve();
          }
        } catch (e) {
          clearInterval(interval);
          reject(e);
        }
      }, 2000);
    });
  }

  const handleRemove = () => {
    if (videoFile) {
      URL.revokeObjectURL(videoFile.preview);
    }
    setVideoFile(null);
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case "uploading":
        return "업로드 중...";
      case "processing":
        return "AI 처리 중...";
      case "completed":
        return "처리 완료";
      case "error":
        return "오류 발생";
      default:
        return "대기 중";
    }
  };

  const getStatusColor = (status: UploadStatus) => {
    switch (status) {
      case "uploading":
        return "text-blue-600";
      case "processing":
        return "text-purple-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">동영상 AI 처리</h1>
        <p className="text-muted-foreground">
          동영상을 업로드하면 AI가 자동으로 분석하고 처리합니다
        </p>
      </div>

      {/* Upload Area */}
      {!videoFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-lg border-2 border-dashed p-12 text-center transition-colors
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-6">
              <UploadIcon className="size-12 text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                동영상 파일을 드래그하거나 선택하세요
              </h3>
              <p className="text-sm text-muted-foreground">
                MP4, MOV, AVI, WebM 등 지원 (최대 500MB)
              </p>
            </div>

            <label htmlFor="file-upload" className="cursor-pointer">
              <Button type="button" asChild>
                <span>파일 선택</span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        /* Video Preview & Processing */
        <div className="space-y-6">
          {/* Video Card */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start gap-4">
              {/* Video Preview */}
              <div className="relative size-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                <video
                  src={videoFile.preview}
                  className="size-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <FileVideo className="size-8 text-white" />
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{videoFile.file.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {videoFile.status !== "uploading" &&
                    videoFile.status !== "processing" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemove}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={getStatusColor(videoFile.status)}>
                      {getStatusText(videoFile.status)}
                    </span>
                    {(videoFile.status === "uploading" ||
                      videoFile.status === "processing") && (
                      <span className="text-muted-foreground">
                        {videoFile.progress}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(videoFile.status === "uploading" ||
                    videoFile.status === "processing") && (
                    <Progress value={videoFile.progress} className="h-2" />
                  )}
                </div>

                {/* Processing Steps */}
                {(videoFile.status === "processing" ||
                  videoFile.status === "completed") && (
                  <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                    <h4 className="text-sm font-medium">AI 처리 단계</h4>
                    <div className="space-y-2">
                      <ProcessingStep
                        label="동영상 분석"
                        completed={videoFile.progress > 30}
                        active={
                          videoFile.status === "processing" &&
                          videoFile.progress <= 30
                        }
                      />
                      <ProcessingStep
                        label="객체 인식"
                        completed={videoFile.progress > 60}
                        active={
                          videoFile.status === "processing" &&
                          videoFile.progress > 30 &&
                          videoFile.progress <= 60
                        }
                      />
                      <ProcessingStep
                        label="최적화 및 변환"
                        completed={videoFile.status === "completed"}
                        active={
                          videoFile.status === "processing" &&
                          videoFile.progress > 60
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {videoFile.status === "idle" && (
              <>
                <Button onClick={handleUpload} size="lg" className="flex-1">
                  <UploadIcon className="mr-2 size-4" />
                  업로드 및 AI 처리 시작
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRemove}
                >
                  취소
                </Button>
              </>
            )}

            {videoFile.status === "completed" && (
              <>
                <Button size="lg" className="flex-1">
                  결과 확인
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRemove}
                >
                  새로운 파일 업로드
                </Button>
              </>
            )}
          </div>

          {/* Success Message */}
          {videoFile.status === "completed" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    처리 완료!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    동영상이 성공적으로 처리되었습니다. 결과를 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      {/*  */}
    </div>
  );
}

function ProcessingStep({
  label,
  completed,
  active,
}: {
  label: string;
  completed: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <CheckCircle2 className="size-4 text-green-600" />
      ) : active ? (
        <Loader2 className="size-4 animate-spin text-purple-600" />
      ) : (
        <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span
        className={`text-sm ${
          completed
            ? "text-green-600"
            : active
              ? "text-purple-600 font-medium"
              : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-primary">{icon}</div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
