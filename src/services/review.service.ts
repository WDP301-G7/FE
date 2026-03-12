import { api } from '@/lib/api';

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  orderId?: string;
  // optional nested objects if API returns them
  product?: { id: string; name?: string };
  customer?: { id: string; fullName?: string };
  order?: { id: string; orderNumber?: string };
  rating: number;
  comment?: string;
  reply?: string; // response from staff
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  status?: string;
  productId?: string;
  customerId?: string;
  rating?: number;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
}

class ReviewService {
  async getReviews(params?: ReviewFilters) {
    const response = await api.get<{
      data: Review[];
      pagination?: ReviewPagination;
    }>('/reviews', { params });

    return response.data;
  }

  async getReview(id: string) {
    const response = await api.get<{ data: Review }>(`/reviews/${id}`);
    return response.data.data;
  }

  async updateReviewStatus(id: string, status: string) {
    const response = await api.patch<{ data: Review }>(`/reviews/${id}/status`, {
      status,
    });

    return response.data.data;
  }

  async deleteReview(id: string) {
    await api.delete(`/reviews/${id}`);
  }

  // Staff: reply to a review (new)
  async replyToReview(id: string, reply: string) {
    const response = await api.post<{ data: Review }>(`/reviews/${id}/reply`, {
      replyContent: reply,
    });
    return response.data.data;
  }

  // Staff: update existing reply
  async updateReviewReply(id: string, reply: string) {
    const response = await api.put<{ data: Review }>(`/reviews/${id}/reply`, {
      replyContent: reply,
    });
    return response.data.data;
  }
}

export const reviewService = new ReviewService();