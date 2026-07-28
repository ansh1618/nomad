import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFooterSettingsDb() {
  console.log("Updating site_settings in Supabase...");

  // Update site_settings table
  try {
    const { data: rows } = await supabase.from("site_settings").select("id");
    if (rows && rows.length > 0) {
      for (const row of rows) {
        await supabase.from("site_settings").update({
          support_phone: "+91 7982850767",
          support_phone_2: "+91 7678596453",
          footer_copyright: "© 2026 The Nomadik Traveller. All rights reserved."
        }).eq("id", row.id);
      }
      console.log("✓ Updated site_settings table records successfully!");
    } else {
      console.log("No existing rows in site_settings, inserting default row...");
      await supabase.from("site_settings").insert({
        company_name: "The Nomadik Traveller",
        support_phone: "+91 7982850767",
        support_phone_2: "+91 7678596453",
        support_email: "support.nomadik@gmail.com",
        footer_copyright: "© 2026 The Nomadik Traveller. All rights reserved."
      });
      console.log("✓ Inserted site_settings row!");
    }
  } catch (err: any) {
    console.warn("site_settings error:", err.message);
  }

  // Also update settings key-value table
  try {
    await supabase.from("settings").update({ value: '"+91 7982850767"' }).eq("key", "contact_phone_primary");
    await supabase.from("settings").update({ value: '"+91 7678596453"' }).eq("key", "contact_phone_secondary");
    await supabase.from("settings").update({ value: '"© 2026 The Nomadik Traveller. All rights reserved."' }).eq("key", "footer_copyright");
    console.log("✓ Updated settings table key-values!");
  } catch (err: any) {
    console.warn("settings error:", err.message);
  }

  console.log("Database update completed!");
}

updateFooterSettingsDb().catch(console.error);
