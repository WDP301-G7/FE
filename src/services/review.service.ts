import { api } from '@/lib/api';

// ============ TYPES ============

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN';

export interface Review {
  id: string;
  orderItemId: string;
  customerId: string;
  productId: string;
  rating: number; // 1-5
  comment?: string;
  images?: ReviewImage[];
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  editableUntil: string; // createdAt + 7 days
  reply?: ReviewReply;

  // Populated fields
  customer?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  product?: {
    id: string;
    name: string;
    images?: { url?: string; imageUrl?: string }[];
  };
  orderItem?: {
    id: string;
    orderId: string;
    productName?: string;
  };
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  createdAt: string;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  replyContent: string;
  repliedBy: string;
  createdAt: string;
  updatedAt: string;

  // Populated field
  staff?: {
    id: string;
    fullName: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  productId?: string;
  customerId?: string;
  rating?: number;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export interface PaginatedReviews {
  items: Review[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateReplyData {
  replyContent: string; // max 500 chars
}

// ============ ADMIN / OPERATION SERVICES ============

/**
 * Get all reviews with filters (ADMIN/OPERATION)
 * GET /api/reviews
 */
export const getReviews = async (params: GetReviewsParams = {}): Promise<PaginatedReviews> => {
  const response = await api.get('/reviews', { params });

  // Backend returns: {data: Review[], meta: {total, page, limit}}
  // Transform to: {items: Review[], total, page, limit}
  const result = response.data?.data || response.data;

  if (result.data && result.meta) {
    // New structure: {data: Array, meta: {total, page, limit}}
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  // Fallback: old structure {items, total, page, limit}
  return result;
};

/**
 * Get review by ID (ADMIN/OPERATION)
 * GET /api/reviews/:id
 */
export const getReviewById = async (id: string): Promise<Review> => {
  const response = await api.get(`/reviews/${id}`);
  return response.data?.data || response.data;
};

/**
 * Get review statistics for products (ADMIN/OPERATION)
 * GET /api/reviews/stats?productIds=id1,id2
 */
export const getReviewStats = async (productIds?: string[]): Promise<Record<string, ReviewStats>> => {
  const params = productIds ? { productIds: productIds.join(',') } : {};
  const response = await api.get('/reviews/stats', { params });
  return response.data?.data || response.data;
};

/**
 * Add reply to a review (ADMIN/OPERATION)
 * POST /api/reviews/:id/reply
 * Rule: Only POST once, review must be PUBLISHED
 */
export const addReviewReply = async (reviewId: string, data: CreateReplyData): Promise<ReviewReply> => {
  const response = await api.post(`/reviews/${reviewId}/reply`, data);
  return response.data?.data || response.data;
};

/**
 * Update existing reply (ADMIN/OPERATION)
 * PUT /api/reviews/:id/reply
 */
export const updateReviewReply = async (reviewId: string, data: CreateReplyData): Promise<ReviewReply> => {
  const response = await api.put(`/reviews/${reviewId}/reply`, data);
  return response.data?.data || response.data;
};

/**
 * Hide a review (ADMIN/OPERATION)
 * PATCH /api/reviews/:id/hide
 * PUBLISHED → HIDDEN
 */
export const hideReview = async (reviewId: string): Promise<Review> => {
  const response = await api.patch(`/reviews/${reviewId}/hide`);
  return response.data?.data || response.data;
};

/**
 * Show (restore) a review (ADMIN/OPERATION)
 * PATCH /api/reviews/:id/show
 * HIDDEN → PUBLISHED
 */
export const showReview = async (reviewId: string): Promise<Review> => {
  const response = await api.patch(`/reviews/${reviewId}/show`);
  return response.data?.data || response.data;
};

/**
 * Delete a review permanently (ADMIN ONLY)
 * DELETE /api/reviews/:id
 * Also deletes images from Supabase
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};

// ============ PUBLIC SERVICES ============

/**
 * Get reviews for a product (PUBLIC)
 * GET /api/products/:productId/reviews
 */
export interface GetProductReviewsParams {
  rating?: number;
  hasImages?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export const getProductReviews = async (
  productId: string,
  params: GetProductReviewsParams = {}
): Promise<PaginatedReviews> => {
  const response = await api.get(`/products/${productId}/reviews`, { params });

  // Backend returns: {data: Review[], meta: {total, page, limit}}
  // Transform to: {items: Review[], total, page, limit}
  const result = response.data?.data || response.data;

  if (result.data && result.meta) {
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  // Fallback: old structure {items, total, page, limit}
  return result;
};

/**
 * Get review summary for a product (PUBLIC)
 * GET /api/products/:productId/reviews/summary
 */
export const getProductReviewsSummary = async (productId: string): Promise<ReviewStats> => {
  const response = await api.get(`/products/${productId}/reviews/summary`);
  return response.data?.data || response.data;
};

// ============ CUSTOMER SERVICES ============

/**
 * Get eligible order items for review (CUSTOMER)
 * GET /api/reviews/eligible
 */
export interface EligibleOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  orderCompletedAt: string;
  deadline: string; // 30 days after order completed
  productType: 'FRAME' | 'LENS';
}

export const getEligibleReviews = async (): Promise<EligibleOrderItem[]> => {
  const response = await api.get('/reviews/eligible');
  return response.data?.data || response.data;
};

/**
 * Get my reviews (CUSTOMER)
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = async (page = 1, limit = 10): Promise<PaginatedReviews> => {
  const response = await api.get('/reviews/my-reviews', {
    params: { page, limit },
  });

  // Backend returns: {data: Review[], meta: {total, page, limit}}
  // Transform to: {items: Review[], total, page, limit}
  const result = response.data?.data || response.data;

  if (result.data && result.meta) {
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  // Fallback: old structure {items, total, page, limit}
  return result;
};

/**
 * Create a review (CUSTOMER)
 * POST /api/reviews
 * Supports both JSON and multipart/form-data
 */
export interface CreateReviewData {
  orderItemId: string;
  rating: number; // 1-5
  comment?: string; // max 1000 chars
  images?: File[]; // max 3 images, 5MB each
}

export const createReview = async (data: CreateReviewData): Promise<Review> => {
  const formData = new FormData();

  formData.append('orderItemId', data.orderItemId);
  formData.append('rating', data.rating.toString());

  if (data.comment) {
    formData.append('comment', data.comment);
  }

  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await api.post('/reviews', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data?.data || response.data;
};

/**
 * Update a review (CUSTOMER)
 * PUT /api/reviews/:id
 * Must be within 7 days (editableUntil)
 */
export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: File[]; // New images (old ones will be deleted)
}

export const updateReview = async (reviewId: string, data: UpdateReviewData): Promise<Review> => {
  const formData = new FormData();

  if (data.rating !== undefined) {
    formData.append('rating', data.rating.toString());
  }

  if (data.comment !== undefined) {
    formData.append('comment', data.comment);
  }

  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await api.put(`/reviews/${reviewId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data?.data || response.data;
};

export const updateReviewStatus = async (
  reviewId: string,
  status: ReviewStatus
): Promise<Review> => {
  const response = await api.patch(`/reviews/${reviewId}/status`, {
    status,
  });

  return response.data?.data || response.data;
};