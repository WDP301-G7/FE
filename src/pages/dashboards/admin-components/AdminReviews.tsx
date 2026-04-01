import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Package,
  User,
  Calendar,
  Image as ImageIcon,
  Mail,
  Phone,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Pencil,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import * as reviewService from '@/services/review.service';
import type { Review, ReviewStats, GetReviewsParams } from '@/services/review.service';
import { productService } from '@/services/product.service';

export const AdminReviews: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

  // Dialogs
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Product images cache
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    hidden: 0,
    avgRating: 0,
  });

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetReviewsParams = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter as 'PUBLISHED' | 'HIDDEN';
      }

      if (ratingFilter !== 'ALL') {
        params.rating = parseInt(ratingFilter);
      }

      const data = await reviewService.getReviews(params);
      
      // Service transforms backend response to {items, total, page, limit}
      const items = data?.items || [];
      const total = data?.total || 0;
      
      setReviews(items);
      setPagination(prev => ({ ...prev, total }));

      // Preload product images for all reviews
      await preloadProductImages(items);

      // Calculate stats
      const published = items.filter(r => r.status === 'PUBLISHED').length;
      const hidden = items.filter(r => r.status === 'HIDDEN').length;
      const avgRating = items.length > 0
        ? items.reduce((sum, r) => sum + r.rating, 0) / items.length
        : 0;

      setStats({
        total,
        published,
        hidden,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error('❌ Failed to load reviews:', error);
      // Reset to empty state on error
      setReviews([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      setStats({
        total: 0,
        published: 0,
        hidden: 0,
        avgRating: 0,
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Backend chưa có API endpoint /reviews. Vui lòng liên hệ team backend.';
      
      toast({
        title: 'Lỗi khi tải đánh giá',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, ratingFilter, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Preload product images for all reviews
  const preloadProductImages = async (reviews: Review[]) => {
    console.log('🔄 Preloading product images for', reviews.length, 'reviews');
    const newImageCache: Record<string, string> = {};
    const uniqueProductIds = new Set<string>();
    
    // Collect all unique product IDs from all reviews
    reviews.forEach(review => {
      if (review.productId) {
        uniqueProductIds.add(review.productId);
      }
    });
    
    console.log('📦 Found', uniqueProductIds.size, 'unique products to fetch images for');
    
    try {
      // Fetch product details for all unique products
      const productPromises = Array.from(uniqueProductIds).map(async (productId) => {
        try {
          const product = await productService.getProduct(productId);
          if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            const imageUrl = firstImage.imageUrl;
            if (imageUrl) {
              newImageCache[productId] = imageUrl;
            }
          }
        } catch (err) {
          console.log('⚠️ Failed to fetch images for product:', productId);
        }
      });
      
      await Promise.all(productPromises);
      console.log('✅ Preloaded', Object.keys(newImageCache).length, 'product images');
      setProductImages(prevCache => ({ ...prevCache, ...newImageCache }));
    } catch (error) {
      console.log('❌ Error preloading product images:', error);
    }
  };

  // Load product image for single review
  const loadProductImage = async (review: Review) => {
    if (!review.productId) return;
    
    // Skip if already cached
    if (productImages[review.productId]) return;
    
    try {
      const product = await productService.getProduct(review.productId);
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        const imageUrl = firstImage.imageUrl;
        if (imageUrl) {
          setProductImages(prev => ({ ...prev, [review.productId]: imageUrl }));
        }
      }
    } catch (error) {
      console.log('Failed to fetch product image for:', review.productId);
    }
  };

  // View review details
  const handleViewDetails = async (review: Review) => {
    try {
      const fullReview = await reviewService.getReviewById(review.id);
      setSelectedReview(fullReview);
      setIsDetailDialogOpen(true);
      
      // Load product image if not cached
      await loadProductImage(fullReview);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết đánh giá',
        variant: 'destructive',
      });
    }
  };

  // Open reply dialog
  const handleReply = async (review: Review) => {
    try {
      // Fetch latest review data to ensure we have up-to-date reply info
      const freshReview = await reviewService.getReviewById(review.id);
      console.log('🔍 Fresh review data:', freshReview);
      console.log('🔍 Reply exists?', freshReview.replyContent ? 'YES' : 'NO', freshReview.replyContent);
      setSelectedReview(freshReview);
      setReplyContent(freshReview.replyContent || '');
      setIsReplyDialogOpen(true);
      
      // Load product image if not cached
      await loadProductImage(freshReview);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin đánh giá',
        variant: 'destructive',
      });
    }
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!selectedReview || !replyContent.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung phản hồi',
        variant: 'destructive',
      });
      return;
    }

    if (replyContent.length > 500) {
      toast({
        title: 'Lỗi',
        description: 'Nội dung phản hồi không được quá 500 ký tự',
        variant: 'destructive',
      });
      return;
    }

    setReplyLoading(true);
    try {
      const data = { replyContent: replyContent.trim() };

      if (selectedReview.replyContent) {
        // Update existing reply
        await reviewService.updateReviewReply(selectedReview.id, data);
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật phản hồi',
        });
      } else {
        // Create new reply
        await reviewService.addReviewReply(selectedReview.id, data);
        toast({
          title: 'Thành công',
          description: 'Đã thêm phản hồi',
        });
      }

      // ✅ Re-fetch the review WITH the new reply to update selectedReview state
      const updatedReview = await reviewService.getReviewById(selectedReview.id);
      setSelectedReview(updatedReview);
      
      // Close reply dialog but KEEP detail dialog open to show the new reply immediately
      setIsReplyDialogOpen(false);
      setReplyContent('');
      
      // Also update the review in the list for consistency
      loadReviews();
    } catch (error: unknown) {
      console.error('Reply error:', error);
      
      // Parse error message from backend
      let errorMessage = 'Không thể gửi phản hồi';
      let shouldRetryWithUpdate = false;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        
        if (axiosError.response?.status === 409) {
          // 409 Conflict: Reply already exists, automatically retry with PUT
          console.log('⚠️ 409 Conflict detected - Reply already exists. Retrying with PUT...');
          shouldRetryWithUpdate = true;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      // Automatically retry with UPDATE if we got 409
      if (shouldRetryWithUpdate) {
        try {
          const data = { replyContent: replyContent.trim() };
          await reviewService.updateReviewReply(selectedReview.id, data);
          toast({
            title: 'Thành công',
            description: 'Đã cập nhật phản hồi',
          });
          
          // ✅ Re-fetch the review WITH the updated reply
          const updatedReview = await reviewService.getReviewById(selectedReview.id);
          setSelectedReview(updatedReview);
          
          setIsReplyDialogOpen(false);
          setReplyContent('');
          
          // Also update the review in the list for consistency
          loadReviews();
          setReplyLoading(false);
          return; // Exit successfully
        } catch (retryError) {
          console.error('Retry with PUT also failed:', retryError);
          errorMessage = 'Không thể cập nhật phản hồi. Vui lòng thử lại.';
        }
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setReplyLoading(false);
    }
  };

  // Get star rating display
  const getStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get full image URL (handle relative paths)
  const getFullImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path, prepend the base URL
    const baseUrl = 'https://wdp.up.railway.app';
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  // Get product image URL from cache or review data
  const getProductImageUrl = (review: Review): string => {
    // Priority 1: Use cached image from productImages state
    if (review.productId && productImages[review.productId]) {
      return getFullImageUrl(productImages[review.productId]);
    }
    // Priority 2: Try product.images array (if backend includes it)
    if (review.product?.images && review.product.images.length > 0) {
      const firstImage = review.product.images[0];
      return getFullImageUrl(firstImage?.imageUrl || firstImage?.url || '');
    }
    return '';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Auth check
  if (!hasRole(['admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đánh Giá</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm TB</CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang Hiển Thị</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã Ẩn</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hidden}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Quản Lý Đánh Giá
          </CardTitle>
          <CardDescription>
            Quản lý và phản hồi đánh giá của khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                placeholder="Tìm kiếm theo sản phẩm, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Trạng thái</SelectItem>
                <SelectItem value="PUBLISHED">Đang hiển thị</SelectItem>
                <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Đánh giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Đánh giá</SelectItem>
                <SelectItem value="5">⭐ 5 sao</SelectItem>
                <SelectItem value="4">⭐ 4 sao</SelectItem>
                <SelectItem value="3">⭐ 3 sao</SelectItem>
                <SelectItem value="2">⭐ 2 sao</SelectItem>
                <SelectItem value="1">⭐ 1 sao</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadReviews}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : !reviews || reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Không có đánh giá nào
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {getProductImageUrl(review) ? (
                              <img 
                                src={getProductImageUrl(review)} 
                                alt={review.product?.name || 'Product'} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">
                            {review.product?.name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{review.customer?.fullName || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStarRating(review.rating)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {review.comment || '(Không có nội dung)'}
                        </div>
                        {review.images && review.images.length > 0 && (
                          <Badge variant="outline" className="mt-1">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {review.images.length} ảnh
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === 'PUBLISHED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {review.status === 'PUBLISHED' ? 'Hiển thị' : 'Đã ẩn'}
                        </Badge>
                        {review.replyContent && (
                          <Badge variant="outline" className="ml-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Đã phản hồi
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(review)}
                            title="Xem chi tiết"
                            className="hover:bg-slate-100 cursor-pointer h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReply(review)}
                            title={review.replyContent ? "Cập nhật phản hồi" : "Thêm phản hồi"}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer h-8 w-8"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {reviews?.length || 0} / {pagination.total} đánh giá
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  pagination.page * pagination.limit >= pagination.total
                }
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Details Dialog - Modernized */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Chi tiết đánh giá</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết đánh giá của khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
            {selectedReview && (
              <div className="space-y-4 py-2">
                {/* Customer & Product Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin khách hàng & Sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Khách hàng</p>
                          <p className="font-medium">{selectedReview.customer?.fullName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium text-sm break-all">{selectedReview.customer?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{selectedReview.customer?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Sản phẩm</p>
                          <div className="flex items-center gap-3 mt-1">
                            {getProductImageUrl(selectedReview) && (
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 border-2 flex-shrink-0">
                                <img 
                                  src={getProductImageUrl(selectedReview)} 
                                  alt={selectedReview.product?.name || 'Product'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                                    }
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{selectedReview.product?.name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">ID: {selectedReview.productId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày đánh giá</p>
                          <p className="font-medium">{formatDate(selectedReview.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Trạng thái</p>
                          <Badge
                            variant={selectedReview.status === 'PUBLISHED' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {selectedReview.status === 'PUBLISHED' ? 'Đang hiển thị' : 'Đã ẩn'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Content Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Nội dung đánh giá
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Đánh giá</p>
                      <div className="flex items-center gap-2">
                        {getStarRating(selectedReview.rating)}
                        <span className="text-lg font-bold">{selectedReview.rating}/5</span>
                      </div>
                    </div>

                    {/* Comment */}
                    {selectedReview.comment && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Nội dung</p>
                        <div className="bg-muted/50 p-4 rounded-lg border">
                          <p className="text-sm whitespace-pre-wrap">{selectedReview.comment}</p>
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {selectedReview.images && selectedReview.images.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Hình ảnh đính kèm ({selectedReview.images.length})
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedReview.images.map((image) => (
                            <div
                              key={image.id}
                              className="relative group overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors"
                            >
                              <img
                                src={image.imageUrl}
                                alt="Review"
                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reply Card */}
                {selectedReview.replyContent && (
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <MessageSquare className="h-5 w-5" />
                          Phản hồi từ Shop
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsDetailDialogOpen(false);
                            handleReply(selectedReview);
                          }}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Chỉnh sửa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap mb-3">
                          {selectedReview.replyContent}
                        </p>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium">Bởi: {selectedReview.replier?.fullName || 'N/A'}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(selectedReview.repliedAt || selectedReview.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No Reply Yet Card */}
                {!selectedReview.replyContent && (
                  <Card className="border-dashed border-2 border-muted-foreground/30">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">Chưa có phản hồi</p>
                          <p className="text-xs text-muted-foreground">
                            Đánh giá này chưa được phản hồi. Click nút bên dưới để thêm phản hồi.
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setIsDetailDialogOpen(false);
                            handleReply(selectedReview);
                          }}
                          className="gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Thêm phản hồi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Meta Info */}
                {selectedReview.editableUntil && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Khách hàng có thể chỉnh sửa đến: {formatDate(selectedReview.editableUntil)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog - Modernized */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedReview?.reply ? 'Cập nhật phản hồi' : 'Thêm phản hồi'}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.reply ? (
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    ✏️ Chế độ chỉnh sửa
                  </Badge>
                  <span>Bạn đang cập nhật phản hồi đã có (tối đa 500 ký tự)</span>
                </span>
              ) : (
                'Phản hồi đánh giá của khách hàng (tối đa 500 ký tự)'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReview && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getStarRating(selectedReview.rating)}
                    <span className="text-sm font-medium">
                      {selectedReview.rating}/5
                    </span>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedReview.customer?.fullName}
                    </span>
                  </div>
                  {selectedReview.comment && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-md border">
                      <p className="text-sm line-clamp-3">{selectedReview.comment}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    <span>{selectedReview.product?.name || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show existing reply info when editing */}
            {selectedReview?.replyContent && (
              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Phản hồi hiện tại
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                        Bởi {selectedReview.replier?.fullName || 'N/A'} • {formatDate(selectedReview.repliedAt || selectedReview.updatedAt)}
                      </p>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded border text-xs">
                        {selectedReview.replyContent}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Nội dung phản hồi</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nhập nội dung phản hồi của shop..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={8}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    💡 Phản hồi chân thành giúp tăng uy tín shop
                  </p>
                  <p className="text-xs font-medium">
                    {replyContent.length}/500
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsReplyDialogOpen(false);
                setReplyContent('');
              }}
              disabled={replyLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmitReply} 
              disabled={replyLoading || !replyContent.trim()}
              className="gap-2 min-w-[140px]"
            >
              {replyLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {selectedReview?.reply ? 'Đang cập nhật...' : 'Đang gửi...'}
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  {selectedReview?.reply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
