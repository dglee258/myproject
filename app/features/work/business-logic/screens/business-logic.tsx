import type { Route } from "./+types/business-logic";

import makeServerClient from "~/core/lib/supa-client.server";
import { getUserWorkflows } from "../queries.server";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  FileVideo,
  Lightbulb,
  Loader2,
  Maximize,
  Pause,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, useFetcher, useRevalidator, data, useNavigate } from "react-router";
import { toast } from "sonner";

import { Badge } from "~/core/components/ui/badge";
import { BorderBeam } from "~/core/components/ui/border-beam";
import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Label } from "~/core/components/ui/label";
import { ShineBorder } from "~/core/components/ui/shine-border";
import { Textarea } from "~/core/components/ui/textarea";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "업무프로세스 " },
    {
      name: "description",
      content: "동영상을 AI로 분석하여 업무 프로세스 자동 생성",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workflows = await getUserWorkflows(user.id);
  
  return { workflows };
}

// 메모 저장 action
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const stepId = parseInt(formData.get("stepId") as string);
    const notes = formData.get("notes") as string;

    if (isNaN(stepId)) {
      return data({ error: "Invalid step ID" }, { status: 400 });
    }

    // DB 업데이트
    const { updateStepNotes } = await import("../queries.server");
    await updateStepNotes(stepId, notes || "");

    return data({ success: true, message: "메모가 저장되었습니다" });
  } catch (error) {
    console.error("Update notes error:", error);
    return data(
      { error: "Failed to update notes" },
      { status: 500 },
    );
  }
}

interface VideoAnalysis {
  id: string;
  title: string;
  duration: string;
  uploadDate: string;
  status: "analyzed" | "analyzing" | "pending";
  thumbnail: string;
  videoUrl?: string;
  steps: LogicStep[];
}

interface LogicStep {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  confidence: number;
  type: "click" | "input" | "navigate" | "wait" | "decision";
  screenshot_url?: string;
  notes?: string; // 추가 설명
}

