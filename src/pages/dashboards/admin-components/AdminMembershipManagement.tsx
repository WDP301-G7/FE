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
  Award,
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
import {
  adminService,
  MembershipTier,
  CreateMembershipTierPayload,
  UpdateMembershipTierPayload,
  UserMembership,
} from '@/services/admin.service';
import { userService, User } from '@/services/user.service';

const AdminMembershipManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // ============ STATE ============
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(false);
  
  // User memberships for member list view
  const [userMemberships, setUserMemberships] = useState<(UserMembership & { user: User })[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Dialogs
  const [isCreateTierDialogOpen, setIsCreateTierDialogOpen] = useState(false);
  const [isEditTierDialogOpen, setIsEditTierDialogOpen] = useState(false);
  const [isDeleteTierDialogOpen, setIsDeleteTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  // Search and filters
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

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
  }, []);

  // ============ VALIDATION ============
  const validateTierForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!tierFormData.name || tierFormData.name.trim() === '') {
      errors.name = 'Tên hạng là bắt buộc';
    }

    if (!tierFormData.icon || tierFormData.icon.trim() === '') {
      errors.icon = 'Icon là bắt buộc';
    }

    if (tierFormData.minSpend < 0) {
      errors.minSpend = 'minSpend phải >= 0';
    }

    if (tierFormData.discountPercent < 0 || tierFormData.discountPercent > 100) {
      errors.discountPercent = 'Discount phải từ 0-100%';
    }

    if (tierFormData.warrantyMonths < 0) {
      errors.warrantyMonths = 'Bảo hành phải >= 0';
    }

    if (tierFormData.returnDays < 0) {
      errors.returnDays = 'Trả hàng phải >= 0';
    }

    if (tierFormData.exchangeDays < 0) {
      errors.exchangeDays = 'Đổi hàng phải >= 0';
    }

    if (!tierFormData.description || tierFormData.description.trim() === '') {
      errors.description = 'Mô tả là bắt buộc';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============ TIER MANAGEMENT ============
  const handleCreateTier = async () => {
    if (!validateTierForm()) {
      toast({
        title: 'Lỗi Validation',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }
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
    if (!validateTierForm()) {
      toast({
        title: 'Lỗi Validation',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }
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
    setValidationErrors({});
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

  // ============ FILTER ============
  const filteredMembers = userMemberships.filter((membership) => {
    const matchesSearch = 
      membership.user.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      membership.user.email?.toLowerCase().includes(memberSearchTerm.toLowerCase());
    
    const matchesTier = selectedTierFilter === 'all' || membership.currentTier?.id === selectedTierFilter;
    
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
            Quản lý hạng thành viên của khách hàng
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
                  const count = userMemberships.filter(m => m.currentTier?.id === tier.id).length;
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
                              style={{ backgroundColor: membership.currentTier?.color + '20' }}
                            >
                              {membership.currentTier?.icon}
                            </div>
                            <span className="font-semibold">{membership.currentTier?.name || 'Chưa có hạng'}</span>
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  placeholder="VD: Bronze, Silver, Gold..."
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon *</Label>
                <Input
                  id="icon"
                  value={tierFormData.icon}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, icon: e.target.value });
                    if (validationErrors.icon) {
                      setValidationErrors({ ...validationErrors, icon: '' });
                    }
                  }}
                  placeholder="🥉 (Bronze) 🥈 (Silver) 🥇 (Gold)"
                  className={validationErrors.icon ? 'border-red-500' : ''}
                />
                {validationErrors.icon && (
                  <p className="text-sm text-red-500">{validationErrors.icon}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSpending">minSpend (₫) *</Label>
                <Input
                  id="minSpending"
                  type="text"
                  value={tierFormData.minSpend === 0 ? '' : tierFormData.minSpend.toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setTierFormData({ ...tierFormData, minSpend: value === '' ? 0 : Number(value) });
                    if (validationErrors.minSpend) {
                      setValidationErrors({ ...validationErrors, minSpend: '' });
                    }
                  }}
                  placeholder="VD: 500,000"
                  className={validationErrors.minSpend ? 'border-red-500' : ''}
                />
                {validationErrors.minSpend && (
                  <p className="text-sm text-red-500">{validationErrors.minSpend}</p>
                )}
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, discountPercent: Number(e.target.value) });
                    if (validationErrors.discountPercent) {
                      setValidationErrors({ ...validationErrors, discountPercent: '' });
                    }
                  }}
                  placeholder="VD: 0, 5, 10"
                  className={validationErrors.discountPercent ? 'border-red-500' : ''}
                />
                {validationErrors.discountPercent && (
                  <p className="text-sm text-red-500">{validationErrors.discountPercent}</p>
                )}
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, warrantyMonths: Number(e.target.value) });
                    if (validationErrors.warrantyMonths) {
                      setValidationErrors({ ...validationErrors, warrantyMonths: '' });
                    }
                  }}
                  placeholder="VD: 6, 9, 12"
                  className={validationErrors.warrantyMonths ? 'border-red-500' : ''}
                />
                {validationErrors.warrantyMonths && (
                  <p className="text-sm text-red-500">{validationErrors.warrantyMonths}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDays">Trả hàng (ngày) *</Label>
                <Input
                  id="returnDays"
                  type="number"
                  min="0"
                  value={tierFormData.returnDays}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, returnDays: Number(e.target.value) });
                    if (validationErrors.returnDays) {
                      setValidationErrors({ ...validationErrors, returnDays: '' });
                    }
                  }}
                  placeholder="VD: 7, 10, 14"
                  className={validationErrors.returnDays ? 'border-red-500' : ''}
                />
                {validationErrors.returnDays && (
                  <p className="text-sm text-red-500">{validationErrors.returnDays}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeDays">Đổi hàng (ngày) *</Label>
                <Input
                  id="exchangeDays"
                  type="number"
                  min="0"
                  value={tierFormData.exchangeDays}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, exchangeDays: Number(e.target.value) });
                    if (validationErrors.exchangeDays) {
                      setValidationErrors({ ...validationErrors, exchangeDays: '' });
                    }
                  }}
                  placeholder="VD: 15, 22, 30"
                  className={validationErrors.exchangeDays ? 'border-red-500' : ''}
                />
                {validationErrors.exchangeDays && (
                  <p className="text-sm text-red-500">{validationErrors.exchangeDays}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={tierFormData.description}
                onChange={(e) => {
                  setTierFormData({ ...tierFormData, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: '' });
                  }
                }}
                placeholder="Mô tả về hạng thành viên này..."
                rows={2}
                className={validationErrors.description ? 'border-red-500' : ''}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500">{validationErrors.description}</p>
              )}
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon *</Label>
                <Input
                  id="edit-icon"
                  value={tierFormData.icon}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, icon: e.target.value });
                    if (validationErrors.icon) {
                      setValidationErrors({ ...validationErrors, icon: '' });
                    }
                  }}
                  className={validationErrors.icon ? 'border-red-500' : ''}
                />
                {validationErrors.icon && (
                  <p className="text-sm text-red-500">{validationErrors.icon}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minSpending">minSpend (₫) *</Label>
                <Input
                  id="edit-minSpending"
                  type="text"
                  value={tierFormData.minSpend === 0 ? '' : tierFormData.minSpend.toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setTierFormData({ ...tierFormData, minSpend: value === '' ? 0 : Number(value) });
                    if (validationErrors.minSpend) {
                      setValidationErrors({ ...validationErrors, minSpend: '' });
                    }
                  }}
                  placeholder="VD: 500,000"
                  className={validationErrors.minSpend ? 'border-red-500' : ''}
                />
                {validationErrors.minSpend && (
                  <p className="text-sm text-red-500">{validationErrors.minSpend}</p>
                )}
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, discountPercent: Number(e.target.value) });
                    if (validationErrors.discountPercent) {
                      setValidationErrors({ ...validationErrors, discountPercent: '' });
                    }
                  }}
                  className={validationErrors.discountPercent ? 'border-red-500' : ''}
                />
                {validationErrors.discountPercent && (
                  <p className="text-sm text-red-500">{validationErrors.discountPercent}</p>
                )}
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
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, warrantyMonths: Number(e.target.value) });
                    if (validationErrors.warrantyMonths) {
                      setValidationErrors({ ...validationErrors, warrantyMonths: '' });
                    }
                  }}
                  className={validationErrors.warrantyMonths ? 'border-red-500' : ''}
                />
                {validationErrors.warrantyMonths && (
                  <p className="text-sm text-red-500">{validationErrors.warrantyMonths}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-returnDays">Trả hàng (ngày) *</Label>
                <Input
                  id="edit-returnDays"
                  type="number"
                  min="0"
                  value={tierFormData.returnDays}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, returnDays: Number(e.target.value) });
                    if (validationErrors.returnDays) {
                      setValidationErrors({ ...validationErrors, returnDays: '' });
                    }
                  }}
                  className={validationErrors.returnDays ? 'border-red-500' : ''}
                />
                {validationErrors.returnDays && (
                  <p className="text-sm text-red-500">{validationErrors.returnDays}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-exchangeDays">Đổi hàng (ngày) *</Label>
                <Input
                  id="edit-exchangeDays"
                  type="number"
                  min="0"
                  value={tierFormData.exchangeDays}
                  onChange={(e) => {
                    setTierFormData({ ...tierFormData, exchangeDays: Number(e.target.value) });
                    if (validationErrors.exchangeDays) {
                      setValidationErrors({ ...validationErrors, exchangeDays: '' });
                    }
                  }}
                  className={validationErrors.exchangeDays ? 'border-red-500' : ''}
                />
                {validationErrors.exchangeDays && (
                  <p className="text-sm text-red-500">{validationErrors.exchangeDays}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả *</Label>
              <Textarea
                id="edit-description"
                value={tierFormData.description}
                onChange={(e) => {
                  setTierFormData({ ...tierFormData, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: '' });
                  }
                }}
                rows={2}
                className={validationErrors.description ? 'border-red-500' : ''}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500">{validationErrors.description}</p>
              )}
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
    </div>
  );
};

export default AdminMembershipManagement;
