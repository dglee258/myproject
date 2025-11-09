import type { Route } from "./+types/demo-work";

import {
  AlertCircle,
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
  LogIn,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "~/core/components/ui/alert";
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
    { title: "업무프로세스 데모 - 체험하기" },
    {
      name: "description",
      content: "로그인 없이 AI 업무 프로세스 분석 기능을 체험해보세요",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // 데모 페이지는 인증 불필요 - DB에서 데모 데이터 로드
  const { getDemoWorkflows } = await import("../queries.server");
  const workflows = await getDemoWorkflows();
  return { isDemoMode: true, workflows };
}

interface VideoAnalysis {
  id: string;
  title: string;
  duration: string;
  uploadDate: string;
  status: "analyzed" | "analyzing" | "pending";
  thumbnail: string;
  steps: LogicStep[];
}

interface LogicStep {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  confidence: number;
  type: "click" | "input" | "navigate" | "wait" | "decision";
  notes?: string;
}

// Helper functions
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default function DemoWork({ loaderData }: Route.ComponentProps) {
  const { isDemoMode, workflows: dbWorkflows } = loaderData;
  
  // DB 데이터를 VideoAnalysis 형식으로 변환
  const mockVideos: VideoAnalysis[] = dbWorkflows.map((workflow: any) => ({
    id: workflow.workflow_id.toString(),
    title: workflow.title,
    duration: formatDuration(workflow.duration_seconds),
    uploadDate: formatDate(workflow.created_at),
    status: workflow.status as "analyzed" | "analyzing" | "pending",
    thumbnail: workflow.thumbnail_url || "/placeholder-video.jpg",
    steps: (workflow.steps || [])
      .sort((a: any, b: any) => a.sequence_no - b.sequence_no)
      .map((step: any) => ({
        id: step.step_id,
        action: step.action,
        description: step.description,
        timestamp: step.timestamp_label || "00:00",
        confidence: step.confidence || 0,
        type: step.type as "click" | "input" | "navigate" | "wait" | "decision",
        notes: step.notes || undefined,
      })),
  }));

  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(
    mockVideos[0] || null,
  );
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<LogicStep | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

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

  const isStepOpen = (stepId: number) => {
    return expandedSteps.includes(stepId) || hoveredStep === stepId;
  };

  const openEditDialog = (step: LogicStep) => {
    toast.info("데모 모드에서는 편집할 수 없습니다. 로그인하여 실제 기능을 사용해보세요!");
    return;
  };

  const handleSaveNotes = () => {
    setIsEditDialogOpen(false);
    setEditingStep(null);
    setEditNotes("");
  };

  const handleEditProcess = () => {
    toast.info("데모 모드에서는 수정할 수 없습니다. 로그인하여 실제 기능을 사용해보세요!");
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
      {/* 데모 모드 배너 */}
      {showDemoBanner && (
        <Alert className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950">
          <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-lg font-bold text-blue-900 dark:text-blue-100">
            🎉 체험 모드로 둘러보는 중입니다
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-blue-800 dark:text-blue-200">
              실제로 동영상을 업로드하고 AI 분석을 받으려면 로그인하세요. 
              무료로 시작할 수 있습니다!
            </p>
            <div className="flex gap-2">
              <Link to="/login">
                <Button size="sm" className="gap-2">
                  <LogIn className="size-4" />
                  로그인하기
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDemoBanner(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">
                업무 프로세스 체험
              </h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" />
                데모
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              업무 동영상을 AI가 자동으로 분석하여 프로세스를 추출합니다
            </p>
          </div>
          <Button size="lg" disabled className="w-full sm:w-auto">
            <Plus className="mr-2 size-4" />
            동영상 업로드 (로그인 필요)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Video List Sidebar */}
        <div className="md:col-span-2 lg:col-span-1">
          <Card className="p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileVideo className="size-5" />
              샘플 업무 목록
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
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto sm:shrink-0"
                  disabled
                >
                  원본 동영상 보기 (로그인 필요)
                </Button>
              </div>

              {/* Logic Steps */}
              {selectedVideo.status === "analyzed" ? (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="text-primary size-5" />
                      단계별 업무 프로세스
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      클릭하거나 마우스를 올려 상세 내용을 확인하세요
                    </p>
                  </div>

                  <div className="relative space-y-8">
                    {selectedVideo.steps.map((step, index) => (
                      <div key={step.id} className="relative">
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
                          {hoveredStep === step.id &&
                            !expandedSteps.includes(step.id) && (
                              <BorderBeam size={200} duration={8} delay={0} />
                            )}

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
                              <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                                {step.id}
                              </div>

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
                                  <span className="text-muted-foreground text-sm">
                                    {step.timestamp}
                                  </span>
                                </div>

                                {isStepOpen(step.id) && (
                                  <div className="mt-3 space-y-3">
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
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="border-primary/50 bg-primary/5 mt-8 rounded-lg border border-dashed p-4">
                    <div className="flex items-start gap-3">
                      <LogIn className="text-primary mt-0.5 size-5 shrink-0" />
                      <div className="flex-1">
                        <h4 className="mb-2 text-sm font-semibold">
                          이 기능이 마음에 드시나요? 지금 바로 시작하세요!
                        </h4>
                        <p className="text-muted-foreground mb-3 text-xs">
                          로그인하면 직접 동영상을 업로드하고, AI 분석을 받고, 팀원들과 공유할 수 있습니다.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link to="/join">
                            <Button size="sm" className="w-full gap-2 sm:w-auto">
                              <Sparkles className="size-3" />
                              무료로 시작하기
                            </Button>
                          </Link>
                          <Link to="/login">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full gap-2 sm:w-auto"
                            >
                              <LogIn className="size-3" />
                              로그인하기
                            </Button>
                          </Link>
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
                    실제 분석을 받으려면 로그인하세요!
                  </p>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
