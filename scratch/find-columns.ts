import { supabaseAdmin } from "../src/lib/supabase-admin";

async function findColumns() {
  const testCols = [
    'id', 'booking_id', 'journey_id', 'destination_id', 'user_id',
    'title', 'review', 'rating', 'overall_rating', 'hotel_rating',
    'transport_rating', 'food_rating', 'captain_rating', 'safety_rating',
    'value_rating', 'would_recommend', 'anonymous', 'featured', 'is_featured',
    'verified', 'is_approved', 'status', 'likes_count', 'college', 'instagram_handle',
    'admin_reply', 'created_at', 'updated_at'
  ];

  for (const col of testCols) {
    const { error } = await supabaseAdmin.from('reviews').select(col).limit(1);
    if (!error) {
      console.log(`Column EXISTS: ${col}`);
    } else {
      console.log(`Column NOT found: ${col}`);
    }
  }
}

findColumns().catch(console.error);
