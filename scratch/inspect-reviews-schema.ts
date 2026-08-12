import { supabaseAdmin } from "../src/lib/supabase-admin";

async function inspectReviewsSchema() {
  console.log("=== CHECKING REVIEWS DB TABLES ===");

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Reviews table error:", error.message);
  } else {
    console.log("Existing columns in 'reviews' table:");
    console.log(Object.keys(reviews[0] || {}));
  }

  // Check if review_media, review_likes, review_reports exist
  const { error: mediaErr } = await supabaseAdmin.from('review_media').select('id').limit(1);
  console.log("review_media table status:", mediaErr ? mediaErr.message : "Exists!");

  const { error: likesErr } = await supabaseAdmin.from('review_likes').select('id').limit(1);
  console.log("review_likes table status:", likesErr ? likesErr.message : "Exists!");

  const { error: reportsErr } = await supabaseAdmin.from('review_reports').select('id').limit(1);
  console.log("review_reports table status:", reportsErr ? reportsErr.message : "Exists!");
}

inspectReviewsSchema().catch(console.error);
