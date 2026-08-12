import { supabaseAdmin } from "../src/lib/supabase-admin";

async function inspectStoriesSchema() {
  console.log("=== INSPECTING STORIES TABLE SCHEMA & CREATING SEED DATA ===");

  // Check columns of stories table
  const { data: sample, error } = await supabaseAdmin.from('stories').select('*').limit(1);
  if (error) {
    console.error("Select error:", error.message);
  } else {
    console.log("Stories table exists!");
  }

  // Insert seed authentic stories for Nomadik
  const seedStories = [
    {
      title: "Chopta & Tungnath Trek: Standing Above the Clouds at 12,000 Feet",
      slug: "chopta-tungnath-trek-above-the-clouds",
      excerpt: "A magical winter expedition to the world's highest Shiva temple. From snowy pine forests in Chopta to breathtaking views of Nanda Devi at Chandrashila summit.",
      content: `# Chopta & Tungnath Trek: Standing Above the Clouds\n\nTrekking to Tungnath in peak winter is an unforgettable experience. The trail starts from Chopta, wrapped in dense rhododendron and pine forests covered under a blanket of pristine snow.\n\n## Reaching the Highest Shiva Temple\nAs we ascended towards 12,070 feet, the majestic stone architecture of Tungnath Temple emerged amidst towering Himalayan snow walls. The ancient energy and panoramic views of Kedarnath, Chaukhamba, and Trishul peaks were simply ethereal.`,
      cover_image: "/images/destinations/chopta-tungnath-snow.jpg",
      category: "Adventure",
      author_name: "Aarav Sharma",
      author_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      college_name: "IIT Delhi",
      reading_time: 4,
      views: 1420,
      likes_count: 184,
      rating: 4.9,
      is_published: true,
      is_featured: true,
      published_at: new Date().toISOString()
    },
    {
      title: "Royal Weekend in Udaipur: Lakes, Palaces & Rooftop Evenings",
      slug: "royal-weekend-in-udaipur",
      excerpt: "Exploring the City of Lakes with fellow travelers. From sunset boat rides on Lake Pichola to night walks through historic alleys of Mewar.",
      content: `# Royal Weekend in Udaipur\n\nUdaipur warmly embraces every traveler with its royal heritage and romantic lake views. Our weekend getaway began with a sunset boat ride past Lake Palace and Jag Mandir.\n\n## Evening at Gangaur Ghat\nWatching the city light up during evening Aarti at Gangaur Ghat while sipping hot Kulhad Chai with Nomadik explorers was the highlight of our journey.`,
      cover_image: "/images/destinations/udaipur-lake-pichola.jpg",
      category: "Weekend",
      author_name: "Ananya Roy",
      author_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
      college_name: "DU Hansraj",
      reading_time: 3,
      views: 980,
      likes_count: 126,
      rating: 4.8,
      is_published: true,
      is_featured: false,
      published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      title: "Manali Road Trip & Solang Valley Snow Convoy Experience",
      slug: "manali-road-trip-solang-valley-convoy",
      excerpt: "Driving through Atal Tunnel under snow-capped peaks. Bonfire nights, live acoustic music, and Solang Valley adventures.",
      content: `# Manali Road Trip & Solang Valley Snow Convoy\n\nThere is nothing quite like driving up to Atal Tunnel with a convoy of passionate travelers. Crossing into Lahaul Valley felt like entering a different world entirely.`,
      cover_image: "/images/destinations/manali-atal-tunnel.jpg",
      category: "Group",
      author_name: "Rohan Verma",
      author_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      college_name: "BITS Pilani",
      reading_time: 5,
      views: 2150,
      likes_count: 240,
      rating: 5.0,
      is_published: true,
      is_featured: false,
      published_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      title: "Tibetan Monastery Walks & Triund Ridge: A McLeod Ganj Journal",
      slug: "tibetan-monastery-walks-mcleodganj",
      excerpt: "Immersing in peaceful Buddhist chants, cafe hopping in Dharamshala, and sleeping under starlit skies at Triund Top.",
      content: `# A McLeod Ganj Travel Journal\n\nMcLeod Ganj offers a serene blend of spirituality and mountain solitude. Waking up to prayer flags fluttering against the Dhauladhar ranges is pure peace.`,
      cover_image: "/images/destinations/mcleodganj-town-view.jpg",
      category: "Spiritual",
      author_name: "Sneha Patel",
      author_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
      college_name: "St. Xavier's Mumbai",
      reading_time: 4,
      views: 1120,
      likes_count: 155,
      rating: 4.9,
      is_published: true,
      is_featured: false,
      published_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  for (const s of seedStories) {
    const { error: insErr } = await supabaseAdmin.from('stories').upsert(s, { onConflict: 'slug' });
    if (insErr) console.error(`Error inserting seed story '${s.slug}':`, insErr.message);
    else console.log(`✓ Inserted/Updated seed story: ${s.title}`);
  }

  console.log("=== STORIES SEED COMPLETE ===");
}

inspectStoriesSchema().catch(console.error);
