import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/mock-data/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CircleUserRound, 
  Users, 
  CheckCircle, 
  PenLine, 
  Eye, 
  EyeOff 
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, default to admin login
    handleLogin('admin');
  };

  const demoRoles = [
    { 
      role: 'admin' as UserRole, 
      label: 'Quản trị viên', 
      subtitle: 'Quản lý người dùng',
      icon: CircleUserRound,
      color: 'text-red-500',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200 hover:border-red-300'
    },
    { 
      role: 'manager' as UserRole, 
      label: 'Quản lý', 
      subtitle: 'Quản lý công việc',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-300'
    },
    { 
      role: 'sales' as UserRole, 
      label: 'Nhân viên bán hàng', 
      subtitle: 'Bán hàng',
      icon: CheckCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200 hover:border-purple-300'
    },
    { 
      role: 'operations' as UserRole, 
      label: 'Nhân viên vận hành', 
      subtitle: 'Vận hành',
      icon: PenLine,
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200 hover:border-green-300'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <h1 className="text-5xl font-semibold text-gray-900 mb-8">
            Sign in to Eyewear Management
          </h1>

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-normal text-gray-900">
                Email or Username
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                placeholder="admin@company.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-normal text-gray-900">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base pr-10"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button 
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-normal border-gray-300 hover:bg-gray-50"
            onClick={() => {}}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Quick Login - Demo Mode */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-center text-sm font-semibold text-blue-700 mb-4">
              Quick Login - Demo Mode
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {demoRoles.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.role}
                    className={`cursor-pointer transition-all ${item.bgColor} ${item.borderColor} border-2`}
                    onClick={() => handleLogin(item.role)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                      <Icon className={`h-6 w-6 ${item.color}`} />
                      <div className="font-medium text-gray-900 text-sm">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.subtitle}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
