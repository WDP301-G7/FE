import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth.service';
import { 
  Eye, 
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthImageSide from '@/components/AuthImageSide';

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(phone)) {
      newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Bạn phải đồng ý với điều khoản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        fullName,
        email,
        phone,
        password,
        address: address || undefined,
      };

      await authService.register(registerData);
      
      toast({
        title: 'Thành công',
        description: 'Đăng ký thành công! Vui lòng đăng nhập.',
      });
      
      navigate('/login');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      const errorDetails = err.response?.data?.errors;
      
      toast({
        title: 'Đăng ký thất bại',
        description: errorDetails ? `${errorMessage}: ${errorDetails.join(', ')}` : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image (Shared Component - Không re-render khi chuyển trang) */}
      <AuthImageSide />

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <motion.div 
          key="register-form"
          className="w-full max-w-2xl my-8"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Đăng ký ngay</h1>
            <p className="text-gray-600">
              Bạn chưa có tài khoản Eyecare ?
            </p>
          </motion.div>

          {/* Register Form */}
          <motion.form 
            onSubmit={handleFormSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Họ và tên<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-12 border-2 border-gray-200 focus:border-teal-500 transition-colors ${errors.fullName ? 'border-red-500' : ''}`}
                  placeholder="Nguyễn Văn A"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Email<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 border-2 border-gray-200 focus:border-teal-500 transition-colors ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="email@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Số điện thoại<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`h-12 border-2 border-gray-200 focus:border-teal-500 transition-colors ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="0123456789"
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 border-2 border-gray-200 focus:border-teal-500 transition-colors"
                  placeholder="123 Đường ABC, TP.HCM"
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Mật khẩu<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 border-2 border-gray-200 focus:border-teal-500 pr-10 transition-colors ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Nhập mật khẩu"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Xác nhận mật khẩu<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 border-2 border-gray-200 focus:border-teal-500 pr-10 transition-colors ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Nhập lại mật khẩu"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 cursor-pointer leading-tight"
              >
                Tôi đồng ý với{' '}
                <a href="#" className="text-teal-600 hover:underline font-medium">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-teal-600 hover:underline font-medium">
                  Chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm">{errors.terms}</p>
            )}

            {/* Sign Up Button */}
            <Button 
              type="submit"
              className="w-full h-12 text-base font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Đang xử lý...
                </span>
              ) : (
                'Đăng ký'
              )}
            </Button>
          </motion.form>

          {/* Already have account */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-gray-600">
              Bạn đã có tài khoản?{' '}
              <a 
                href="/login" 
                className="text-teal-600 hover:text-teal-700 font-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Đăng nhập ngay
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
