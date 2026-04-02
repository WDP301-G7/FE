import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth.service';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthImageSide from '@/components/AuthImageSide';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      // Check if user has permission to access admin panel
      const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'OPERATION'];
      if (!allowedRoles.includes(response.user.role)) {
        toast({
          title: 'Truy cập bị từ chối',
          description: 'Bạn không có quyền truy cập vào trang quản trị. Chỉ nhân viên mới có thể đăng nhập.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Save tokens to localStorage
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast({
        title: 'Thành công',
        description: 'Đăng nhập thành công!',
      });

      // Pass user data to login function
      login(response.user);
      navigate('/dashboard');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Login error:', error);
      console.error('Error response:', err.response?.data);
      console.error('Request data:', { email, password: '***' });
      toast({
        title: 'Đăng nhập thất bại',
        description: err.response?.data?.message || 'Email hoặc mật khẩu không đúng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image (Shared Component) */}
      <AuthImageSide />

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div 
          key="login-form"
          className="w-full max-w-md"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
            <p className="text-gray-600">
              Hãy đăng nhập để được hưởng đặc quyền riêng dành cho bạn
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            onSubmit={handleFormSubmit} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Tài khoản<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 border-gray-200 focus:border-teal-500 transition-colors"
                placeholder="Nhập tài khoản"
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
                  className="h-12 border-2 border-gray-200 focus:border-teal-500 pr-10 transition-colors"
                  placeholder="Nhập mật khẩu"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Lưu tài khoản
                </label>
              </div>
              <button 
                type="button"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                onClick={() => toast({ title: 'Thông báo', description: 'Tính năng đang phát triển' })}
              >
                Quên mật khẩu ?
              </button>
            </div>

            {/* Login Button */}
            <Button 
              type="submit"
              className="w-full h-12 text-base font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
