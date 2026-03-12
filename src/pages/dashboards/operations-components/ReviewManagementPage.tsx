import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { reviewService, Review } from "@/services/review.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { Search, Trash2, Star } from "lucide-react";
import StatusBadge from '@/components/StatusBadge';

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
  const [replyText, setReplyText] = useState<string>('');
  const [editingReply, setEditingReply] = useState<boolean>(false);
  const [openDetail, setOpenDetail] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    loadReviews();
  }, [pagination.page, statusFilter, ratingFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewService.getReviews({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined
      });

      console.log("Reviews response:", res);

      const reviewsData = res.data?.data || [];
      const meta = res.data?.meta;

      setReviews(reviewsData);

      if (meta) {
        setPagination(prev => ({
          ...prev,
          total: meta.total
        }));
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await reviewService.deleteReview(id);

      toast({
        title: "Success",
        description: "Review deleted successfully"
      });

      loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete review",
        variant: "destructive"
      });
    }
  };

  const openDetailReview = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setEditingReply(false);
    setOpenDetail(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          
          Đánh giá
        </CardTitle>

        <CardDescription>
          Quản lý đánh giá của khách hàng cho sản phẩm
        </CardDescription>
      </CardHeader>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">

              <div>
                <Label>Sản phẩm</Label>
                <p className="text-sm">{selectedReview.product?.name}</p>
              </div>

              <div>
                <Label>Khách hàng</Label>
                <p className="text-sm">{selectedReview.customer?.fullName}</p>
              </div>

              <div>
                <Label>Đơn hàng</Label>
                <p className="text-sm">{selectedReview.order?.orderNumber || selectedReview.orderId || 'N/A'}</p>
              </div>

              <div>
                <Label>Bình luận</Label>
                <p className="text-sm">{selectedReview.comment || "Không có bình luận"}</p>
              </div>

              <div>
                <Label>Trạng thái</Label>
                <p className="text-sm">
                  {selectedReview.status ? <StatusBadge status={selectedReview.status} /> : "-"}
                </p>
              </div>

              <div>
                <Label>Ngày tạo</Label>
                <p className="text-sm">
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </p>
              </div>

              {/* reply section */}
              <div className="border-t pt-4">
                <Label>Phản hồi của nhân viên</Label>
                {!editingReply && selectedReview.reply ? (
                  <div className="flex justify-between items-start">
                    <p className="text-sm whitespace-pre-wrap flex-1">{selectedReview.reply}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => setEditingReply(true)}
                    >
                      Sửa
                    </Button>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Nhập nội dung phản hồi..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                )}
                {(editingReply || !selectedReview.reply) && (
                  <Button
                    className="mt-2"
                    onClick={async () => {
                      if (!selectedReview) return;
                      if (!replyText.trim()) {
                        toast({ title: 'Error', description: 'Nội dung phản hồi trống', variant: 'destructive' });
                        return;
                      }
                      setLoading(true);
                      try {
                        let updated;
                        if (selectedReview.reply && !editingReply) {
                          // shouldn't happen, but guard
                          updated = selectedReview;
                        } else if (selectedReview.reply && editingReply) {
                          updated = await reviewService.updateReviewReply(
                            selectedReview.id,
                            replyText.trim()
                          );
                        } else {
                          updated = await reviewService.replyToReview(
                            selectedReview.id,
                            replyText.trim()
                          );
                        }
                        setSelectedReview(updated);
                        setEditingReply(false);
                        toast({ title: 'Thành công', description: selectedReview.reply && editingReply ? 'Phản hồi đã được cập nhật' : 'Đã gửi phản hồi' });
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.response?.data?.message || 'Không thể gửi phản hồi', variant: 'destructive' });
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {selectedReview.reply && editingReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                  </Button>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Label>Trạng thái</Label>
            <Input
              placeholder="approved / pending"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label>Đánh giá</Label>
            <Input
              type="number"
              placeholder="1 - 5"
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
            />
          </div>

          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead>Bình luận</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Phản hồi</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
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
                    Không tìm thấy đánh giá nào
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map(r => (
                  <TableRow key={r.id}>
<TableCell>{r.product?.name || "-"}</TableCell>
                    
                    <TableCell>{r.customer?.fullName || "-"}</TableCell>
                    
                    <TableCell>{r.order?.orderNumber || r.orderId || "-"}</TableCell>

                    <TableCell>
                      <p className="flex gap-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </p>
                    </TableCell>

                    <TableCell className="max-w-[250px] truncate">
                      {r.comment || "-"}
                    </TableCell>

                          <TableCell>{r.status ? <StatusBadge status={r.status} /> : "-"}</TableCell>

                    <TableCell>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell className="max-w-[150px] truncate text-sm" title={r.reply || ''}>
                      {r.reply ? r.reply : "-"}
                    </TableCell>

                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailReview(r)}
                      >
                        Xem
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            Đang hiển thị {reviews?.length || 0} của {pagination.total} đánh giá
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination(prev => ({
                  ...prev,
                  page: prev.page - 1
                }))
              }
            >
              Trước
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={
                pagination.page * pagination.limit >=
                pagination.total
              }
              onClick={() =>
                setPagination(prev => ({
                  ...prev,
                  page: prev.page + 1
                }))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewManagementPage;