
export interface User {
  id: string;
  created_at?: string;
  username: string;
  email: string;
  avatar_url?: string;
  stripe_customer_id?: string;
  stripe_product_id?: string;
  subscription_status?: 'active' | 'inactive';
  subscription_end_date?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  location_city?: string;
}

export interface Book {
  id: string;
  created_at: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  condition: string;
  cover_image_url: string;
  owner_id: string;
  is_available: boolean;
}

export interface ExchangeRequest {
  id: string;
  created_at: string;
  book_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  offered_book_id?: string;
}

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  related_id?: string;
}

export interface BookGenre {
  id: string;
  name: string;
  description?: string;
}

export interface UserRating {
  id: string;
  created_at: string;
  updated_at: string;
  rated_user_id: string;
  rater_user_id: string;
  rating: number;
  comment?: string;
}
