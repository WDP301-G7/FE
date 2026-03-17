import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  BarChart3,
  User,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userService, User as UserType, UserRole, UserStatus, UpdateUserPayload } from '@/services/user.service';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: 'CUSTOMER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const userData = await userService.getUser(userId);
        setUser(userData);
        setFormData({
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          role: userData.role,
          status: userData.status,
        });
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin người dùng';
        toast({
          title: 'Lỗi',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, toast]);

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!user || !userId) return;

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
      const payload: Record<string, unknown> = {
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

      const updatedUser = await userService.updateUser(userId, payload as UpdateUserPayload);
      setUser(updatedUser);
      
      toast({
        title: 'Thành công',
        description: 'Cập nhật hồ sơ thành công',
      });

      setIsEditDialogOpen(false);
      setAvatarFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Quay Lại
        </Button>
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-gray-500">Không tìm thấy người dùng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Quản Lý',
    STAFF: 'Nhân Viên',
    CUSTOMER: 'Khách Hàng',
    OPERATION: 'Vận Hành',
  };

  const statusLabels: Record<UserStatus, string> = {
    ACTIVE: 'Hoạt Động',
    INACTIVE: 'Chưa Hoạt Động',
    BANNED: 'Bị Cấm',
  };

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

  const getStatusBadgeColor = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      BANNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status];
  };

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Quay Lại
      </Button>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={user.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getAvatarInitials(user.fullName)
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {roleLabels[user.role]}
                    </Badge>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {statusLabels[user.status]}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Số Điện Thoại</p>
                      <p className="font-medium text-sm">{user.phone || '-'}</p>
                    </div>
                  </div>
                </div>

                {user.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Địa Chỉ</p>
                      <p className="font-medium text-sm">{user.address}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh Sửa Hồ Sơ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
                <TabsTrigger value="performance">Hiệu Suất</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  {/* Joined Date */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Ngày Tham Gia</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.createdAt
                            ? `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày trước`
                            : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Contributions */}
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Tổng Đóng Góp</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Công việc hoàn thành</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Summary */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Trạng Thái Hiện Tại</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {statusLabels[user.status]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông Tin Chi Tiết</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vai Trò</p>
                      <p className="font-medium">{roleLabels[user.role]}</p>
                    </div>
                    <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Trạng Thái</p>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {statusLabels[user.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overall Rating */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Đánh Giá Chung
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Hiệu Suất</span>
                            <span className="text-lg font-bold">-</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Tóm Tắt Hoạt Động
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Công việc hoàn thành</span>
                          <span className="font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Công việc đang xử lý</span>
                          <span className="font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Đánh giá trung bình</span>
                          <span className="font-medium">-</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-3xl font-bold text-purple-600">0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Giao Dịch</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-3xl font-bold text-blue-600">0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Đơn Hàng</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-3xl font-bold text-green-600">0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phản Hồi Tích Cực</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-3xl font-bold text-orange-600">0</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vấn Đề</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hồ Sơ</DialogTitle>
            <DialogDescription>Cập nhật thông tin hồ sơ của bạn</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getAvatarInitials(user.fullName)
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar (Tùy Chọn)</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

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
              <Label htmlFor="role">Vai Trò *</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Khách Hàng</SelectItem>
                  <SelectItem value="STAFF">Nhân Viên</SelectItem>
                  <SelectItem value="MANAGER">Quản Lý</SelectItem>
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserProfilePage;
