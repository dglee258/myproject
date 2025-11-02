import type { Route } from "./+types/business-logic";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileVideo,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "업무로직 " },
    {
      name: "description",
      content: "동영상을 AI로 분석하여 업무 로직 자동 생성",
    },
  ];
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
}

const mockVideos: VideoAnalysis[] = [
  {
    id: "1",
    title: "고객 주문 처리 프로세스",
    duration: "5:23",
    uploadDate: "2025-10-28",
    status: "analyzed",
    thumbnail: "/placeholder-video.jpg",
    steps: [
      {
        id: 1,
        action: "주문 목록 페이지 접속",
        description: "관리자 대시보드에서 주문 관리 메뉴 클릭",
        timestamp: "00:15",
        confidence: 98,
        type: "navigate",
      },
      {
        id: 2,
        action: "신규 주문 필터 적용",
        description: "상태 필터에서 '신규 주문' 선택",
        timestamp: "00:32",
        confidence: 95,
        type: "click",
      },
      {
        id: 3,
        action: "주문 상세 정보 확인",
        description: "첫 번째 주문 항목 클릭하여 상세 페이지 진입",
        timestamp: "00:45",
        confidence: 97,
        type: "click",
      },
      {
        id: 4,
        action: "재고 확인",
        description: "주문 상품의 재고 수량 확인",
        timestamp: "01:12",
        confidence: 92,
        type: "wait",
      },
      {
        id: 5,
        action: "재고 충분 여부 판단",
        description: "재고가 충분한 경우 승인, 부족한 경우 대기",
        timestamp: "01:25",
        confidence: 89,
        type: "decision",
      },
      {
        id: 6,
        action: "주문 승인 처리",
        description: "'주문 승인' 버튼 클릭",
        timestamp: "01:38",
        confidence: 96,
        type: "click",
      },
      {
        id: 7,
        action: "배송 정보 입력",
        description: "택배사 선택 및 송장번호 입력",
        timestamp: "02:05",
        confidence: 94,
        type: "input",
      },
      {
        id: 8,
        action: "고객 알림 발송",
        description: "주문 승인 및 배송 시작 알림 전송",
        timestamp: "02:30",
        confidence: 91,
        type: "click",
      },
    ],
  },
  {
    id: "2",
    title: "회원 가입 승인 절차",
    duration: "3:45",
    uploadDate: "2024-10-27",
    status: "analyzed",
    thumbnail: "/placeholder-video.jpg",
    steps: [
      {
        id: 1,
        action: "회원 관리 페이지 접속",
        description: "사이드바에서 회원 관리 메뉴 선택",
        timestamp: "00:08",
        confidence: 99,
        type: "navigate",
      },
      {
        id: 2,
        action: "승인 대기 필터 적용",
        description: "상태 필터에서 '승인 대기' 선택",
        timestamp: "00:20",
        confidence: 96,
        type: "click",
      },
      {
        id: 3,
        action: "회원 정보 검토",
        description: "신청자의 이름, 이메일, 사업자 정보 확인",
        timestamp: "00:35",
        confidence: 93,
        type: "wait",
      },
      {
        id: 4,
        action: "승인 여부 결정",
        description: "정보가 정확하면 승인, 의심스러우면 거부",
        timestamp: "01:15",
        confidence: 87,
        type: "decision",
      },
      {
        id: 5,
        action: "승인 처리",
        description: "'승인' 버튼 클릭하여 회원 활성화",
        timestamp: "01:28",
        confidence: 98,
        type: "click",
      },
    ],
  },
  {
    id: "3",
    title: "재고 입고 처리",
    duration: "4:12",
    uploadDate: "2024-10-26",
    status: "analyzing",
    thumbnail: "/placeholder-video.jpg",
    steps: [],
  },
];

export default function BusinessLogic() {
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(
    mockVideos[0],
  );
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId],
    );
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
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">업무로직</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              동영상을 AI가 분석하여 업무 프로세스 자동 생성
            </p>
          </div>
          <Link to="/work/upload" className="sm:shrink-0">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              업로드
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Video List Sidebar */}
        <div className="md:col-span-2 lg:col-span-1">
          <Card className="p-4">
            <h2 className="mb-4 text-lg font-semibold">분석된 동영상</h2>
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
                        ? "분석 완료"
                        : video.status === "analyzing"
                          ? "분석 중"
                          : "대기 중"}
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
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Bot className="size-3" />
                      AI 분석 완료
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto sm:shrink-0">
                  <Play className="mr-2 size-4" />
                  동영상 재생
                </Button>
              </div>

              {/* Logic Steps */}
              {selectedVideo.status === "analyzed" ? (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="text-primary size-5" />
                      추출된 업무 로직
                    </h3>
                    {/* <Button variant="outline" size="sm">
                      순서도로 보기
                    </Button> */}
                  </div>

                  <div className="relative space-y-3">
                    {selectedVideo.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Connector Line */}
                        {index < selectedVideo.steps.length - 1 && (
                          <div className="bg-border absolute top-16 left-6 h-8 w-0.5" />
                        )}

                        {/* Step Card */}
                        <div
                          className={`rounded-lg border transition-all ${
                            expandedSteps.includes(step.id)
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-start gap-4">
                              {/* Step Number */}
                              <div className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                                {step.id}
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
                                  {expandedSteps.includes(step.id) ? (
                                    <ChevronDown className="text-muted-foreground size-5" />
                                  ) : (
                                    <ChevronRight className="text-muted-foreground size-5" />
                                  )}
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

                                {/* Expanded Details */}
                                {expandedSteps.includes(step.id) && (
                                  <div className="bg-muted/50 mt-3 rounded-lg p-3">
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
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="w-full sm:w-auto">수정</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="text-muted-foreground mb-4 size-16" />
                  <h3 className="mb-2 text-lg font-semibold">
                    AI 분석 진행 중...
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    동영상을 분석하여 업무 로직을 추출하고 있습니다
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <FileVideo className="text-muted-foreground mb-4 size-16" />
              <h3 className="mb-2 text-lg font-semibold">
                동영상을 선택하세요
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                왼쪽 목록에서 분석된 동영상을 선택하여 업무 로직을 확인하세요
              </p>
              <Link to="/work/upload">
                <Button>
                  <Plus className="mr-2 size-4" />
                  업로드
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
