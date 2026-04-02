import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  MessageSquare,
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
import { useToast } from '@/hooks/use-toast';
import * as reviewService from '@/services/review.service';
import type { Review, GetReviewsParams } from '@/services/review.service';
import { productService } from '@/services/product.service';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Input,
  Rate,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReviewManagementPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const [productImages, setProductImages] = useState<Record<string, string>>({});

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    hidden: 0,
    avgRating: 0,
  });

  const preloadProductImages = useCallback(async (reviewItems: Review[]) => {
    const newImageCache: Record<string, string> = {};
    const uniqueProductIds = new Set<string>();

    reviewItems.forEach((review) => {
      if (review.productId) {
        uniqueProductIds.add(review.productId);
      }
    });

    try {
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
        } catch {
          // Skip invalid products/images silently
        }
      });

      await Promise.all(productPromises);
      setProductImages((prevCache) => ({ ...prevCache, ...newImageCache }));
    } catch {
      // Keep UI stable if image preload fails
    }
  }, []);

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
        params.rating = parseInt(ratingFilter, 10);
      }

      const data = await reviewService.getReviews(params);
      const items = data?.items || [];
      const total = data?.total || 0;

      setReviews(items);
      setPagination((prev) => ({ ...prev, total }));

      await preloadProductImages(items);

      const published = items.filter((r) => r.status === 'PUBLISHED').length;
      const hidden = items.filter((r) => r.status === 'HIDDEN').length;
      const avgRating =
        items.length > 0
          ? items.reduce((sum, r) => sum + r.rating, 0) / items.length
          : 0;

      setStats({
        total,
        published,
        hidden,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      setReviews([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
      setStats({
        total: 0,
        published: 0,
        hidden: 0,
        avgRating: 0,
      });

      const errorMessage =
        error instanceof Error
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
  }, [pagination.page, pagination.limit, statusFilter, ratingFilter, preloadProductImages, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const loadProductImage = async (review: Review) => {
    if (!review.productId) return;
    if (productImages[review.productId]) return;

    try {
      const product = await productService.getProduct(review.productId);
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        const imageUrl = firstImage.imageUrl;
        if (imageUrl) {
          setProductImages((prev) => ({ ...prev, [review.productId]: imageUrl }));
        }
      }
    } catch {
      // Ignore product image load errors
    }
  };

  const handleViewDetails = async (review: Review) => {
    try {
      const fullReview = await reviewService.getReviewById(review.id);
      setSelectedReview(fullReview);
      setIsDetailDialogOpen(true);
      await loadProductImage(fullReview);
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết đánh giá',
        variant: 'destructive',
      });
    }
  };

  const handleReply = async (review: Review) => {
    try {
      const freshReview = await reviewService.getReviewById(review.id);
      setSelectedReview(freshReview);
      setReplyContent(freshReview.replyContent || '');
      setIsReplyDialogOpen(true);
      await loadProductImage(freshReview);
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin đánh giá',
        variant: 'destructive',
      });
    }
  };

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
        await reviewService.updateReviewReply(selectedReview.id, data);
        toast({ title: 'Thành công', description: 'Đã cập nhật phản hồi' });
      } else {
        await reviewService.addReviewReply(selectedReview.id, data);
        toast({ title: 'Thành công', description: 'Đã thêm phản hồi' });
      }

      const updatedReview = await reviewService.getReviewById(selectedReview.id);
      setSelectedReview(updatedReview);
      setIsReplyDialogOpen(false);
      setReplyContent('');
      loadReviews();
    } catch (error: unknown) {
      let errorMessage = 'Không thể gửi phản hồi';
      let shouldRetryWithUpdate = false;

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

        if (axiosError.response?.status === 409) {
          shouldRetryWithUpdate = true;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      if (shouldRetryWithUpdate) {
        try {
          const data = { replyContent: replyContent.trim() };
          await reviewService.updateReviewReply(selectedReview.id, data);
          toast({ title: 'Thành công', description: 'Đã cập nhật phản hồi' });

          const updatedReview = await reviewService.getReviewById(selectedReview.id);
          setSelectedReview(updatedReview);
          setIsReplyDialogOpen(false);
          setReplyContent('');
          loadReviews();
          setReplyLoading(false);
          return;
        } catch {
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

  const getStarRating = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const getFullImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = 'https://wdp.up.railway.app';
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  const getProductImageUrl = (review: Review): string => {
    if (review.productId && productImages[review.productId]) {
      return getFullImageUrl(productImages[review.productId]);
    }
    if (review.product?.images && review.product.images.length > 0) {
      const firstImage = review.product.images[0];
      return getFullImageUrl(firstImage?.imageUrl || firstImage?.url || '');
    }
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasRole(['OPERATIONS', 'operations', 'OPERATION', 'operation'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredReviews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return reviews;

    return reviews.filter((review) => {
      const searchable = [
        review.product?.name,
        review.customer?.fullName,
        review.customer?.email,
        review.customer?.phone,
        review.comment,
        review.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [reviews, searchTerm]);

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: unknown, record: Review) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
            {getProductImageUrl(record) ? (
              <img
                src={getProductImageUrl(record)}
                alt={record.product?.name || 'Product'}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Text strong>{record.product?.name || 'N/A'}</Text>
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: Review) => (
        <Space>
          <User className="h-4 w-4 text-muted-foreground" />
          <Text>{record.customer?.fullName || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nội dung',
      key: 'comment',
      render: (_: unknown, record: Review) => (
        <div className="max-w-xs">
          <Text ellipsis>{record.comment || '(Không có nội dung)'}</Text>
          {record.images && record.images.length > 0 && (
            <div>
              <Tag className="mt-1" color="default">
                <ImageIcon className="mr-1 inline h-3 w-3" />
                {record.images.length} ảnh
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: Review) => (
        <Space size={4}>
          <Tag color={record.status === 'PUBLISHED' ? 'green' : 'default'}>
            {record.status === 'PUBLISHED' ? 'Hiển thị' : 'Đã ẩn'}
          </Tag>
          {record.replyContent && <Tag color="blue">Đã phản hồi</Tag>}
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => (
        <Space size={4}>
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <Text type="secondary">{new Date(value).toLocaleDateString('vi-VN')}</Text>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: Review) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            Xem
          </Button>
          <Button
            icon={<MessageOutlined />}
            size="small"
            onClick={() => handleReply(record)}
            type="primary"
          >
            {record.replyContent ? 'Cập nhật' : 'Phản hồi'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Tổng đánh giá</Text>
            <Title level={3} className="!mt-2 !mb-0">{stats.total}</Title>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Điểm trung bình</Text>
            <Title level={3} className="!mt-2 !mb-0">{stats.avgRating}</Title>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Đang hiển thị</Text>
            <Title level={3} className="!mt-2 !mb-0">{stats.published}</Title>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Đã ẩn</Text>
            <Title level={3} className="!mt-2 !mb-0">{stats.hidden}</Title>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Title level={4} className="!mb-0">Quản lý đánh giá</Title>
          <Space wrap>
            <Input
              allowClear
              placeholder="Tìm theo sản phẩm, khách hàng..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 280 }}
            />

            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 170 }}>
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="PUBLISHED">Đang hiển thị</Option>
              <Option value="HIDDEN">Đã ẩn</Option>
            </Select>

            <Select value={ratingFilter} onChange={setRatingFilter} style={{ width: 140 }}>
              <Option value="ALL">Tất cả sao</Option>
              <Option value="5">5 sao</Option>
              <Option value="4">4 sao</Option>
              <Option value="3">3 sao</Option>
              <Option value="2">2 sao</Option>
              <Option value="1">1 sao</Option>
            </Select>

            <Button icon={<ReloadOutlined />} loading={loading} onClick={loadReviews}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredReviews}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={false}
        />

        <div className="mt-4 flex items-center justify-between">
          <Text type="secondary">
            Hiển thị {filteredReviews.length} / {pagination.total} đánh giá
          </Text>
          <Space>
            <Button
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Trước
            </Button>
            <Button
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Sau
            </Button>
          </Space>
        </div>
      </Card>

      <Modal
        title="Chi tiết đánh giá"
        open={isDetailDialogOpen}
        onCancel={() => setIsDetailDialogOpen(false)}
        footer={<Button onClick={() => setIsDetailDialogOpen(false)}>Đóng</Button>}
        width={980}
        destroyOnClose
      >
        {selectedReview && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <Card title="Thông tin khách hàng & sản phẩm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Space>
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Text strong>{selectedReview.customer?.fullName || 'N/A'}</Text>
                    </Space>
                    <Space>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Text>{selectedReview.customer?.email || 'N/A'}</Text>
                    </Space>
                    <Space>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Text>{selectedReview.customer?.phone || 'N/A'}</Text>
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space align="start" size={12}>
                    {getProductImageUrl(selectedReview) ? (
                      <img
                        src={getProductImageUrl(selectedReview)}
                        alt={selectedReview.product?.name || 'Product'}
                        className="h-16 w-16 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-gray-100">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Space direction="vertical" size={4}>
                      <Text strong>{selectedReview.product?.name || 'N/A'}</Text>
                      <Text type="secondary">ID: {selectedReview.productId}</Text>
                      <Text type="secondary">{formatDate(selectedReview.createdAt)}</Text>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Card title="Nội dung đánh giá">
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Space>
                  {getStarRating(selectedReview.rating)}
                  <Text strong>{selectedReview.rating}/5</Text>
                  <Tag color={selectedReview.status === 'PUBLISHED' ? 'green' : 'default'}>
                    {selectedReview.status === 'PUBLISHED' ? 'Đang hiển thị' : 'Đã ẩn'}
                  </Tag>
                </Space>

                <div className="rounded-md border bg-slate-50 p-3">
                  <Text>{selectedReview.comment || 'Không có nội dung'}</Text>
                </div>

                {selectedReview.images && selectedReview.images.length > 0 && (
                  <>
                    <Text type="secondary">Hình ảnh đính kèm ({selectedReview.images.length})</Text>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedReview.images.map((image) => (
                        <img
                          key={image.id}
                          src={image.imageUrl}
                          alt="Review"
                          className="h-36 w-full rounded-md border object-cover"
                        />
                      ))}
                    </div>
                  </>
                )}
              </Space>
            </Card>

            {selectedReview.replyContent ? (
              <Card
                title="Phản hồi từ shop"
                extra={
                  <Button
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleReply(selectedReview);
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                }
              >
                <div className="rounded-md border bg-slate-50 p-3">
                  <Text>{selectedReview.replyContent}</Text>
                  <Divider className="my-3" />
                  <Space size={4}>
                    <Text type="secondary">Bởi: {selectedReview.replier?.fullName || 'N/A'}</Text>
                    <Text type="secondary">•</Text>
                    <Text type="secondary">{formatDate(selectedReview.repliedAt || selectedReview.updatedAt)}</Text>
                  </Space>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-4">
                  <Text type="secondary">Chưa có phản hồi cho đánh giá này</Text>
                  <div className="mt-3">
                    <Button
                      type="primary"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        handleReply(selectedReview);
                      }}
                    >
                      Thêm phản hồi
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {selectedReview.editableUntil && (
              <Card>
                <Space size={8}>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Text type="secondary">
                    Khách hàng có thể chỉnh sửa đến: {formatDate(selectedReview.editableUntil)}
                  </Text>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={selectedReview?.replyContent ? 'Cập nhật phản hồi' : 'Thêm phản hồi'}
        open={isReplyDialogOpen}
        onCancel={() => {
          setIsReplyDialogOpen(false);
          setReplyContent('');
        }}
        onOk={handleSubmitReply}
        okText={selectedReview?.replyContent ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
        confirmLoading={replyLoading}
        okButtonProps={{ disabled: !replyContent.trim() }}
        width={760}
        destroyOnClose
      >
        {selectedReview && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space>
                  {getStarRating(selectedReview.rating)}
                  <Text strong>{selectedReview.rating}/5</Text>
                  <Text type="secondary">{selectedReview.customer?.fullName || 'N/A'}</Text>
                </Space>
                <Text type="secondary">{selectedReview.product?.name || 'N/A'}</Text>
                {selectedReview.comment && <Text>{selectedReview.comment}</Text>}
              </Space>
            </Card>

            {selectedReview.replyContent && (
              <Card size="small">
                <Text strong>Phản hồi hiện tại</Text>
                <div className="mt-2 rounded-md border bg-slate-50 p-2">
                  <Text>{selectedReview.replyContent}</Text>
                </div>
              </Card>
            )}

            <div>
              <Text strong>Nội dung phản hồi</Text>
              <TextArea
                placeholder="Nhập nội dung phản hồi của shop..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={7}
                maxLength={500}
                style={{ marginTop: 8 }}
              />
              <div className="mt-1 text-right">
                <Text type="secondary">{replyContent.length}/500</Text>
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </motion.div>
  );
};

export default ReviewManagementPage;