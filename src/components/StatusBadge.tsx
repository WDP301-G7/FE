import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: string;
  // you can optionally override the displayed label if needed
  label?: string;
}

// mapping statuses (uppercased) to badge variants and optional extra color classes
const variantMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; class?: string }> = {
  // order/operations statuses
  PENDING: { variant: "outline", class: "bg-yellow-100 text-yellow-800" },
  PENDING_PAYMENT: { variant: "outline", class: "bg-amber-100 text-amber-800" },
  WAITING_CUSTOMER: { variant: "outline", class: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { variant: "default", class: "bg-blue-100 text-blue-800" },
  PROCESSING: { variant: "secondary", class: "bg-purple-100 text-purple-800" },
  READY: { variant: "default", class: "bg-orange-100 text-orange-800" },
  SHIPPED: { variant: "default", class: "bg-teal-100 text-teal-800" },
  DELIVERED: { variant: "default", class: "bg-green-100 text-green-800" },
  RETURNED: { variant: "destructive", class: "bg-red-100 text-red-800" },
  CANCELLED: { variant: "destructive", class: "bg-red-100 text-red-800" },
  COMPLETED: { variant: "default", class: "bg-green-100 text-green-800" },

  // review statuses (guessing common values)
  APPROVED: { variant: "default", class: "bg-green-100 text-green-800" },
  REJECTED: { variant: "destructive", class: "bg-red-100 text-red-800" },
  FLAGGED: { variant: "destructive", class: "bg-red-100 text-red-800" },

  // prescription statuses
  VERIFIED: { variant: "secondary", class: "bg-blue-100 text-blue-800" },
  "UPDATE-REQUIRED": { variant: "destructive", class: "bg-red-100 text-red-800" },
  "UPDATE_REQUIRED": { variant: "destructive", class: "bg-red-100 text-red-800" },

  // return statuses (fallback to component-specific mapping if used)
  PENDING_APPROVAL: { variant: "outline", class: "bg-yellow-100 text-yellow-800" },
  // generic/common statuses that might appear in many contexts
  PENDING: { variant: "outline", class: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { variant: "destructive", class: "bg-red-100 text-red-800" },
  COMPLETED: { variant: "default", class: "bg-green-100 text-green-800" },
  APPROVED: { variant: "default", class: "bg-green-100 text-green-800" },
  REJECTED: { variant: "destructive", class: "bg-red-100 text-red-800" },
};

// optional mapping for more readable labels
const labelMap: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PENDING_PAYMENT: "Chờ thanh toán",
  WAITING_CUSTOMER: "Đang chuẩn bị",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  READY: "Sẵn sàng giao",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  RETURNED: "Đã trả hàng",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  FLAGGED: "Cần kiểm tra",
  VERIFIED: "Đã xác thực",
  "UPDATE-REQUIRED": "Cần cập nhật",
  "UPDATE_REQUIRED": "Cần cập nhật",
  PENDING_APPROVAL: "Chờ phê duyệt",
  PICKING: "Đang hái đơn",
  PICKED: "Đã hái xong",
  PACKING: "Đang đóng gói",
  PACKED: "Đã đóng gói",
  WAITING_PICKING: "Chờ hái đơn",
  WAITING_PACKING: "Chờ đóng gói",
};

function formatStatus(status: string) {
  if (!status) return "";
  const upper = status.toUpperCase();
  if (labelMap[upper]) {
    return labelMap[upper];
  }
  // split on underscores, hyphens, spaces
  return upper
    .split(/[_\-\s]+/)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status = "", label }) => {
  if (!status) {
    return <span className="text-muted-foreground">-</span>;
  }
  const upper = status.toUpperCase();
  const entry = variantMap[upper] || { variant: "outline" };
  const { variant, class: extraClass } = entry;
  return (
    <Badge variant={variant} className={extraClass}>
      {label || formatStatus(status)}
    </Badge>
  );
};

export default StatusBadge;
