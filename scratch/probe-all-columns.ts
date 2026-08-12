import { supabaseAdmin } from "../src/lib/supabase-admin";

async function probeAllColumns() {
  const possible = [
    "id", "user_id", "booking_id", "journey_id", "destination_id",
    "name", "author_name", "user_name", "user_email", "email",
    "avatar_url", "user_avatar", "photo_url", "title", "review",
    "comment", "content", "rating", "overall_rating", "hotel_rating",
    "transport_rating", "food_rating", "captain_rating", "safety_rating",
    "value_rating", "would_recommend", "recommend", "anonymous",
    "featured", "is_featured", "verified", "is_verified", "approved",
    "is_approved", "status", "likes_count", "college", "instagram_handle",
    "admin_reply", "created_at", "updated_at", "media", "photos", "videos", "trip_date"
  ];

  const found: string[] = [];
  for (const field of possible) {
    const { error } = await supabaseAdmin.from('reviews').select(field).limit(1);
    if (!error) {
      found.push(field);
    }
  }
  console.log("ALL EXISTING COLUMNS ON 'reviews':", found);
}

probeAllColumns().catch(console.error);
