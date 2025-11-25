import type { DragEndEvent } from "@dnd-kit/core";

import type { Route } from "./+types/business-logic";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  Edit3,
  FileText,
  FileVideo,
  GripVertical,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Maximize,
  Menu,
  Pause,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  data,
  useFetcher,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/core/components/ui/sheet";
import { Textarea } from "~/core/components/ui/textarea";
import { useIsMobile } from "~/core/hooks/use-mobile";
import makeServerClient from "~/core/lib/supa-client.server";

import { getUserWorkflows } from "../queries.server";

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
  try {
    const [client] = makeServerClient(request);
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const workflows = await getUserWorkflows(user.id);

    return { workflows };
  } catch (error: any) {
    // Handle Supabase rate limit error specifically
    if (error?.status === 429 || error?.code === "over_request_rate_limit") {
      console.warn(
        "Supabase rate limit reached, using cached data if available",
      );
      // Return empty workflows instead of redirecting to login
      return { workflows: [], rateLimitWarning: true };
    }

    // For other auth errors, still redirect to login
    if (error?.status === 401) {
      throw new Response("Unauthorized", { status: 401 });
    }

    // For other errors, return empty data
    console.error("Loader error:", error);
    return { workflows: [], error: true };
  }
}

// 메모 저장 및 스텝 편집 action
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
    const actionType = formData.get("actionType") as string;

    if (actionType === "updateNotes") {
      const stepId = parseInt(formData.get("stepId") as string);
      const notes = formData.get("notes") as string;

      if (isNaN(stepId)) {
        return data({ error: "Invalid step ID" }, { status: 400 });
      }

      // DB 업데이트
      const { updateStepNotes } = await import("../queries.server");
      await updateStepNotes(stepId, notes || "");

      return data({ success: true, message: "메모가 저장되었습니다" });
    } else if (actionType === "updateStep") {
      const stepId = parseInt(formData.get("stepId") as string);
      const action = formData.get("action") as string;
      const description = formData.get("description") as string;

      if (isNaN(stepId)) {
        return data({ error: "Invalid step ID" }, { status: 400 });
      }

      // DB 업데이트
      const { updateStepDetails } = await import("../queries.server");
      await updateStepDetails(stepId, action, description);

      return data({ success: true, message: "스텝이 수정되었습니다" });
    } else if (actionType === "deleteStep") {
      const stepId = parseInt(formData.get("stepId") as string);

      if (isNaN(stepId)) {
        return data({ error: "Invalid step ID" }, { status: 400 });
      }

      // DB 삭제
      const { deleteStep } = await import("../queries.server");
      await deleteStep(stepId);

      return data({ success: true, message: "스텝이 삭제되었습니다" });
    } else if (actionType === "updateStepType") {
      const stepId = parseInt(formData.get("stepId") as string);
      const type = formData.get("type") as string;

      if (isNaN(stepId)) {
        return data({ error: "Invalid step ID" }, { status: 400 });
      }

      // DB 업데이트
      const { updateStepType } = await import("../queries.server");
      await updateStepType(stepId, type);

      return data({ success: true, message: "단계 유형이 수정되었습니다" });
    } else if (actionType === "reorderSteps") {
      const workflowId = parseInt(formData.get("workflowId") as string);
      const stepIds = JSON.parse(formData.get("stepIds") as string) as number[];

      if (isNaN(workflowId) || !Array.isArray(stepIds)) {
        return data({ error: "Invalid parameters" }, { status: 400 });
      }

      // DB 재정렬
      const { reorderSteps } = await import("../queries.server");
      await reorderSteps(workflowId, stepIds);

      return data({ success: true, message: "단계 순서가 변경되었습니다" });
    } else if (actionType === "addStep") {
      const workflowId = parseInt(formData.get("workflowId") as string);
      const sequenceNo = parseInt(formData.get("sequenceNo") as string);
      const action = formData.get("action") as string;
      const description = formData.get("description") as string;

      if (isNaN(workflowId) || isNaN(sequenceNo)) {
        return data({ error: "Invalid parameters" }, { status: 400 });
      }

      // DB에 새 단계 추가
      const { addStep } = await import("../queries.server");
      await addStep(
        workflowId,
        sequenceNo,
        action || "새 단계",
        description || "",
      );

      return data({ success: true, message: "새 단계가 추가되었습니다" });
    }

    return data({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("Action error:", error);
    return data({ error: "Failed to process request" }, { status: 500 });
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

// Demo style step component with modern UI and sortable support
function DemoStyleStep({
  step,
  index,
  isEditMode,
  editedStep,
  currentAction,
  currentDescription,
  getStepColor,
  handleStepTitleChange,
  handleStepDescriptionChange,
  handleDeleteStep,
  openEditDialog,
  getEditedStep,
  handleTypeChange,
}: {
  step: LogicStep;
  index: number;
  isEditMode: boolean;
  editedStep:
    | { action: string; description: string; type?: string }
    | undefined;
  currentAction: string;
  currentDescription: string;
  getStepColor: (type: LogicStep["type"]) => string;
  handleStepTitleChange: (stepId: number, newTitle: string) => void;
  handleStepDescriptionChange: (stepId: number, newDescription: string) => void;
  handleDeleteStep: (stepId: number) => void;
  openEditDialog: (step: LogicStep) => void;
  getEditedStep: (
    stepId: number,
  ) => { action: string; description: string; type?: string } | undefined;
  handleTypeChange: (stepId: number, newType: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [editedType, setEditedType] = useState(step.type);
  const [localAction, setLocalAction] = useState(currentAction);

  // Sync local action when currentAction changes (step.id changes)
  useEffect(() => {
    setLocalAction(currentAction);
  }, [currentAction, step.id]);

  // Sortable hooks for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const actionTypes = [
    {
      value: "click",
      label: "클릭",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      value: "input",
      label: "입력",
      color:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
    {
      value: "navigate",
      label: "이동",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    },
    {
      value: "wait",
      label: "대기",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    },
    {
      value: "decision",
      label: "판단",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
  ];

  const handleLocalTypeChange = (newType: string) => {
    setEditedType(newType as LogicStep["type"]);
    handleTypeChange(step.id, newType);
    setIsEditingType(false);
  };

  const currentTypeColor =
    actionTypes.find((t) => t.value === editedType)?.color ||
    getStepColor(step.type);

  return (
    <div
      className="relative"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        {...attributes}
        {...(isEditMode ? listeners : {})}
        onMouseEnter={() => !isEditMode && setIsExpanded(true)}
        onMouseLeave={() => !isEditMode && setIsExpanded(false)}
        onClick={(e) => {
          if (!isEditMode) {
            e.stopPropagation();
            setIsExpanded(true);
          }
        }}
        className={`group relative cursor-pointer rounded-lg border transition-all duration-300 ${
          isEditMode
            ? "shadow-blue-20/20 cursor-move border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg dark:border-blue-600 dark:bg-blue-50/50 dark:hover:bg-blue-100"
            : isExpanded
              ? "border-primary bg-primary/5 shadow-primary/20 shadow-lg"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
        }`}
      >
        <div className="p-4 transition-transform duration-300 group-hover:scale-[1.01]">
          <div className="flex items-start gap-4">
            {isEditMode && (
              <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                {index + 1}
              </div>
            )}
            {!isEditMode && (
              <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                {index + 1}
              </div>
            )}

            <div className="flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getStepIcon(step.type)}</span>
                  {isEditMode ? (
                    <Input
                      value={localAction}
                      onChange={(e) => {
                        setLocalAction(e.target.value);
                        handleStepTitleChange(step.id, e.target.value);
                      }}
                      className="border-blue-300 font-medium focus:border-blue-500"
                    />
                  ) : (
                    <h4 className="font-semibold">{currentAction}</h4>
                  )}
                </div>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                )}
                {!isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-5" />
                    ) : (
                      <ChevronRight className="size-5" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isEditMode ? (
                  <DropdownMenu
                    open={isEditingType}
                    onOpenChange={setIsEditingType}
                  >
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`cursor-pointer hover:opacity-80 ${currentTypeColor}`}
                      >
                        <Edit className="mr-1 size-3" />
                        {actionTypes.find((t) => t.value === editedType)?.label}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {actionTypes.map((type) => (
                        <DropdownMenuItem
                          key={type.value}
                          onClick={() => handleLocalTypeChange(type.value)}
                          className={type.color}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="outline" className={getStepColor(step.type)}>
                    {step.type === "click" && "클릭"}
                    {step.type === "input" && "입력"}
                    {step.type === "navigate" && "이동"}
                    {step.type === "wait" && "대기"}
                    {step.type === "decision" && "판단"}
                  </Badge>
                )}
                <span className="text-muted-foreground text-sm">
                  {step.timestamp}
                </span>
              </div>

              {(isExpanded || isEditMode) && (
                <div className="mt-3 space-y-3">
                  {isEditMode ? (
                    <div>
                      <Textarea
                        value={currentDescription}
                        onChange={(e) =>
                          handleStepDescriptionChange(step.id, e.target.value)
                        }
                        placeholder="이 단계에 대한 설명을 입력하세요"
                        rows={3}
                        className="resize-none border-blue-300 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-sm">
                        {currentDescription}
                      </p>
                    </div>
                  )}

                  {/* Screenshot */}
                  {step.screenshot_url && (
                    <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
                      <img
                        src={step.screenshot_url}
                        alt={currentAction}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Notes Section */}
                  {!isEditMode && (
                    <>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(step);
                              }}
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
                          <Plus className="mr-2 size-4" />이 단계에 메모
                          추가하기
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const { workflows: dbWorkflows, rateLimitWarning } = loaderData;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Transform database workflows to VideoAnalysis format (메모이제이션)
  const mockVideos: VideoAnalysis[] = useMemo(
    () =>
      dbWorkflows.map((workflow: any) => {
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
              type: step.type as
                | "click"
                | "input"
                | "navigate"
                | "wait"
                | "decision",
              screenshot_url: step.screenshot_url || undefined,
              notes: step.notes || undefined,
            })),
        };
      }),
    [dbWorkflows],
  );

  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(
    mockVideos[0] || null,
  );
  const [editingStep, setEditingStep] = useState<LogicStep | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSteps, setEditedSteps] = useState<
    Map<number, { action: string; description: string; type?: string }>
  >(new Map());
  const [deletedStepIds, setDeletedStepIds] = useState<Set<number>>(new Set());
  const [addedSteps, setAddedSteps] = useState<LogicStep[]>([]);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const originalVideoRef = useRef<VideoAnalysis | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 비디오 변경 시 수정 모드 리셋
  useEffect(() => {
    setIsEditMode(false);
    setEditedSteps(new Map());
    originalVideoRef.current = null; // 원본 상태 ref 초기화
  }, [selectedVideo?.id]);

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

  // fetcher 성공 시 데이터 리로드 (rate limit 방지를 위해 디바운스 추가)
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const timeoutId = setTimeout(() => {
        revalidator.revalidate();
      }, 1000); // 1초 디바운스

      return () => clearTimeout(timeoutId);
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  // dbWorkflows 업데이트 시 선택된 비디오도 동기화
  useEffect(() => {
    if (selectedVideo) {
      const updatedVideo = mockVideos.find((v) => v.id === selectedVideo.id);
      if (
        updatedVideo &&
        JSON.stringify(updatedVideo) !== JSON.stringify(selectedVideo)
      ) {
        setSelectedVideo(updatedVideo);
      }
    }
  }, [dbWorkflows]); // mockVideos 대신 dbWorkflows를 의존성으로 사용

  const handleEditProcess = () => {
    if (!isEditMode) {
      // Store original state for cancel functionality
      originalVideoRef.current = selectedVideo
        ? { ...selectedVideo, steps: [...selectedVideo.steps] }
        : null;

      // Initialize edited steps with current values when entering edit mode
      const newEditedSteps = new Map<
        number,
        { action: string; description: string }
      >();
      selectedVideo?.steps.forEach((step) => {
        newEditedSteps.set(step.id, {
          action: step.action,
          description: step.description,
        });
      });
      setEditedSteps(newEditedSteps);
      setDeletedStepIds(new Set());
      setAddedSteps([]);
      toast.success("수정 모드가 활성화되었습니다");
    } else {
      // Save all pending operations: reorders first, then deletes, adds, and edits
      if (!selectedVideo) return;

      // Process reordering if steps have been reordered
      if (originalVideoRef.current) {
        const originalOrder = originalVideoRef.current.steps.map((s) => s.id);
        const currentOrder = selectedVideo.steps.map((s) => s.id);

        if (JSON.stringify(originalOrder) !== JSON.stringify(currentOrder)) {
          const formData = new FormData();
          formData.append("actionType", "reorderSteps");
          formData.append("workflowId", selectedVideo.id);
          formData.append("stepIds", JSON.stringify(currentOrder));
          fetcher.submit(formData, { method: "post" });
        }
      }

      // Process deletions
      deletedStepIds.forEach((stepId) => {
        const formData = new FormData();
        formData.append("actionType", "deleteStep");
        formData.append("stepId", stepId.toString());
        fetcher.submit(formData, { method: "post" });
      });

      // Process additions
      addedSteps.forEach((step, index) => {
        const sequenceNo = selectedVideo.steps.length + index + 1;
        const formData = new FormData();
        formData.append("actionType", "addStep");
        formData.append("workflowId", selectedVideo.id);
        formData.append("sequenceNo", sequenceNo.toString());
        formData.append("action", step.action);
        formData.append("description", step.description);
        fetcher.submit(formData, { method: "post" });
      });

      // Save all edited steps including type changes
      editedSteps.forEach((editedStep, stepId) => {
        const originalStep = selectedVideo?.steps.find((s) => s.id === stepId);
        if (originalStep) {
          const hasChanges =
            originalStep.action !== editedStep.action ||
            originalStep.description !== editedStep.description ||
            (editedStep.type && originalStep.type !== editedStep.type);

          if (hasChanges) {
            if (editedStep.type && originalStep.type !== editedStep.type) {
              // Save type change separately
              const formData = new FormData();
              formData.append("actionType", "updateStepType");
              formData.append("stepId", stepId.toString());
              formData.append("type", editedStep.type);
              fetcher.submit(formData, { method: "post" });
            }

            if (
              originalStep.action !== editedStep.action ||
              originalStep.description !== editedStep.description
            ) {
              // Save action/description changes
              const formData = new FormData();
              formData.append("actionType", "updateStep");
              formData.append("stepId", stepId.toString());
              formData.append("action", editedStep.action);
              formData.append("description", editedStep.description);
              fetcher.submit(formData, { method: "post" });
            }
          }
        }
      });

      // Clear all pending operations
      setEditedSteps(new Map());
      setDeletedStepIds(new Set());
      setAddedSteps([]);
      toast.success("변경사항이 저장되었습니다");
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancelEdit = () => {
    // Clear all pending operations
    setEditedSteps(new Map());
    setDeletedStepIds(new Set());
    setAddedSteps([]);

    // Restore original video data from stored ref
    if (originalVideoRef.current) {
      setSelectedVideo(originalVideoRef.current);
    }

    setIsEditMode(false);
    toast.success("수정이 취소되었습니다");
  };

  const handleStepTitleChange = (stepId: number, newTitle: string) => {
    setEditedSteps((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(stepId) || { action: "", description: "" };
      newMap.set(stepId, { ...current, action: newTitle });
      return newMap;
    });
  };

  const handleStepDescriptionChange = (
    stepId: number,
    newDescription: string,
  ) => {
    setEditedSteps((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(stepId) || { action: "", description: "" };
      newMap.set(stepId, { ...current, description: newDescription });
      return newMap;
    });
  };

  const handleTypeChange = (stepId: number, newType: string) => {
    setEditedSteps((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(stepId) || { action: "", description: "" };
      newMap.set(stepId, { ...current, type: newType });
      return newMap;
    });
  };

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !selectedVideo) return;

    if (active.id !== over.id) {
      const oldIndex = selectedVideo.steps.findIndex(
        (step) => step.id === active.id,
      );
      const newIndex = selectedVideo.steps.findIndex(
        (step) => step.id === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSteps = arrayMove(selectedVideo.steps, oldIndex, newIndex);

        // Update UI immediately but don't save to backend yet
        setSelectedVideo({ ...selectedVideo, steps: newSteps });

        toast.success("단계 순서가 변경되었습니다 (저장 필요)");
      }
    }
  };

  const handleAddStep = async (insertAfterIndex?: number) => {
    if (!selectedVideo || !isEditMode) return;

    // Create temporary step for optimistic UI update
    const tempStep: LogicStep = {
      id: -Date.now(), // Temporary negative ID
      action: "새 단계",
      description: "",
      timestamp: "0:00",
      confidence: 0,
      type: "click" as const,
    };

    // Add to pending operations
    setAddedSteps((prev) => [...prev, tempStep]);

    // Update UI immediately
    const newSteps =
      insertAfterIndex !== undefined
        ? [
            ...selectedVideo.steps.slice(0, insertAfterIndex + 1),
            tempStep,
            ...selectedVideo.steps.slice(insertAfterIndex + 1),
          ]
        : [...selectedVideo.steps, tempStep];

    setSelectedVideo({ ...selectedVideo, steps: newSteps });
    toast.success("새 단계가 추가되었습니다 (저장 필요)");
  };

  const handleDeleteStep = (stepId: number) => {
    if (!selectedVideo || !isEditMode) return;

    // Add to pending operations
    setDeletedStepIds((prev) => new Set(prev).add(stepId));

    // Update UI immediately
    const newSteps = selectedVideo.steps.filter((step) => step.id !== stepId);
    setSelectedVideo({ ...selectedVideo, steps: newSteps });
    toast.success("단계가 삭제되었습니다 (저장 필요)");
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflowToDelete(workflowId);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      const response = await fetch(`/api/work/workflows/${workflowToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("워크플로우가 삭제되었습니다");

        // If the deleted workflow was selected, clear selection
        if (selectedVideo?.id === workflowToDelete) {
          setSelectedVideo(null);
        }

        // Revalidate the data to refresh the list
        revalidator.revalidate();
      } else {
        toast.error("워크플로우 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast.error("워크플로우 삭제에 실패했습니다");
    } finally {
      setWorkflowToDelete(null);
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

  const getEditedStep = (stepId: number) => {
    return editedSteps.get(stepId);
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  업무 프로세스
                </h1>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  관리
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                업무 동영상을 AI가 자동으로 분석하여 프로세스를 추출합니다
              </p>
            </div>
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              동영상 업로드
            </Button>
          </div>
        </div>

        {/* Rate Limit Warning */}
        {rateLimitWarning && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              ⚠️ API 요청 제한
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              서버 요청이 잠시 제한되었습니다. 잠시 후 다시 시도해주세요.
              페이지를 새로고침하면 정상적으로 로드될 수 있습니다.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Video List Sidebar */}
          <div className="md:col-span-2 lg:col-span-1">
            {/* Mobile Header with Hamburger Menu - No Card wrapper */}
            <div className="mb-4 md:hidden">
              <Sheet
                open={isMobileSidebarOpen}
                onOpenChange={setIsMobileSidebarOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="mb-4">
                    <Menu className="mr-2 h-4 w-4" />
                    업무 목록
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex h-full flex-col">
                    <div className="bg-background border-b p-4">
                      <h2 className="mb-1 flex items-center gap-2">
                        <FileVideo className="size-5" />
                        업무 목록
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        업무 목록을 관리하고 작업 내용을 프로세스로 문서화하세요
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <div className="space-y-3">
                          {mockVideos.map((video) => (
                            <button
                              key={video.id}
                              onClick={() => {
                                setSelectedVideo(video);
                                setIsEditMode(false);
                                setEditedSteps(new Map());
                                setIsMobileSidebarOpen(false);
                              }}
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
                                    video.status === "analyzed"
                                      ? "default"
                                      : "secondary"
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
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Card Wrapper - Hidden on Mobile */}
            <Card className="hidden p-4 md:block">
              {/* Desktop Header */}
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <FileVideo className="size-5" />
                  업무 목록
                </h2>
              </div>

              {/* Desktop Work List */}
              <div className="space-y-3">
                {mockVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setSelectedVideo(video);
                      setIsEditMode(false);
                      setEditedSteps(new Map());
                    }}
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
                    </div>
                  </div>
                  <div className="flex gap-1 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVideoPlayerOpen(true)}
                    >
                      <Play className="mr-2 size-4" />
                      원본 동영상 보기
                    </Button>
                    {isEditMode ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="mr-2 h-4 w-4" />
                          취소
                        </Button>
                        <Button size="sm" onClick={handleEditProcess}>
                          <Save className="mr-2 h-4 w-4" />
                          저장
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={handleEditProcess}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        수정 모드
                      </Button>
                    )}
                  </div>
                </div>

                {/* 수정 모드 알림 */}
                {isEditMode && (
                  <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <Edit className="size-5 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                      ✏️ 수정 모드 활성화
                    </AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      각 단계의 제목과 설명을 직접 수정할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Logic Steps */}
                {selectedVideo.status === "analyzed" ? (
                  <div className="space-y-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles className="text-primary size-5" />
                        단계별 업무 프로세스
                      </h3>
                      {isEditMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStep()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          단계 추가
                        </Button>
                      )}
                    </div>

                    <div className="relative space-y-8">
                      {isEditMode ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={selectedVideo.steps.map((step) => step.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {selectedVideo.steps.map((step, index) => (
                              <div key={step.id}>
                                <DemoStyleStep
                                  step={step}
                                  index={index}
                                  isEditMode={isEditMode}
                                  editedStep={getEditedStep(step.id)}
                                  currentAction={
                                    getEditedStep(step.id)?.action ||
                                    step.action
                                  }
                                  currentDescription={
                                    getEditedStep(step.id)?.description ||
                                    step.description
                                  }
                                  getStepColor={getStepColor}
                                  handleStepTitleChange={handleStepTitleChange}
                                  handleStepDescriptionChange={
                                    handleStepDescriptionChange
                                  }
                                  handleDeleteStep={handleDeleteStep}
                                  openEditDialog={openEditDialog}
                                  getEditedStep={getEditedStep}
                                  handleTypeChange={handleTypeChange}
                                />
                              </div>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        selectedVideo.steps.map((step, index) => (
                          <div key={step.id}>
                            <DemoStyleStep
                              step={step}
                              index={index}
                              isEditMode={isEditMode}
                              editedStep={getEditedStep(step.id)}
                              currentAction={
                                getEditedStep(step.id)?.action || step.action
                              }
                              currentDescription={
                                getEditedStep(step.id)?.description ||
                                step.description
                              }
                              getStepColor={getStepColor}
                              handleStepTitleChange={handleStepTitleChange}
                              handleStepDescriptionChange={
                                handleStepDescriptionChange
                              }
                              handleDeleteStep={handleDeleteStep}
                              openEditDialog={openEditDialog}
                              getEditedStep={getEditedStep}
                              handleTypeChange={handleTypeChange}
                            />
                          </div>
                        ))
                      )}
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
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>원본 동영상 보기</DialogTitle>
            <DialogDescription>{selectedVideo?.title}</DialogDescription>
          </DialogHeader>
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            {selectedVideo?.videoUrl ? (
              <video
                src={selectedVideo.videoUrl}
                controls
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                <FileVideo className="size-16" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Edit Dialog */}
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
              취소
            </Button>
            <Button onClick={handleSaveNotes}>
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workflow Confirmation Dialog */}
      <Dialog
        open={!!workflowToDelete}
        onOpenChange={() => setWorkflowToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>워크플로우 삭제</DialogTitle>
            <DialogDescription>
              이 워크플로우를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmDeleteWorkflow}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
