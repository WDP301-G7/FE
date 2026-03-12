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
  staffId: string;
  staff?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface PaginatedReviews {
  items: Review[];
  total: number;
  page: number;
  limit: number;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  productId?: string;
  customerId?: string;
  rating?: number;
  sortBy?: 'createdAt' | 'rating' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
  populate?: string | string[]; // Populate relations (string or array)
}

export interface CreateReplyData {
  replyContent: string;
}

// ============ API FUNCTIONS ============

/**
 * Get paginated reviews with filters (ADMIN/OPERATION)
 * GET /api/reviews
 */
export const getReviews = async (params?: GetReviewsParams): Promise<PaginatedReviews> => {
  const response = await api.get('/reviews', { params });
  
  // Handle nested response structure
  const result = response.data?.data || response.data;
  
  // Backend returns {data: Review[], meta: {total, page, limit}}
  // Transform to {items, total, page, limit}
  if (result.data && result.meta) {
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }
  
  // Fallback if already in correct format
  return result;
};

/**
 * Get single review by ID (ADMIN/OPERATION)
 * GET /api/reviews/:id
 */
export const getReviewById = async (id: string): Promise<Review> => {
  // Populate customer, reply, and product relations
  const response = await api.get(`/reviews/${id}`, {
    params: { 
      populate: ['customer', 'reply', 'product'],
      includeReply: true 
    }
  });
  const result = response.data?.data || response.data;
  return result;
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
export const addReviewReply = async (reviewId: string, data: CreateReplyData): Promise<Review> => {
  const response = await api.post(`/reviews/${reviewId}/reply`, data);
  const result = response.data?.data || response.data;
  return result;
};

/**
 * Update existing reply (ADMIN/OPERATION)
 * PUT /api/reviews/:id/reply
 */
export const updateReviewReply = async (reviewId: string, data: CreateReplyData): Promise<Review> => {
  const response = await api.put(`/reviews/${reviewId}/reply`, data);
  const result = response.data?.data || response.data;
  return result;
};

/**
 * Delete reply (ADMIN/OPERATION)
 * DELETE /api/reviews/:id/reply
 */
export const deleteReviewReply = async (reviewId: string): Promise<void> => {
  const response = await api.delete(`/reviews/${reviewId}/reply`);
  return response.data?.data || response.data;
};

/**
 * Hide a review (ADMIN/OPERATION)
 * PATCH /api/reviews/:id/hide
 */
export const hideReview = async (reviewId: string): Promise<Review> => {
  const response = await api.patch(`/reviews/${reviewId}/hide`);
  return response.data?.data || response.data;
};

/**
 * Show a hidden review (ADMIN/OPERATION)
 * PATCH /api/reviews/:id/show
 */
export const showReview = async (reviewId: string): Promise<Review> => {
  const response = await api.patch(`/reviews/${reviewId}/show`);
  return response.data?.data || response.data;
};

/**
 * Delete a review permanently (ADMIN only)
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};

/**
 * Get reviews by product (PUBLIC)
 * GET /api/reviews/product/:productId
 */
export const getReviewsByProduct = async (
  productId: string, 
  params?: GetReviewsParams
): Promise<PaginatedReviews> => {
  const response = await api.get(`/reviews/product/${productId}`, { params });
  
  const result = response.data?.data || response.data;
  
  if (result.data && result.meta) {
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }
  
  return result;
};

/**
 * Get reviews by customer (CUSTOMER/ADMIN)
 * GET /api/reviews/customer/:customerId
 */
export const getReviewsByCustomer = async (
  customerId: string,
  params?: GetReviewsParams
): Promise<PaginatedReviews> => {
  const response = await api.get(`/reviews/customer/${customerId}`, { params });
  
  const result = response.data?.data || response.data;
  
  if (result.data && result.meta) {
    return {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }
  
  return result;
};

// ============ BUNDLED EXPORT (reviewService object) ============

export const reviewService = {
  getReviews,
  getReviewById,
  getReviewStats,
  addReviewReply,
  replyToReview: addReviewReply, // Alias for backward compatibility
  updateReviewReply,
  deleteReviewReply,
  hideReview,
  showReview,
  deleteReview,
  getReviewsByProduct,
  getReviewsByCustomer,
};
