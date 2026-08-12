import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testReviewInsert() {
  const { data, error } = await supabaseAdmin.from('reviews').insert({
    title: 'Test Review',
    review: 'This is a test review',
    rating: 5,
    author: 'Test User'
  }).select();

  console.log("Insert result:", data, error);
}

testReviewInsert().catch(console.error);
