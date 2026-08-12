import { supabaseAdmin } from "../src/lib/supabase-admin";

async function updateDestinationBranding() {
  console.log("=== UPDATING DESTINATION & JOURNEY HERO BANNERS & GALLERIES ===");

  const destinationUpdates = [
    {
      slug: "udaipur",
      hero_image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=2000&q=90",
      description: "Experience the City of Lakes in royal grandeur. Lake Pichola boat cruises, majestic City Palace, rooftop sunset dining, and historic ghats.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=1200&q=80", caption: "Lake Pichola & City Palace at Golden Hour" },
        { url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80", caption: "Jag Mandir Island Palace" },
        { url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80", caption: "Fateh Sagar Lake Sunset" },
        { url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80", caption: "Gangaur Ghat Evening Aarti" },
        { url: "https://images.unsplash.com/photo-1609828913642-c55f765c03c5?auto=format&fit=crop&w=1200&q=80", caption: "Sajjangarh Monsoon Palace Viewpoint" }
      ]
    },
    {
      slug: "manali",
      hero_image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=90",
      description: "Snow-covered peaks, Atal Tunnel road trip, Solang Valley adventure sports, and cozy wooden cafes in Old Manali.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80", caption: "Rohtang Pass & Solang Valley Snow Peaks" },
        { url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80", caption: "Atal Tunnel Highway Convoy" },
        { url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80", caption: "Old Manali Wooden Cafes & Pine Trails" }
      ]
    },
    {
      slug: "jibhi",
      hero_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90",
      description: "Rustic wooden treehouses, gushing mountain streams, Jalori Pass trek, and secret waterfalls in Tirthan Valley.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", caption: "Jibhi Valley Riverside Wooden Homestay" },
        { url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80", caption: "Jalori Pass & Serolsar Lake Trail" }
      ]
    },
    {
      slug: "mcleodganj",
      hero_image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=2000&q=90",
      description: "Dhauladhar mountain views, Dalai Lama Temple rituals, Bhagsu waterfall, and Triund ridge trekking.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80", caption: "Dhauladhar Snow Ranges from McLeod Ganj" },
        { url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80", caption: "Triund Trek Ridge Camp" }
      ]
    },
    {
      slug: "chopta-tungnath",
      hero_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90",
      description: "Mini Switzerland of India. World's highest Shiva temple trek at Tungnath & 360-degree Himalayan views from Chandrashila Summit.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", caption: "Tungnath Temple & Chandrashila Peak" }
      ]
    }
  ];

  for (const item of destinationUpdates) {
    const { error } = await supabaseAdmin
      .from("destinations")
      .update({
        hero_image: item.hero_image,
        description: item.description,
        gallery: item.gallery
      })
      .eq("slug", item.slug);

    if (error) console.error(`Error updating destination ${item.slug}:`, error.message);
    else console.log(`✓ Updated destination ${item.slug} with authentic hero & gallery`);
  }

  // Update Journeys hero banners to match their specific destination
  const journeyUpdates = [
    { slug: "udaipur-weekend", hero_banner: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=2000&q=90" },
    { slug: "manali-weekend", hero_banner: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=90" },
    { slug: "manali-quick", hero_banner: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=2000&q=90" },
    { slug: "jibhi-retreat", hero_banner: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90" },
    { slug: "mcleodganj-dharamshala", hero_banner: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=2000&q=90" },
    { slug: "chopta-tungnath-trek", hero_banner: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90" }
  ];

  for (const j of journeyUpdates) {
    const { error } = await supabaseAdmin
      .from("journeys")
      .update({ hero_banner: j.hero_banner })
      .eq("slug", j.slug);

    if (error) console.error(`Error updating journey ${j.slug}:`, error.message);
    else console.log(`✓ Updated journey ${j.slug} hero_banner`);
  }

  console.log("=== DESTINATION & JOURNEY BRANDING UPDATE COMPLETE ===");
}

updateDestinationBranding().catch(console.error);
