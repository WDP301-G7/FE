import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trash2,
  Search,
  RefreshCw,
  Filter,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Zap,
  Users,
  MapPin,
  Calendar,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { userService, User, UserRole, UserStatus } from '@/services/user.service';

const AdminUsersManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banAction, setBanAction] = useState<'ban' | 'unban'>('ban');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'CUSTOMER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    staff: 0,
    operation: 0,
    manager: 0,
    customer: 0,
  });

  // Load users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (roleFilter && roleFilter !== 'ALL') {
        params.role = roleFilter;
      }

      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      const data = await userService.getUsers(params);
      
      // Filter out ADMIN users - only show CUSTOMER, STAFF, MANAGER
      const filteredUsers = (data?.items || []).filter(
        (user) => user.role !== 'ADMIN'
      );

      setUsers(filteredUsers);
      setPagination(prev => ({
        ...prev,
        total: data?.total || 0,
      }));

      // Calculate stats
      const active = filteredUsers.filter(u => u.status === 'ACTIVE').length;
      const staff = filteredUsers.filter(u => u.role === 'STAFF').length;
      const operation = filteredUsers.filter(u => u.role === 'OPERATION').length;
      const manager = filteredUsers.filter(u => u.role === 'MANAGER').length;
      const customer = filteredUsers.filter(u => u.role === 'CUSTOMER').length;

      setStats({
        total: filteredUsers.length,
        active,
        staff,
        operation,
        manager,
        customer,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Không thể tải danh sách người dùng';
      console.error('Error loading users:', error);
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, roleFilter, statusFilter, searchTerm, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle create user
  const handleCreateUser = async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền tên và email',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.password.trim() || formData.password.length < 8) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 8 ký tự',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number if provided
    if (formData.phone.trim() && !/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      toast({
        title: 'Lỗi',
        description: 'Số điện thoại phải có 10-11 chữ số',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend create user API only accepts JSON, not FormData
      // Avatar upload is not supported on create - only on update
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdUser = await userService.createUser(payload as any);
      
      // If avatar was selected, upload it via update API
      if (avatarFile && createdUser.id) {
        try {
          await userService.updateUser(createdUser.id, { avatar: avatarFile });
        } catch (avatarError) {
          console.error('Failed to upload avatar:', avatarError);
          // Don't fail the whole operation, just show warning
          toast({
            title: 'Cảnh báo',
            description: 'Tạo người dùng thành công nhưng không thể tải lên avatar',
            variant: 'default',
          });
        }
      }
      
      toast({
        title: 'Thành công',
        description: 'Tạo người dùng thành công',
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });
      setAvatarFile(null);
      setShowPassword(false);
      setIsCreateDialogOpen(false);
      
      // Reload users
      await loadUsers();
    } catch (error: any) {
      let errorMessage = 'Không thể tạo người dùng';
      
      if (error?.response?.data?.errors) {
        // Handle validation errors array
        const errors = error.response.data.errors;
        const errorFields = errors.map((err: any) => {
          const field = err.path?.join('.') || 'unknown';
          const fieldMap: Record<string, string> = {
            'fullName': 'Tên đầy đủ',
            'email': 'Email',
            'password': 'Mật khẩu',
            'phone': 'Số điện thoại',
            'address': 'Địa chỉ',
          };
          return `${fieldMap[field] || field}: ${err.message}`;
        });
        errorMessage = errorFields.join(', ');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Tạo người dùng thất bại',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền tên và email',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<typeof formData> & { avatar?: File } = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        status: formData.status,
      };

      if (avatarFile) {
        payload.avatar = avatarFile;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await userService.updateUser(selectedUser.id, payload as any);
      
      toast({
        title: 'Thành công',
        description: 'Cập nhật người dùng thành công',
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setAvatarFile(null);
      
      // Reload users
      await loadUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Không thể cập nhật người dùng';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ban/unban user (replace delete)
  const handleBanUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const newStatus = banAction === 'ban' ? 'BANNED' : 'ACTIVE';
      await userService.updateUser(selectedUser.id, { status: newStatus });
      
      toast({
        title: 'Thành công',
        description: banAction === 'ban' 
          ? 'Khóa tài khoản thành công' 
          : 'Mở khóa tài khoản thành công',
      });

      setIsBanDialogOpen(false);
      setSelectedUser(null);
      
      // Reload users
      await loadUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          `Không thể ${banAction === 'ban' ? 'khóa' : 'mở khóa'} người dùng`;
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user (deprecated - keeping for backward compatibility)
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await userService.deleteUser(selectedUser.id);
      
      toast({
        title: 'Thành công',
        description: 'Xóa người dùng thành công',
      });

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      // Reload users
      await loadUsers();
    } catch (error: any) {
      // Get detailed error message from backend response
      let errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error?.message || 
                        'Không thể xóa người dùng';
      
      // Translate technical error messages to user-friendly Vietnamese
      if (errorMessage.includes('Foreign key constraint violation') || 
          errorMessage.includes('DATABASE_ERROR')) {
        errorMessage = 'Không thể xóa người dùng này vì đang có dữ liệu liên quan (đơn hàng, đánh giá, v.v.). Vui lòng vô hiệu hóa tài khoản thay vì xóa.';
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      password: '',
      role: user.role,
      status: user.status,
    });
    setAvatarFile(null);
    setIsEditDialogOpen(true);
  };

  // Open detail dialog
  const openDetailDialog = (user: User) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      STAFF: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      CUSTOMER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      OPERATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[role];
  };

  // Get status badge color
  const getStatusBadgeColor = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      BANNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status];
  };

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Quản Lý',
    STAFF: 'Vận Hành',
    CUSTOMER: 'Khách Hàng',
    OPERATION: 'Nhân Viên',
  };

  const statusLabels: Record<UserStatus, string> = {
    ACTIVE: 'Hoạt Động',
    INACTIVE: 'Chưa Hoạt Động',
    BANNED: 'Bị Cấm',
  };

  // Get avatar initials from full name
  const getAvatarInitials = (fullName: string) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Redirect if not admin - checked after all hooks
  if (!hasRole('ADMIN')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tổng</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hoạt Động</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <Zap className="w-10 h-10 text-green-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nhân Viên</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.staff}</p>
                </div>
                <Users className="w-10 h-10 text-purple-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vận Hành</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.operation}</p>
                </div>
                <Users className="w-10 h-10 text-amber-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quản Lý</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.manager}</p>
                </div>
                <Users className="w-10 h-10 text-orange-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/30 border-cyan-200 dark:border-cyan-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Khách Hàng</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.customer}</p>
                </div>
                <Users className="w-10 h-10 text-cyan-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quản Lý Người Dùng</CardTitle>
              </div>
              <Button
                onClick={() => {
                  setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    address: '',
                    password: '',
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                  });
                  setAvatarFile(null);
                  setShowPassword(false);
                  setIsCreateDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm Người Dùng
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={(val) => {
                setRoleFilter(val);
                setPagination(p => ({ ...p, page: 1 }));
              }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Vai Trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất Cả Vai Trò</SelectItem>
                  <SelectItem value="CUSTOMER">Khách Hàng</SelectItem>
                  <SelectItem value="STAFF">Vận Hành</SelectItem>
                  <SelectItem value="OPERATION">Nhân Viên</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(val) => {
                setStatusFilter(val);
                setPagination(p => ({ ...p, page: 1 }));
              }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Trạng Thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất Cả Trạng Thái</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt Động</SelectItem>
                  <SelectItem value="INACTIVE">Chưa Hoạt Động</SelectItem>
                  <SelectItem value="BANNED">Bị Cấm</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => loadUsers()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Điện Thoại</TableHead>
                    <TableHead>Vai Trò</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        Không có người dùng
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.fullName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 dark:border-gray-700">
                                {getAvatarInitials(user.fullName)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {user.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {user.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(user.status)}>
                            {statusLabels[user.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailDialog(user)}
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setBanAction(user.status === 'BANNED' ? 'unban' : 'ban');
                                setIsBanDialogOpen(true);
                              }}
                              title={user.status === 'BANNED' ? 'Mở khóa' : 'Khóa'}
                              className={user.status === 'BANNED' 
                                ? 'text-green-600 hover:text-green-700 dark:text-green-400' 
                                : 'text-orange-600 hover:text-orange-700 dark:text-orange-400'}
                            >
                              {user.status === 'BANNED' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Xóa (Không khuyến nghị)"
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}</span>
              <span>Tổng {pagination.total} người dùng</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo người dùng mới</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Tên Đầy Đủ *</Label>
              <Input
                id="fullName"
                placeholder="Nhập tên đầy đủ"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số Điện Thoại</Label>
              <Input
                id="phone"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa Chỉ</Label>
              <Input
                id="address"
                placeholder="Nhập địa chỉ"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật Khẩu *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Vai Trò *</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Khách Hàng</SelectItem>
                  <SelectItem value="STAFF">Vận Hành</SelectItem>
                  <SelectItem value="OPERATION">Nhân Viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng Thái *</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as UserStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Hoạt Động</SelectItem>
                  <SelectItem value="INACTIVE">Chưa Hoạt Động</SelectItem>
                  <SelectItem value="BANNED">Bị Cấm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar (Tùy Chọn)</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Người Dùng</DialogTitle>
            <DialogDescription>Cập nhật thông tin người dùng</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Tên Đầy Đủ *</Label>
              <Input
                id="edit-fullName"
                placeholder="Nhập tên đầy đủ"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Số Điện Thoại</Label>
              <Input
                id="edit-phone"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Địa Chỉ</Label>
              <Input
                id="edit-address"
                placeholder="Nhập địa chỉ"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Vai Trò *</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Khách Hàng</SelectItem>
                  <SelectItem value="STAFF">Vận Hành</SelectItem>
                  <SelectItem value="OPERATION">Nhân Viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Trạng Thái *</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as UserStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Hoạt Động</SelectItem>
                  <SelectItem value="INACTIVE">Chưa Hoạt Động</SelectItem>
                  <SelectItem value="BANNED">Bị Cấm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-avatar">Avatar (Tùy Chọn)</Label>
              <Input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Chi Tiết Người Dùng</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedUser && (
              <div className="space-y-4">
                {/* Avatar Section */}
                {selectedUser.avatar && (
                  <div className="flex justify-center pb-4">
                    <div className="relative">
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800 shadow-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Họ tên</p>
                          <p className="font-medium">{selectedUser.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium text-sm">{selectedUser.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{selectedUser.phone || '-'}</p>
                        </div>
                      </div>
                      {selectedUser.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Địa chỉ</p>
                            <p className="font-medium">{selectedUser.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Role & Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Vai trò & Trạng thái
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Vai trò</p>
                        <Badge className={getRoleBadgeColor(selectedUser.role)}>
                          {roleLabels[selectedUser.role]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Trạng thái</p>
                        <Badge className={getStatusBadgeColor(selectedUser.status)}>
                          {statusLabels[selectedUser.status]}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Thông tin hệ thống
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ngày tạo</p>
                        <p className="font-medium text-sm">
                          {selectedUser.createdAt 
                            ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">ID</p>
                        <p className="font-medium text-xs font-mono">{selectedUser.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                openEditDialog(selectedUser!);
                setIsDetailDialogOpen(false);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Chỉnh Sửa
            </Button>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Alert Dialog */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banAction === 'ban' ? 'Xác Nhận Khóa Tài Khoản' : 'Xác Nhận Mở Khóa Tài Khoản'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Bạn có chắc chắn muốn {banAction === 'ban' ? 'khóa' : 'mở khóa'} tài khoản{' '}
                <strong>{selectedUser?.fullName}</strong>?
              </p>
              {banAction === 'ban' ? (
                <p className="text-orange-600 dark:text-orange-400">
                  ⚠️ <strong>Lưu ý:</strong> Sau khi khóa:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Người dùng sẽ không thể đăng nhập</li>
                    <li>Hệ thống tự động gửi thông báo đến người dùng</li>
                    <li>Toàn bộ dữ liệu (đơn hàng, đánh giá) được giữ nguyên</li>
                  </ul>
                </p>
              ) : (
                <p className="text-green-600 dark:text-green-400">
                  ✓ <strong>Sau khi mở khóa:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Người dùng có thể đăng nhập lại</li>
                    <li>Hệ thống tự động gửi thông báo đến người dùng</li>
                  </ul>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={isSubmitting}
              className={banAction === 'ban' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-green-600 hover:bg-green-700'}
            >
              {isSubmitting 
                ? (banAction === 'ban' ? 'Đang khóa...' : 'Đang mở khóa...') 
                : (banAction === 'ban' ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác Nhận Xóa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.fullName}</strong>?
              </p>
              <p className="text-orange-600 dark:text-orange-400">
                ⚠️ <strong>Lưu ý:</strong> Nếu người dùng này đang có đơn hàng, đánh giá hoặc dữ liệu liên quan, 
                bạn không thể xóa. Trong trường hợp đó, hãy vô hiệu hóa tài khoản bằng cách đổi trạng thái thành "Inactive".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default AdminUsersManagement;
