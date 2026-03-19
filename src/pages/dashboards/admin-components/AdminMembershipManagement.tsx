import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  DollarSign,
  Percent,
  Users,
  Save,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  adminService,
  MembershipTier,
  CreateMembershipTierPayload,
  UpdateMembershipTierPayload,
  UserMembership,
  AdjustPointsPayload,
  PointsHistoryEntry,
} from '@/services/admin.service';
import { userService, User } from '@/services/user.service';

const AdminMembershipManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // ============ STATE ============
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // User memberships for member list view
  const [userMemberships, setUserMemberships] = useState<(UserMembership & { user: User })[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Dialogs
  const [isCreateTierDialogOpen, setIsCreateTierDialogOpen] = useState(false);
  const [isEditTierDialogOpen, setIsEditTierDialogOpen] = useState(false);
  const [isDeleteTierDialogOpen, setIsDeleteTierDialogOpen] = useState(false);
  const [isAdjustPointsDialogOpen, setIsAdjustPointsDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  // Search and filters
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  // Form state for tier
  const [tierFormData, setTierFormData] = useState<CreateMembershipTierPayload>({
    name: '',
    minSpend: 0,
    maxSpend: null,
    discountPercent: 0,
    warrantyMonths: 6,
    returnDays: 7,
    exchangeDays: 15,
    description: '',
    benefits: [],
    color: '#3b82f6',
    icon: '🥉',
    sortOrder: 0,
    periodDays: 365,
  });

  // Form state for points adjustment
  const [pointsFormData, setPointsFormData] = useState<AdjustPointsPayload>({
    amount: 0,
    reason: '',
    note: '',
  });

  // ============ AUTH CHECK ============
  if (!hasRole(['ADMIN'])) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ============ DATA FETCHING ============
  const fetchTiers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMembershipTiers();
      setTiers(data.sort((a, b) => a.minSpend - b.minSpend));
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách hạng thành viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers({
        page: 1,
        limit: 100,
      });
      // Filter customers on frontend
      const customers = (data.items || []).filter(
        (user) => user.role === 'CUSTOMER'
      );
      setUsers(customers);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách khách hàng',
        variant: 'destructive',
      });
    }
  };

  const fetchUserMembership = async (userId: string) => {
    try {
      const data = await adminService.getUserMembership(userId);
      setUserMembership(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin membership của khách hàng',
        variant: 'destructive',
      });
    }
  };

  const fetchPointsHistory = async (userId: string) => {
    try {
      const data = await adminService.getUserPointsHistory(userId, { page: 1, limit: 50 });
      setPointsHistory(data.items || []);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử điểm',
        variant: 'destructive',
      });
    }
  };

  const fetchAllUserMemberships = async () => {
    try {
      setLoadingMemberships(true);
      
      // Fetch all users first (without role filter - backend might not support it)
      const usersData = await userService.getUsers({
        page: 1,
        limit: 1000,
      });
      
      // Filter customers on frontend
      const customerUsers = (usersData.items || []).filter(
        (user) => user.role === 'CUSTOMER'
      );
      
      // Check if we have any users
      if (customerUsers.length === 0) {
        setUserMemberships([]);
        toast({
          title: 'Thông báo',
          description: 'Không có khách hàng nào trong hệ thống',
        });
        return;
      }
      
      // Fetch membership for each user (silently handle errors)
      const membershipsPromises = customerUsers.map(async (user) => {
        try {
          const membership = await adminService.getUserMembership(user.id);
          return { ...membership, user };
        } catch (error: any) {
          // Silently ignore 404 errors (user doesn't have membership yet)
          if (error?.response?.status !== 404) {
            console.warn(`Failed to fetch membership for user ${user.id}:`, error?.message);
          }
          return null;
        }
      });
      
      const membershipsResults = await Promise.all(membershipsPromises);
      const validMemberships = membershipsResults.filter(m => m !== null) as (UserMembership & { user: User })[];
      
      setUserMemberships(validMemberships);
      
      // Show info if no memberships found
      if (validMemberships.length === 0) {
        toast({
          title: 'Thông báo',
          description: 'Chưa có khách hàng nào có dữ liệu membership. Backend cần implement API /api/users/:userId/membership',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error fetching user memberships:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải danh sách thành viên. Vui lòng kiểm tra backend API.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMemberships(false);
    }
  };

  useEffect(() => {
    fetchTiers();
    fetchUsers();
  }, []);

  // ============ TIER MANAGEMENT ============
  const handleCreateTier = async () => {
    try {
      setLoading(true);
      await adminService.createMembershipTier(tierFormData);
      toast({
        title: 'Thành công',
        description: 'Đã tạo hạng thành viên mới',
      });
      setIsCreateTierDialogOpen(false);
      resetTierForm();
      fetchTiers();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo hạng thành viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!selectedTier) return;
    try {
      setLoading(true);
      await adminService.updateMembershipTier(selectedTier.id, tierFormData as UpdateMembershipTierPayload);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật hạng thành viên',
      });
      setIsEditTierDialogOpen(false);
      resetTierForm();
      fetchTiers();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật hạng thành viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTier = async () => {
    if (!selectedTier) return;
    try {
      setLoading(true);
      await adminService.deleteMembershipTier(selectedTier.id);
      toast({
        title: 'Thành công',
        description: 'Đã xóa hạng thành viên',
      });
      setIsDeleteTierDialogOpen(false);
      setSelectedTier(null);
      fetchTiers();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa hạng thành viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditTierDialog = (tier: MembershipTier) => {
    setSelectedTier(tier);
    setTierFormData({
      name: tier.name,
      minSpend: tier.minSpend,
      maxSpend: tier.maxSpend,
      discountPercent: tier.discountPercent,
      warrantyMonths: tier.warrantyMonths || 6,
      returnDays: tier.returnDays || 7,
      exchangeDays: tier.exchangeDays || 15,
      description: tier.description || '',
      benefits: tier.benefits || [],
      color: tier.color || '#3b82f6',
      icon: tier.icon || '🥉',
      sortOrder: tier.sortOrder || 0,
      periodDays: tier.periodDays || 365,
    });
    setIsEditTierDialogOpen(true);
  };

  const resetTierForm = () => {
    setTierFormData({
      name: '',
      minSpend: 0,
      maxSpend: null,
      discountPercent: 0,
      warrantyMonths: 6,
      returnDays: 7,
      exchangeDays: 15,
      description: '',
      benefits: [],
      color: '#3b82f6',
      icon: '🥉',
      sortOrder: 0,
      periodDays: 365,
    });
    setSelectedTier(null);
  };

  // ============ POINTS ADJUSTMENT ============
  const openAdjustPointsDialog = async (user: User) => {
    setSelectedUser(user);
    await fetchUserMembership(user.id);
    await fetchPointsHistory(user.id);
    setIsAdjustPointsDialogOpen(true);
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      await adminService.adjustUserPoints(selectedUser.id, pointsFormData);
      toast({
        title: 'Thành công',
        description: `Đã ${pointsFormData.amount >= 0 ? 'cộng' : 'trừ'} ${Math.abs(pointsFormData.amount)} điểm`,
      });
      setIsAdjustPointsDialogOpen(false);
      resetPointsForm();
      // Refresh data
      if (selectedUser) {
        fetchUserMembership(selectedUser.id);
        fetchPointsHistory(selectedUser.id);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể điều chỉnh điểm',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPointsForm = () => {
    setPointsFormData({
      amount: 0,
      reason: '',
      note: '',
    });
    setSelectedUser(null);
    setUserMembership(null);
    setPointsHistory([]);
  };

  // ============ FILTER ============
  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredMembers = userMemberships.filter((membership) => {
    const matchesSearch = 
      membership.user.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      membership.user.email?.toLowerCase().includes(memberSearchTerm.toLowerCase());
    
    const matchesTier = selectedTierFilter === 'all' || membership.currentTier.id === selectedTierFilter;
    
    return matchesSearch && matchesTier;
  });

  // ============ RENDER ============
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Quản lý Membership
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý hạng thành viên và điều chỉnh điểm tích lũy
          </p>
        </div>
        <Button onClick={fetchTiers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList>
          <TabsTrigger value="tiers">
            <Award className="h-4 w-4 mr-2" />
            Hạng thành viên
          </TabsTrigger>
          <TabsTrigger value="members" onClick={() => !loadingMemberships && fetchAllUserMemberships()}>
            <Users className="h-4 w-4 mr-2" />
            Thành viên theo hạng
          </TabsTrigger>
          <TabsTrigger value="users">
            <TrendingUp className="h-4 w-4 mr-2" />
            Điều chỉnh điểm
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Membership Tiers */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cấu hình hạng thành viên</CardTitle>
                  <CardDescription>
                    Tạo và quản lý các hạng thành viên, thiết lập mức chi tiêu và % giảm giá
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateTierDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm hạng mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : tiers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có hạng thành viên nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hạng</TableHead>
                      <TableHead>minSpend (ví dụ)</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Bảo hành</TableHead>
                      <TableHead>Trả hàng</TableHead>
                      <TableHead>Đổi hàng</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{tier.icon || '🏆'}</span>
                            <span className="font-semibold">{tier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tier.minSpend != null 
                            ? tier.minSpend.toLocaleString('vi-VN') + ' ₫' 
                            : '0 ₫'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {tier.discountPercent ?? 0}%
                          </Badge>
                        </TableCell>
                        <TableCell>{tier.warrantyMonths || 0} tháng</TableCell>
                        <TableCell>{tier.returnDays || 0} ngày</TableCell>
                        <TableCell>{tier.exchangeDays || 0} ngày</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTierDialog(tier)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTier(tier);
                                setIsDeleteTierDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Member List by Tier */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách thành viên theo hạng</CardTitle>
                  <CardDescription>
                    Xem tất cả khách hàng và hạng membership của họ
                  </CardDescription>
                </div>
                <Button onClick={fetchAllUserMemberships} disabled={loadingMemberships} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingMemberships ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="tier-filter" className="whitespace-nowrap">Lọc theo hạng:</Label>
                  <select
                    id="tier-filter"
                    value={selectedTierFilter}
                    onChange={(e) => setSelectedTierFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="all">Tất cả hạng</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.icon} {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{userMemberships.length}</div>
                    <p className="text-xs text-muted-foreground">Tổng thành viên</p>
                  </CardContent>
                </Card>
                {tiers.slice(0, 3).map((tier) => {
                  const count = userMemberships.filter(m => m.currentTier.id === tier.id).length;
                  return (
                    <Card key={tier.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tier.icon}</span>
                          <div>
                            <div className="text-2xl font-bold">{count}</div>
                            <p className="text-xs text-muted-foreground">{tier.name}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Table */}
              {loadingMemberships ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Đang tải dữ liệu...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  {userMemberships.length === 0 ? (
                    <div className="max-w-md mx-auto">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-semibold mb-2">Chưa có dữ liệu thành viên</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Tính năng này yêu cầu backend implement API endpoint:<br/>
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                          GET /api/users/:userId/membership
                        </code>
                      </p>
                      <Button onClick={fetchAllUserMemberships} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử tải lại
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Không tìm thấy thành viên nào</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Hạng hiện tại</TableHead>
                      <TableHead className="text-right">Tổng chi tiêu</TableHead>
                      <TableHead className="text-center">% Giảm giá</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((membership) => (
                      <TableRow key={membership.user.id}>
                        <TableCell className="font-medium">{membership.user.fullName}</TableCell>
                        <TableCell>{membership.user.email || '-'}</TableCell>
                        <TableCell>{membership.user.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                              style={{ backgroundColor: membership.currentTier.color + '20' }}
                            >
                              {membership.currentTier.icon}
                            </div>
                            <span className="font-semibold">{membership.currentTier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {membership.accumulatedSpending != null
                            ? membership.accumulatedSpending.toLocaleString('vi-VN') + ' ₫'
                            : '0 ₫'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold">
                            {membership.discountPercent ?? 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: User Points Adjustment */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Điều chỉnh điểm tích lũy thủ công</CardTitle>
              <CardDescription>
                Tìm kiếm khách hàng và điều chỉnh điểm tích lũy của họ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm khách hàng theo tên hoặc email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy khách hàng nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 20).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustPointsDialog(user)}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Điều chỉnh điểm
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ CREATE TIER DIALOG ============ */}
      <Dialog open={isCreateTierDialogOpen} onOpenChange={setIsCreateTierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo hạng thành viên mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin cho hạng thành viên mới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên hạng *</Label>
                <Input
                  id="name"
                  value={tierFormData.name}
                  onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                  placeholder="VD: Bronze, Silver, Gold..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon *</Label>
                <Input
                  id="icon"
                  value={tierFormData.icon}
                  onChange={(e) => setTierFormData({ ...tierFormData, icon: e.target.value })}
                  placeholder="🥉 (Bronze) 🥈 (Silver) 🥇 (Gold)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSpending">minSpend (₫) *</Label>
                <Input
                  id="minSpending"
                  type="number"
                  value={tierFormData.minSpend}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, minSpend: Number(e.target.value) })
                  }
                  placeholder="VD: 0, 2000000, 10000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount (%) *</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={tierFormData.discountPercent}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, discountPercent: Number(e.target.value) })
                  }
                  placeholder="VD: 0, 5, 10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Bảo hành (tháng) *</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  min="0"
                  value={tierFormData.warrantyMonths}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, warrantyMonths: Number(e.target.value) })
                  }
                  placeholder="VD: 6, 9, 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDays">Trả hàng (ngày) *</Label>
                <Input
                  id="returnDays"
                  type="number"
                  min="0"
                  value={tierFormData.returnDays}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, returnDays: Number(e.target.value) })
                  }
                  placeholder="VD: 7, 10, 14"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeDays">Đổi hàng (ngày) *</Label>
                <Input
                  id="exchangeDays"
                  type="number"
                  min="0"
                  value={tierFormData.exchangeDays}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, exchangeDays: Number(e.target.value) })
                  }
                  placeholder="VD: 15, 22, 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={tierFormData.description}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                placeholder="Mô tả về hạng thành viên này..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTierDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleCreateTier} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ EDIT TIER DIALOG ============ */}
      <Dialog open={isEditTierDialogOpen} onOpenChange={setIsEditTierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hạng thành viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin hạng thành viên
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên hạng *</Label>
                <Input
                  id="edit-name"
                  value={tierFormData.name}
                  onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon *</Label>
                <Input
                  id="edit-icon"
                  value={tierFormData.icon}
                  onChange={(e) => setTierFormData({ ...tierFormData, icon: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minSpending">minSpend (₫) *</Label>
                <Input
                  id="edit-minSpending"
                  type="number"
                  value={tierFormData.minSpend}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, minSpend: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discountPercent">Discount (%) *</Label>
                <Input
                  id="edit-discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={tierFormData.discountPercent}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, discountPercent: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-warrantyMonths">Bảo hành (tháng) *</Label>
                <Input
                  id="edit-warrantyMonths"
                  type="number"
                  min="0"
                  value={tierFormData.warrantyMonths}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, warrantyMonths: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-returnDays">Trả hàng (ngày) *</Label>
                <Input
                  id="edit-returnDays"
                  type="number"
                  min="0"
                  value={tierFormData.returnDays}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, returnDays: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-exchangeDays">Đổi hàng (ngày) *</Label>
                <Input
                  id="edit-exchangeDays"
                  type="number"
                  min="0"
                  value={tierFormData.exchangeDays}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, exchangeDays: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={tierFormData.description}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTierDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleUpdateTier} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE TIER DIALOG ============ */}
      <AlertDialog open={isDeleteTierDialogOpen} onOpenChange={setIsDeleteTierDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hạng thành viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hạng "{selectedTier?.name}"?
              <br />
              <strong className="text-destructive">Lưu ý:</strong> Việc này có thể ảnh hưởng đến
              khách hàng hiện đang ở hạng này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTier} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============ ADJUST POINTS DIALOG ============ */}
      <Dialog open={isAdjustPointsDialogOpen} onOpenChange={setIsAdjustPointsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Điều chỉnh điểm tích lũy</DialogTitle>
            <DialogDescription>
              Khách hàng: <strong>{selectedUser?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          {userMembership && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hạng hiện tại
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{userMembership.currentTier.icon}</span>
                    <span className="text-xl font-bold">{userMembership.currentTier.name}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng chi tiêu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {userMembership.accumulatedSpending != null 
                      ? userMembership.accumulatedSpending.toLocaleString('vi-VN') + ' ₫'
                      : '0 ₫'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    % Giảm giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">
                    {userMembership.discountPercent ?? 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số điểm điều chỉnh *</Label>
              <Input
                id="amount"
                type="number"
                value={pointsFormData.amount}
                onChange={(e) =>
                  setPointsFormData({ ...pointsFormData, amount: Number(e.target.value) })
                }
                placeholder="Nhập số dương để cộng, số âm để trừ"
              />
              <p className="text-xs text-muted-foreground">
                VD: 1000 để cộng 1,000 điểm | -500 để trừ 500 điểm
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Lý do *</Label>
              <Input
                id="reason"
                value={pointsFormData.reason}
                onChange={(e) => setPointsFormData({ ...pointsFormData, reason: e.target.value })}
                placeholder="VD: Bù điểm cho đơn hàng bị lỗi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú thêm</Label>
              <Textarea
                id="note"
                value={pointsFormData.note}
                onChange={(e) => setPointsFormData({ ...pointsFormData, note: e.target.value })}
                placeholder="Thông tin chi tiết (không bắt buộc)"
                rows={2}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Points History */}
          {pointsHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Lịch sử điều chỉnh gần đây</h4>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointsHistory.slice(0, 5).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs">
                          {new Date(entry.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.amount >= 0 ? 'default' : 'destructive'}>
                            {entry.amount >= 0 ? '+' : ''}
                            {entry.amount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{entry.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustPointsDialogOpen(false);
                resetPointsForm();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              onClick={handleAdjustPoints}
              disabled={loading || !pointsFormData.amount || !pointsFormData.reason}
            >
              <Save className="h-4 w-4 mr-2" />
              Xác nhận điều chỉnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMembershipManagement;
