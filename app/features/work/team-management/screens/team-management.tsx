import type { Route } from "./+types/team-management";

import {
  CheckCircle2,
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "~/core/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "팀원관리" },
    { name: "description", content: "팀원 관리 페이지" },
  ];
}

// 팀원 데이터 타입 정의
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  avatar?: string;
}

// 폼 검증 스키마
const teamMemberSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  role: z.enum(["admin", "member"], {
    required_error: "역할을 선택해주세요",
  }),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// 목 데이터
const initialMembers: TeamMember[] = [
  {
    id: "1",
    name: "김철수",
    email: "kim@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2025-10-15",
  },
  {
    id: "2",
    name: "이영희",
    email: "lee@example.com",
    role: "member",
    status: "active",
    joinedAt: "2025-10-20",
  },
  {
    id: "3",
    name: "박민수",
    email: "park@example.com",
    role: "member",
    status: "active",
    joinedAt: "2025-10-16",
  },
  {
    id: "4",
    name: "정수진",
    email: "jung@example.com",
    role: "member",
    status: "pending",
    joinedAt: "2025-10-27",
  },
];

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: "",
    email: "",
    role: "member",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof TeamMemberFormData, string>>
  >({});

  // 필터링된 팀원 목록
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // 폼 검증
  const validateForm = (data: TeamMemberFormData): boolean => {
    try {
      teamMemberSchema.parse(data);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof TeamMemberFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof TeamMemberFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  // 팀원 추가
  const handleAddMember = async () => {
    if (!validateForm(formData)) {
      toast.error("입력값을 확인해주세요");
      return;
    }

    setIsLoading(true);

    // 시뮬레이션: 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMember: TeamMember = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setMembers([...members, newMember]);
    setIsAddDialogOpen(false);
    setFormData({ name: "", email: "", role: "member" });
    setIsLoading(false);
    toast.success("팀원이 추가되었습니다", {
      description: `${newMember.name}님에게 초대 이메일이 발송되었습니다.`,
    });
  };

  // 팀원 수정
  const handleEditMember = async () => {
    if (!selectedMember || !validateForm(formData)) {
      toast.error("입력값을 확인해주세요");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setMembers(
      members.map((m) =>
        m.id === selectedMember.id ? { ...m, ...formData } : m,
      ),
    );

    setIsEditDialogOpen(false);
    setSelectedMember(null);
    setFormData({ name: "", email: "", role: "member" });
    setIsLoading(false);
    toast.success("팀원 정보가 수정되었습니다");
  };

  // 팀원 삭제
  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setMembers(members.filter((m) => m.id !== selectedMember.id));
    setIsDeleteDialogOpen(false);
    setSelectedMember(null);
    setIsLoading(false);
    toast.success("팀원이 삭제되었습니다");
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  // 추가 다이얼로그 열기
  const openAddDialog = () => {
    setFormData({ name: "", email: "", role: "member" });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  // 역할 배지 색상
  const getRoleBadgeVariant = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin":
        return "default";
      case "member":
        return "secondary";
      default:
        return "outline";
    }
  };

  // 역할 한글명
  const getRoleLabel = (role: TeamMember["role"]) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "member":
        return "사용자";
    }
  };

  // 상태 배지
  const getStatusBadge = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle2 className="mr-1 size-3" />
            활성
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Loader2 className="mr-1 size-3 animate-spin" />
            대기중
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="text-gray-600">
            비활성
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">팀원관리</h1>
            <p className="text-muted-foreground">
              팀원을 초대하고 역할을 관리하세요
            </p>
          </div>
          <Button size="lg" onClick={openAddDialog}>
            <UserPlus className="mr-2 size-4" />
            팀원 초대
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Users className="text-primary size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">전체 팀원</p>
              <p className="text-2xl font-bold">{members.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">활성 사용자</p>
              <p className="text-2xl font-bold">
                {members.filter((m) => m.status === "active").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-950">
              <Loader2 className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">대기중</p>
              <p className="text-2xl font-bold">
                {members.filter((m) => m.status === "pending").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Mail className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">관리자</p>
              <p className="text-2xl font-bold">
                {members.filter((m) => m.role === "admin").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="역할 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 역할</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
              <SelectItem value="member">사용자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 팀원 목록 테이블 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="text-muted-foreground size-8" />
                    <p className="text-muted-foreground">
                      {searchQuery || filterRole !== "all"
                        ? "검색 결과가 없습니다"
                        : "팀원이 없습니다"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.joinedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(member)}
                        >
                          <Pencil className="mr-2 size-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(member)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 size-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 팀원 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 초대</DialogTitle>
            <DialogDescription>
              새로운 팀원을 초대하세요. 초대 이메일이 발송됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">이름</Label>
              <Input
                id="add-name"
                placeholder="홍길동"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">이메일</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="hong@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">역할</Label>
              <Select
                value={formData.role}
                onValueChange={(value: TeamMemberFormData["role"]) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="member">사용자</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleAddMember} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  초대중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  초대하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀원 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 정보 수정</DialogTitle>
            <DialogDescription>팀원의 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">이메일</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">역할</Label>
              <Select
                value={formData.role}
                onValueChange={(value: TeamMemberFormData["role"]) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="member">사용자</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleEditMember} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  수정중...
                </>
              ) : (
                "수정하기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀원 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{selectedMember?.name}</strong>님을 팀에서
              삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  삭제중...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  삭제하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
