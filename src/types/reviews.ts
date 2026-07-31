export type ReviewStatus = 'pending' | 'ai_flagged' | 'spam' | 'reported' | 'approved' | 'rejected';
export type MediaType = 'image' | 'video';

export interface ReviewMedia {
  id: string;
  review_id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  caption?: string;
  created_at: string;
}

export type TrustBadgeType = 
  | 'verified_traveler'
  | 'photo_review'
  | 'video_review'
  | 'solo_traveler'
  | 'group_traveler'
  | 'repeat_traveler'
  | 'campus_ambassador'
  | 'top_reviewer';

export type GamificationBadge = 
  | 'first_trip'
  | 'explorer'
  | 'mountain_lover'
  | 'weekend_warrior'
  | 'nomadik_legend';

export type ReplyRole = 'Nomadik Team' | 'Trip Captain' | 'Operations Team' | 'Support Specialist';

export interface ReviewReply {
  id: string;
  review_id: string;
  author_name: string;
  role: ReplyRole;
  avatar_url?: string;
  reply_text: string;
  created_at: string;
}

export interface HotelRatingBreakdown {
  cleanliness: number;
  food: number;
  location: number;
  staff: number;
}

export interface TransportRatingBreakdown {
  comfort: number;
  ac: number;
  cleanliness: number;
  driver: number;
  music: number;
  charging: number;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // 0 to 100
  positive_keywords: string[];
  negative_keywords: string[];
  is_spam: boolean;
  spam_reasons?: string[];
}

export interface Review {
  id: string;
  booking_id?: string | null;
  journey_id?: string | null;
  destination_id?: string | null;
  user_id?: string | null;

  // Author details
  author_name: string;
  avatar_url?: string | null;
  college?: string | null;
  instagram_handle?: string | null;

  // Review Content & Ratings
  title?: string | null;
  review?: string | null;
  content?: string | null; // Backward compatibility

  overall_rating: number;
  hotel_rating?: number | null;
  transport_rating?: number | null;
  food_rating?: number | null;
  captain_rating?: number | null;
  safety_rating?: number | null;
  value_rating?: number | null;

  // Granular Hotel & Transport Breakdowns
  hotel_specs?: HotelRatingBreakdown;
  transport_specs?: TransportRatingBreakdown;

  would_recommend?: boolean | null;
  anonymous?: boolean | null;
  featured?: boolean | null;
  is_featured?: boolean | null;
  verified?: boolean | null;
  is_verified?: boolean | null;

  helpful_count: number;
  likes_count?: number;
  reports_count?: number;

  status: ReviewStatus;
  is_approved?: boolean;

  // Multi-role Replies
  replies?: ReviewReply[];
  admin_reply?: string | null;
  admin_replied_at?: string | null;

  // AI Sentiment & Spam
  sentiment?: SentimentAnalysis;

  // Metadata
  trip_date?: string | null;
  created_at: string;
  updated_at?: string;

  // Attached media & journey metadata
  media?: ReviewMedia[];
  badges?: TrustBadgeType[];
  achievement_badges?: GamificationBadge[];
  journey_name?: string;
  destination_name?: string;
  journey_slug?: string;
  xp_earned?: number;
}

export interface ReviewRatingStats {
  average: number;
  total_reviews: number;
  verified_trips_count: number;
  recommendation_rate: number; // percentage e.g. 98%
  solo_safety_rate: number; // percentage e.g. 97%
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  aspects: {
    hotel: number;
    transport: number;
    food: number;
    captain: number;
    safety: number;
    value: number;
  };
}

export interface AISummaryData {
  overall_sentiment: string;
  loved_aspects: string[];
  most_mentioned_keywords: string[];
  summary_paragraph: string;
}

export interface CaptainLeaderboardItem {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  trips_count: number;
  top_compliment: string;
}

export interface DestinationLeaderboardItem {
  rank: number;
  name: string;
  slug: string;
  rating: number;
  reviews_count: number;
  cover_image: string;
}

export interface SubmitReviewInput {
  booking_id?: string;
  journey_id: string;
  destination_id?: string;
  user_id?: string;
  author_name: string;
  avatar_url?: string;
  college?: string;
  instagram_handle?: string;

  title: string;
  review: string;

  overall_rating: number;
  hotel_rating?: number;
  transport_rating?: number;
  food_rating?: number;
  captain_rating?: number;
  safety_rating?: number;
  value_rating?: number;

  hotel_specs?: HotelRatingBreakdown;
  transport_specs?: TransportRatingBreakdown;

  would_recommend?: boolean;
  anonymous?: boolean;
  
  media_files?: { type: MediaType; url: string; thumbnail?: string }[];
}

export interface ReviewFilterState {
  sort: 'newest' | 'highest' | 'lowest' | 'featured' | 'with_media' | 'verified';
  rating_filter: number | null;
  college_filter: string | null; // e.g. 'NSUT', 'DTU', 'IIT Delhi', 'DU'
  media_only: boolean;
  verified_only: boolean;
  search_query: string;
}
