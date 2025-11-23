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
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  data,
  useFetcher,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";

import { Badge } from "~/core/components/ui/badge";
import { BorderBeam } from "~/core/components/ui/border-beam";
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
import { ShineBorder } from "~/core/components/ui/shine-border";
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

// Sortable step component for drag and drop
function SortableStep({
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

  const [isEditingType, setIsEditingType] = useState(false);
  const [editedType, setEditedType] = useState(step.type);

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

    // Call parent's handleTypeChange to store in editedSteps Map
    handleTypeChange(step.id, newType);
    setIsEditingType(false);
  };

  const currentTypeColor =
    actionTypes.find((t) => t.value === editedType)?.color ||
    getStepColor(step.type);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden transition-all duration-300 ${
        isEditMode
          ? "shadow-blue-20/20 cursor-move border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg dark:border-blue-600 dark:bg-blue-50/50 dark:hover:bg-blue-100"
          : ""
      }`}
    >
      <CardContent className="p-0">
        {/* Step Header */}
        <div
          className={`flex items-center gap-4 border-b p-4 ${
            isEditMode ? "bg-blue-50/50" : "bg-muted/30"
          }`}
        >
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              className="bg-muted hover:bg-muted/80 flex h-8 w-8 flex-shrink-0 cursor-move items-center justify-center rounded-lg"
            >
              <GripVertical className="text-muted-foreground h-4 w-4" />
            </div>
          )}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4169E1] text-white">
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
          <div className="min-w-0 flex-1">
            {isEditMode ? (
              <Input
                value={currentAction}
                onChange={(e) => handleStepTitleChange(step.id, e.target.value)}
                className="border-blue-300 font-medium focus:border-blue-500"
              />
            ) : (
              <h3
                className={`font-semibold ${
                  isEditMode
                    ? "border-b-2 border-dashed border-blue-300 pb-1 text-blue-900 dark:text-blue-100"
                    : ""
                }`}
              >
                {currentAction}
                {isEditMode && (
                  <Edit className="ml-2 inline-block size-3 text-blue-500" />
                )}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <DropdownMenu
                open={isEditingType}
                onOpenChange={setIsEditingType}
              >
                <DropdownMenuTrigger asChild>
                  <Badge
                    variant="secondary"
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
              <Badge variant="secondary" className={getStepColor(step.type)}>
                {step.type === "click" && "클릭"}
                {step.type === "input" && "입력"}
                {step.type === "navigate" && "이동"}
                {step.type === "wait" && "대기"}
                {step.type === "decision" && "판단"}
              </Badge>
            )}
            {step.timestamp && step.timestamp !== "0:00" && (
              <span className="text-muted-foreground text-sm">
                {step.timestamp}
              </span>
            )}
            {isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteStep(step.id)}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            )}
            {!isEditMode && (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4 p-4">
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

          {/* Description */}
          {isEditMode ? (
            <div>
              <label className="mb-2 block text-sm font-medium">설명</label>
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
            <div
              className={`bg-muted/50 rounded-lg p-3 ${
                isEditMode
                  ? "border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900"
                  : ""
              }`}
            >
              <p
                className={`text-muted-foreground text-sm ${
                  isEditMode ? "text-blue-800 dark:text-blue-200" : ""
                }`}
              >
                {currentDescription}
              </p>
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
                  <Plus className="mr-2 size-4" />이 단계에 메모 추가하기
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
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
  const { workflows: dbWorkflows } = loaderData;
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
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]); // 버튼 클릭으로 고정된 단계
  const [hoveredStep, setHoveredStep] = useState<number | null>(null); // hover 상태 단계
  const [editingStep, setEditingStep] = useState<LogicStep | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSteps, setEditedSteps] = useState<
    Map<number, { action: string; description: string; type?: string }>
  >(new Map());
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

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
      toast.success("수정 모드가 활성화되었습니다");
    } else {
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
      setEditedSteps(new Map());
      toast.success("변경사항이 저장되었습니다");
    }
    setIsEditMode(!isEditMode);
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

        // Update UI immediately
        setSelectedVideo({ ...selectedVideo, steps: newSteps });

        // Submit reordering to backend
        const formData = new FormData();
        formData.append("actionType", "reorderSteps");
        formData.append("workflowId", selectedVideo.id);
        formData.append(
          "stepIds",
          JSON.stringify(newSteps.map((step) => step.id)),
        );

        fetcher.submit(formData, { method: "post" });
        toast.success("단계 순서가 변경되었습니다");
      }
    }
  };

  const handleAddStep = async (insertAfterIndex?: number) => {
    if (!selectedVideo) return;

    const sequenceNo =
      insertAfterIndex !== undefined
        ? insertAfterIndex + 2
        : selectedVideo.steps.length + 1;
    const formData = new FormData();
    formData.append("actionType", "addStep");
    formData.append("workflowId", selectedVideo.id);
    formData.append("sequenceNo", sequenceNo.toString());
    formData.append("action", "새 단계");
    formData.append("description", "");

    fetcher.submit(formData, { method: "post" });
    toast.success("새 단계가 추가되었습니다");
  };

  const handleDeleteStep = async (stepId: number) => {
    const formData = new FormData();
    formData.append("actionType", "deleteStep");
    formData.append("stepId", stepId.toString());

    fetcher.submit(formData, { method: "post" });
    toast.success("단계가 삭제되었습니다");
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
    <div className="flex h-full">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="bg-background hidden w-80 border-r md:block">
        <div className="border-b p-4">
          <h2 className="mb-1">업무 목록</h2>
          <p className="text-muted-foreground text-sm">
            업무 목록을 관리하고 작업 내용을 프로세스로 문서화하세요
          </p>
        </div>

        <div className="h-[calc(100vh-10rem)] overflow-auto">
          <div className="space-y-2 p-4">
            {mockVideos.map((video) => (
              <Card
                key={video.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVideo?.id === video.id
                    ? "border-[#4169E1] bg-[#4169E1]/5"
                    : ""
                }`}
                onClick={() => {
                  setSelectedVideo(video);
                  setIsEditMode(false);
                  setEditedSteps(new Map());
                  setIsMobileSidebarOpen(false);
                }}
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileVideo className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{video.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkflow(video.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Badge
                      className={
                        video.status === "analyzed"
                          ? "bg-green-500 hover:bg-green-600"
                          : video.status === "analyzing"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {video.status === "analyzed"
                        ? "분석 완료"
                        : video.status === "analyzing"
                          ? "진행 중"
                          : "대기"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {video.uploadDate}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>업무 목록</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-8rem)] overflow-auto">
            <div className="space-y-2 p-4">
              {mockVideos.map((video) => (
                <Card
                  key={video.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedVideo?.id === video.id
                      ? "border-[#4169E1] bg-[#4169E1]/5"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedVideo(video);
                    setIsEditMode(false);
                    setEditedSteps(new Map());
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileVideo className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">{video.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(video.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge
                        className={
                          video.status === "analyzed"
                            ? "bg-green-500 hover:bg-green-600"
                            : video.status === "analyzing"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {video.status === "analyzed"
                          ? "분석 완료"
                          : video.status === "analyzing"
                            ? "진행 중"
                            : "대기"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {video.uploadDate}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedVideo ? (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile menu button */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileSidebarOpen(true)}
                      className="md:hidden"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  )}
                  <div>
                    <h1 className="mb-2 text-lg md:text-xl">
                      {selectedVideo.title}
                    </h1>
                    <div className="text-muted-foreground flex flex-col gap-1 text-sm md:flex-row md:items-center md:gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {selectedVideo.duration}
                      </div>
                      <Badge variant="secondary">
                        {selectedVideo.uploadDate}
                      </Badge>
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
                </div>
                <div className="flex gap-1 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVideoPlayerOpen(true)}
                    className="hidden md:flex"
                  >
                    <Play className="mr-2 size-4" />
                    원본 동영상 보기
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVideoPlayerOpen(true)}
                    className="md:hidden"
                  >
                    <Play className="size-4" />
                  </Button>
                  {isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleEditProcess}
                        className="hidden md:flex"
                      >
                        <X className="mr-2 h-4 w-4" />
                        취소
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleEditProcess}
                        className="md:hidden"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleEditProcess}
                        className="hidden md:flex"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        저장
                      </Button>
                      <Button
                        size="icon"
                        onClick={handleEditProcess}
                        className="md:hidden"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleEditProcess}
                        className="hidden md:flex"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        수정 모드
                      </Button>
                      <Button
                        size="icon"
                        onClick={handleEditProcess}
                        className="md:hidden"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {selectedVideo.status === "analyzed" ? (
                  <>
                    {/* 수정 모드 알림 */}
                    {isEditMode && (
                      <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-lg border-2 border-blue-400 bg-blue-50 p-4 shadow-lg duration-300 dark:border-blue-500 dark:bg-blue-950">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-500 p-2">
                              <Edit className="size-5 text-white" />
                            </div>
                            <div>
                              <h4 className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-100">
                                ✏️ 수정 모드 활성화
                                <Badge
                                  variant="default"
                                  className="bg-blue-600"
                                >
                                  편집 중
                                </Badge>
                              </h4>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                각 단계의 제목과 설명을 직접 수정할 수 있습니다.
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditMode(false)}
                            className="text-blue-700 hover:text-blue-900 dark:text-blue-300"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mb-6 flex items-center justify-between">
                      <h2>단계별 업무 프로세스</h2>
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

                    <div className="space-y-4">
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
                                <SortableStep
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
                                {/* Add step button between steps */}
                                {index < selectedVideo.steps.length - 1 && (
                                  <div className="flex justify-center py-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddStep(index)}
                                      className="h-8 w-8 rounded-full p-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        selectedVideo.steps.map((step, index) => (
                          <Card
                            key={step.id}
                            className={`overflow-hidden transition-all duration-300 ${
                              isEditMode
                                ? "shadow-blue-20/20 border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg dark:border-blue-600 dark:bg-blue-50/50 dark:hover:bg-blue-100"
                                : ""
                            }`}
                          >
                            <CardContent className="p-0">
                              {/* Step Header */}
                              <div
                                className={`flex items-center gap-4 border-b p-4 ${
                                  isEditMode ? "bg-blue-50/50" : "bg-muted/30"
                                }`}
                              >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4169E1] text-white">
                                  <span className="text-sm font-medium">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold">
                                    {step.action}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2">
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
                                  {step.timestamp &&
                                    step.timestamp !== "0:00" && (
                                      <span className="text-muted-foreground text-sm">
                                        {step.timestamp}
                                      </span>
                                    )}
                                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                                </div>
                              </div>

                              {/* Step Content */}
                              <div className="space-y-4 p-4">
                                {/* Screenshot */}
                                {step.screenshot_url && (
                                  <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
                                    <img
                                      src={step.screenshot_url}
                                      alt={step.action}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}

                                {/* Description */}
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-muted-foreground text-sm">
                                    {step.description}
                                  </p>
                                </div>

                                {/* Notes Section */}
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
                                    <Plus className="mr-2 size-4" />이 단계에
                                    메모 추가하기
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Helpful Note */}
                    {!isEditMode && (
                      <Card className="bg-muted/30 mt-6 border-dashed">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                              <span className="text-lg">💡</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                각 단계에 메모를 추가하면 팀원과 상세한 업무
                                프로세스를 공유할 수 있어요!
                              </p>
                              <Button
                                variant="link"
                                className="mt-2 h-auto px-0 text-sm"
                                onClick={handleEditProcess}
                              >
                                프로세스 수정하기
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
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
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <FileVideo className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">업무를 선택해주세요</p>
            </div>
          </div>
        )}
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
    </div>
  );
}
