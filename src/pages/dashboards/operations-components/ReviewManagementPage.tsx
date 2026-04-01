import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Review,
  updateReviewReply,
  addReviewReply,
  getReviews,
  deleteReview,
} from "@/services/review.service";
import StatusBadge from "@/components/StatusBadge";
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  Rate,
  Divider,
} from "antd";
import { motion } from "framer-motion";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReviewManagementPage: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(["OPERATIONS", "operations", "OPERATION", "operation"])) {
    return <Navigate to="/dashboard" replace />;
  }

  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [editingReply, setEditingReply] = useState<boolean>(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    loadReviews();
  }, [pagination.page, statusFilter, ratingFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviews({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
      });
      setReviews(res.items || []);
      setPagination((prev) => ({ ...prev, total: res.total }));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Tải đánh giá thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc muốn xoá đánh giá này không?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await deleteReview(id);
          toast({ title: "Thành công", description: "Xoá đánh giá thành công" });
          loadReviews();
        } catch (error: any) {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || "Xoá thất bại",
            variant: "destructive",
          });
        }
      },
    });
  };

  const openDetailReview = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || "");
    setEditingReply(false);
    setOpenDetail(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview) return;
    if (!replyText.trim()) {
      toast({ title: "Lỗi", description: "Nội dung phản hồi trống", variant: "destructive" });
      return;
    }
    setReplyLoading(true);
    try {
      let updated: Review;
      if (selectedReview.reply && editingReply) {
        updated = await updateReviewReply(selectedReview.id, replyText.trim());
      } else {
        updated = await addReviewReply(selectedReview.id, replyText.trim());
      }
      setSelectedReview(updated);
      setEditingReply(false);
      toast({
        title: "Thành công",
        description: selectedReview.reply && editingReply ? "Phản hồi đã được cập nhật" : "Đã gửi phản hồi",
      });
      loadReviews();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể gửi phản hồi",
        variant: "destructive",
      });
    } finally {
      setReplyLoading(false);
    }
  };

  // Derived stats
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const repliedCount = reviews.filter((r) => r.reply).length;

  const columns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_: unknown, record: Review) => (
        <Text strong>{record.product?.name || "—"}</Text>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: unknown, record: Review) => (
        <Text>{record.customer?.fullName || "—"}</Text>
      ),
    },
    {
      title: "Đơn hàng",
      key: "order",
      render: (_: unknown, record: Review) => (
        <Text style={{ fontSize: 12 }}>
          {record.order?.orderNumber || record.orderId || "—"}
        </Text>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (val: number) => (
        <Rate disabled defaultValue={val} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: "Bình luận",
      dataIndex: "comment",
      key: "comment",
      render: (val: string) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {val || "—"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (val ? <StatusBadge status={val} /> : <Text>—</Text>),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) => (
        <Text>{val ? new Date(val).toLocaleDateString("vi-VN") : "—"}</Text>
      ),
    },
    {
      title: "Phản hồi",
      dataIndex: "reply",
      key: "reply",
      render: (val: string) =>
        val ? (
          <Tag color="green">Đã phản hồi</Tag>
        ) : (
          <Tag color="orange">Chưa phản hồi</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "right" as const,
      render: (_: unknown, record: Review) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDetailReview(record)}
          >
            Xem
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đánh giá", value: pagination.total },
          { label: "Điểm TB", value: avgRating },
          { label: "Chờ duyệt", value: pendingCount },
          { label: "Đã phản hồi", value: repliedCount },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Card className="stat-card">
              <div className="space-y-2">
                <Text className="text-muted-foreground">{stat.label}</Text>
                <Title level={3} className="!mb-0 !text-foreground">
                  {stat.value}
                </Title>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Title level={4} className="!text-foreground !mb-0">
              Quản lý Đánh giá
            </Title>
            <Space wrap>
              <Select
                style={{ width: 180 }}
                value={statusFilter || "__all"}
                onChange={(v) => {
                  setStatusFilter(v === "__all" ? "" : v);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <Option value="__all">Tất cả trạng thái</Option>
                <Option value="approved">Đã duyệt</Option>
                <Option value="pending">Chờ duyệt</Option>
                <Option value="rejected">Bị từ chối</Option>
              </Select>
              <Select
                style={{ width: 150 }}
                value={ratingFilter || "__all"}
                onChange={(v) => {
                  setRatingFilter(v === "__all" ? "" : v);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <Option value="__all">Tất cả sao</Option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <Option key={n} value={String(n)}>
                    {n} sao
                  </Option>
                ))}
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { setPagination((p) => ({ ...p, page: 1 })); loadReviews(); }}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            dataSource={reviews}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đánh giá`,
              onChange: (page, pageSize) =>
                setPagination((prev) => ({ ...prev, page, limit: pageSize })),
            }}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Đánh giá"
        open={openDetail}
        onCancel={() => setOpenDetail(false)}
        footer={<Button onClick={() => setOpenDetail(false)}>Đóng</Button>}
        destroyOnClose
        width={560}
      >
        {selectedReview && (
          <div className="space-y-3 py-2">
            {[
              { label: "Sản phẩm", value: selectedReview.product?.name || "—" },
              { label: "Khách hàng", value: selectedReview.customer?.fullName || "—" },
              {
                label: "Đơn hàng",
                value: selectedReview.order?.orderNumber || selectedReview.orderId || "N/A",
              },
              {
                label: "Bình luận",
                value: selectedReview.comment || "Không có bình luận",
              },
              {
                label: "Ngày tạo",
                value: new Date(selectedReview.createdAt).toLocaleString("vi-VN"),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div><Text strong>{value}</Text></div>
              </div>
            ))}

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Đánh giá</Text>
              <div>
                <Rate disabled defaultValue={selectedReview.rating} style={{ fontSize: 16 }} />
              </div>
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái</Text>
              <div>
                {selectedReview.status ? <StatusBadge status={selectedReview.status} /> : "—"}
              </div>
            </div>

            <Divider orientation="left">
              <Text strong>Phản hồi của nhân viên</Text>
            </Divider>

            {!editingReply && selectedReview.reply ? (
              <div className="space-y-2">
                <Text>{selectedReview.reply}</Text>
                <div>
                  <Button size="small" onClick={() => setEditingReply(true)}>
                    Sửa phản hồi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <TextArea
                  placeholder="Nhập nội dung phản hồi..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  {editingReply && (
                    <Button onClick={() => setEditingReply(false)}>Huỷ</Button>
                  )}
                  <Button
                    type="primary"
                    onClick={handleSubmitReply}
                    loading={replyLoading}
                  >
                    {selectedReview.reply && editingReply ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default ReviewManagementPage;