// Helper function to format duration
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper function to format date
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default function BusinessLogic({ loaderData }: Route.ComponentProps) {
  const { workflows: dbWorkflows } = loaderData;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  
  // Transform database workflows to VideoAnalysis format (메모이제이션)
  const mockVideos: VideoAnalysis[] = useMemo(() => dbWorkflows.map((workflow: any) => {
    // Generate Supabase Storage URL if storage_path exists
    const videoUrl = workflow.sourceVideo?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/work-videos/${workflow.sourceVideo.storage_path}`
      : undefined;

    return {
      id: workflow.workflow_id.toString(),
      title: workflow.title,
      duration: formatDuration(workflow.duration_seconds),
      uploadDate: formatDate(workflow.created_at),
      status: workflow.status as "analyzed" | "analyzing" | "pending",
      thumbnail: workflow.thumbnail_url || "/placeholder-video.jpg",
      videoUrl,
      steps: (workflow.steps || [])
        .sort((a: any, b: any) => a.sequence_no - b.sequence_no)
        .map((step: any) => ({
          id: step.step_id,
          action: step.action,
          description: step.description,
          timestamp: formatDuration(step.timestamp_seconds),
          confidence: step.confidence || 0,
          type: step.type as "click" | "input" | "navigate" | "wait" | "decision",
          screenshot_url: step.screenshot_url || undefined,
          notes: step.notes || undefined,
        })),
    };
  }), [dbWorkflows]);

  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(
    mockVideos[0] || null,
  );
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]); // 버튼 클릭으로 고정된 단계
  const [hoveredStep, setHoveredStep] = useState<number | null>(null); // hover 상태 단계
  const [editingStep, setEditingStep] = useState<LogicStep | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 비디오 변경 시 수정 모드 리셋
  useEffect(() => {
    setIsEditMode(false);
  }, [selectedVideo?.id]);

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId],
    );
  };

  // 단계가 열려있는지 확인 (hover 또는 고정)
  const isStepOpen = (stepId: number) => {
    return expandedSteps.includes(stepId) || hoveredStep === stepId;
  };

  const openEditDialog = (step: LogicStep) => {
    setEditingStep(step);
    setEditNotes(step.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedVideo || !editingStep) return;

    // 낙관적 업데이트: 즉시 UI에 반영
    const updatedSteps = selectedVideo.steps.map((step) =>
      step.id === editingStep.id ? { ...step, notes: editNotes } : step,
    );
    setSelectedVideo({ ...selectedVideo, steps: updatedSteps });

    // FormData로 DB에 저장
    const formData = new FormData();
    formData.append("stepId", editingStep.id.toString());
    formData.append("notes", editNotes);

    fetcher.submit(formData, { method: "post" });

    // 다이얼로그 닫고 상태 초기화
    setIsEditDialogOpen(false);
    setEditingStep(null);
    setEditNotes("");
    
    toast.success("메모가 저장되었습니다");
  };

  // fetcher 성공 시 데이터 리로드
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  // dbWorkflows 업데이트 시 선택된 비디오도 동기화
  useEffect(() => {
    if (selectedVideo) {
      const updatedVideo = mockVideos.find((v) => v.id === selectedVideo.id);
      if (updatedVideo && JSON.stringify(updatedVideo) !== JSON.stringify(selectedVideo)) {
        setSelectedVideo(updatedVideo);
      }
    }
  }, [dbWorkflows]); // mockVideos 대신 dbWorkflows를 의존성으로 사용

  const handleEditProcess = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      toast.success("수정 모드가 활성화되었습니다");
    } else {
      toast.success("변경사항이 저장되었습니다");
    }
  };

  const getStepIcon = (type: LogicStep["type"]) => {
    switch (type) {
      case "click":
        return "🖱️";
      case "input":
        return "⌨️";
      case "navigate":
        return "🧭";
      case "wait":
        return "⏱️";
      case "decision":
        return "🔀";
      default:
        return "📝";
    }
  };

  const getStepColor = (type: LogicStep["type"]) => {
    switch (type) {
      case "click":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "input":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "navigate":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      case "wait":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
      case "decision":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              업무 프로세스
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              업무 동영상을 업로드하면 AI가 자동으로 프로세스를 분석해드려요
            </p>
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto sm:shrink-0"
            onClick={() => {
              console.log('Upload button clicked');
              navigate('/work/upload');
            }}
          >
            <Plus className="mr-2 size-4" />
            동영상 업로드
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Video List Sidebar */}
        <div className="md:col-span-2 lg:col-span-1">
          <Card className="p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileVideo className="size-5" />
              업무 목록
            </h2>
            <div className="space-y-3">
              {mockVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`hover:bg-muted w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedVideo?.id === video.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="mb-2 flex items-start gap-3">
                    <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded">
                      <FileVideo className="text-muted-foreground size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-medium">
                        {video.title}
                      </h3>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <Clock className="size-3" />
                        {video.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        video.status === "analyzed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {video.status === "analyzed"
                        ? "✅ 분석 완료"
                        : video.status === "analyzing"
                          ? "⏳ 분석 중"
                          : "⏸️ 대기 중"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {video.uploadDate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content - Logic Flow */}
        <div className="md:col-span-2 lg:col-span-2">
          {selectedVideo ? (
            <Card className="p-6">
              {/* Video Header */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                    {selectedVideo.title}
                  </h2>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm sm:gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {selectedVideo.duration}
                    </span>
                    <span>{selectedVideo.uploadDate}</span>
                    {selectedVideo.status === "analyzed" && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3" />
                        AI 분석 완료
                      </Badge>
                    )}
                    {selectedVideo.status === "analyzing" && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Loader2 className="size-3 animate-spin" />
                        AI 분석 중
                      </Badge>
                    )}
                    {selectedVideo.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground flex items-center gap-1"
                      >
                        <Clock className="size-3" />
                        분석 대기
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto sm:shrink-0"
                    onClick={() => setIsVideoPlayerOpen(true)}
                  >
                    <Play className="mr-2 size-4" />
                    원본 동영상 보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={async () => {
                      if (confirm('이 프로세스를 삭제하시겠습니까?')) {
                        try {
                          const res = await fetch(`/api/work/workflows/${selectedVideo.id}`, {
                            method: 'DELETE',
                          });
                          if (res.ok) {
                            toast.success('프로세스가 삭제되었습니다');
                            revalidator.revalidate();
                            setSelectedVideo(mockVideos.filter(v => v.id !== selectedVideo.id)[0] || null);
                          } else {
                            toast.error('삭제에 실패했습니다');
                          }
                        } catch (error) {
                          toast.error('삭제 중 오류가 발생했습니다');
                        }
                      }
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    삭제
                  </Button>
                </div>
              </div>

              {/* Logic Steps */}
              {selectedVideo.status === "analyzed" ? (
                <div className="space-y-4">
                  {/* 수정 모드 알림 */}
                  {isEditMode && (
                    <div className="rounded-lg border-2 border-purple-500 bg-purple-100 p-4 shadow-lg dark:border-purple-400 dark:bg-purple-950 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-purple-500 p-2">
                            <Edit className="size-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                              ✏️ 수정 모드 활성화
                              <Badge variant="default" className="bg-purple-600">편집 중</Badge>
                            </h4>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                              각 단계 카드를 클릭하면 메모를 추가하거나 수정할 수 있습니다.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditMode(false)}
                          className="text-purple-700 hover:text-purple-900 dark:text-purple-300"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="text-primary size-5" />
                      단계별 업무 프로세스
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      클릭하거나 마우스를 올려 상세 내용을 확인하세요
                    </p>
                    {/* <Button variant="outline" size="sm">
                      순서도로 보기
                    </Button> */}
                  </div>

                  <div className="relative space-y-8">
                    {selectedVideo.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Step Card */}
                        <div
                          onMouseEnter={() => setHoveredStep(step.id)}
                          onMouseLeave={() => setHoveredStep(null)}
                          onClick={() => toggleStep(step.id)}
                          className={`group relative cursor-pointer rounded-lg border transition-all duration-300 ${
                            isStepOpen(step.id)
                              ? "border-primary bg-primary/5 shadow-primary/20 shadow-lg"
                              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                          }`}
                        >
                          {/* Magic UI: Border Beam - hover 시 테두리 빔 효과 */}
                          {hoveredStep === step.id &&
                            !expandedSteps.includes(step.id) && (
                              <BorderBeam size={200} duration={8} delay={0} />
                            )}

                          {/* Magic UI: Shine Border - 고정된 카드에 빛나는 효과 */}
                          {expandedSteps.includes(step.id) && (
                            <ShineBorder
                              borderWidth={3}
                              duration={3}
                              shineColor={[
                                "#a78bfa",
                                "#818cf8",
                                "#6366f1",
                                "#8b5cf6",
                              ]}
                            />
                          )}

                          <div className="p-4 transition-transform duration-300 group-hover:scale-[1.01]">
                            <div className="flex items-start gap-4">
                              {/* Step Number */}
                              <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                                {index + 1}
                              </div>

                              {/* Step Content */}
                              <div className="flex-1">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                      {getStepIcon(step.type)}
                                    </span>
                                    <h4 className="font-semibold">
                                      {step.action}
                                    </h4>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStep(step.id);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {expandedSteps.includes(step.id) ? (
                                      <ChevronDown className="size-5" />
                                    ) : (
                                      <ChevronRight className="size-5" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant="secondary"
                                    className={getStepColor(step.type)}
                                  >
                                    {step.type === "click" && "클릭"}
                                    {step.type === "input" && "입력"}
                                    {step.type === "navigate" && "이동"}
                                    {step.type === "wait" && "대기"}
                                    {step.type === "decision" && "판단"}
                                  </Badge>
                                  {step.timestamp && step.timestamp !== "0:00" && (
                                    <span className="text-muted-foreground text-sm">
                                      {step.timestamp}
                                    </span>
                                  )}
                                </div>

                                {/* Expanded Details */}
                                {isStepOpen(step.id) && (
                                  <div className="mt-3 space-y-3">
                                    {/* 스크린샷 이미지 */}
                                    {step.screenshot_url && (
                                      <div className="rounded-lg overflow-hidden border border-border">
                                        <img
                                          src={step.screenshot_url}
                                          alt={`${step.action} 스크린샷`}
                                          className="w-full h-auto"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}
                                    <div className="bg-muted/50 rounded-lg p-3">
                                      <p className="text-muted-foreground text-sm">
                                        {step.description}
                                      </p>
                                      {step.type === "decision" && (
                                        <div className="mt-3 flex gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-green-600"
                                          >
                                            ✓ 조건 충족 시
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-red-600"
                                          >
                                            ✗ 조건 미충족 시
                                          </Badge>
                                        </div>
                                      )}
                                    </div>

                                    {/* 추가 설명 섹션 */}
                                    {step.notes ? (
                                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                                        <div className="mb-2 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Lightbulb className="size-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                              추가 설명
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(step)}
                                          >
                                            <Edit className="size-3" />
                                          </Button>
                                        </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                          {step.notes}
                                        </p>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditDialog(step);
                                        }}
                                        className="w-full"
                                      >
                                        <Plus className="mr-2 size-4" />이
                                        단계에 메모 추가하기
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-primary/50 bg-primary/5 mt-8 rounded-lg border border-dashed p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="text-primary mt-0.5 size-5 shrink-0" />
                      <div className="flex-1">
                        <h4 className="mb-1 text-sm font-semibold">
                          팁: 각 단계에 메모를 추가하면 팀원들이 업무를 더 쉽게
                          이해할 수 있어요
                        </h4>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={handleEditProcess}
                          >
                            <Edit className="mr-2 size-3" />
                            {isEditMode ? "수정 완료" : "프로세스 수정하기"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-4">
                    <Bot className="text-primary size-16 animate-pulse" />
                    <Sparkles className="text-primary absolute -top-1 -right-1 size-6 animate-bounce" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    ✨ AI가 열심히 분석하고 있어요
                  </h3>
                  <p className="text-muted-foreground mb-1 text-sm">
                    동영상에서 업무 프로세스를 추출하는 중이에요
                  </p>
                  <p className="text-muted-foreground text-xs">
                    잠시만 기다려주세요 (1-2분 소요)
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-muted mb-4 rounded-full p-4">
                <FileVideo className="text-muted-foreground size-16" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                👋 어떤 업무를 분석할까요?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                왼쪽에서 분석된 동영상을 선택하거나,
                <br />
                새로운 업무 동영상을 업로드해보세요
              </p>
              
            </Card>
          )}
        </div>
      </div>

      {/* 추가 설명 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="text-primary size-5" />
              단계 메모 추가하기
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{editingStep?.action}</span> 단계에
              대한 메모를 작성해보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                메모 내용
              </Label>
              <Textarea
                id="notes"
                placeholder="예) 이 단계에서는 반드시 고객 정보를 확인해야 합니다. 주문 번호가 정확한지 다시 한번 체크 필요"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-muted-foreground flex items-start gap-2 text-xs">
                  <Lightbulb className="mt-0.5 size-3 shrink-0" />
                  <span>주의사항, 팁, 예외 상황 등을 작성해보세요.</span>
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingStep(null);
                setEditNotes("");
              }}
            >
              <X className="mr-2 size-4" />
              취소
            </Button>
            <Button onClick={handleSaveNotes} disabled={fetcher.state === "submitting"}>
              {fetcher.state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  저장
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="size-5" />
              {selectedVideo?.title}
            </DialogTitle>
            <DialogDescription>
              원본 동영상을 재생하여 업무 프로세스를 확인하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Video Player */}
            <div className="bg-black relative aspect-video w-full overflow-hidden rounded-lg">
              {selectedVideo?.videoUrl ? (
                <video
                  className="h-full w-full"
                  controls
                  controlsList="nodownload"
                  poster={selectedVideo?.thumbnail}
                  src={selectedVideo.videoUrl}
                >
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <div className="text-center">
                    <FileVideo className="mx-auto size-12 mb-4 opacity-50" />
                    <p>동영상을 불러올 수 없습니다</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground size-4" />
                <span className="text-sm">
                  재생 시간: {selectedVideo?.duration}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileVideo className="text-muted-foreground size-4" />
                <span className="text-sm">
                  업로드: {selectedVideo?.uploadDate}
                </span>
              </div>
              {selectedVideo?.status === "analyzed" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  분석 완료 ({selectedVideo.steps.length}단계)
                </Badge>
              )}
            </div>

            {/* Playback Tips */}
            {/*  */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVideoPlayerOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
