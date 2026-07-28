import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDbPhoneNumbers() {
  console.log("Updating phone numbers in Supabase database...");

  // Update site_settings table if present
  try {
    const { data: existingSettings } = await supabase.from("site_settings").select("id").maybeSingle();
    if (existingSettings?.id) {
      await supabase.from("site_settings").update({
        support_phone: "+91 79828 50767",
        support_phone_2: "+91 76785 96453",
        whatsapp_number: "917982850767"
      }).eq("id", existingSettings.id);

      console.log("✓ Updated site_settings table in Supabase!");
    }
  } catch (err: any) {
    console.log("Notice: site_settings update info:", err.message);
  }

  // Update settings table if present
  try {
    await supabase.from("settings").update({ value: '"+91 79828 50767"' }).eq("key", "contact_phone_primary");
    await supabase.from("settings").update({ value: '"+91 76785 96453"' }).eq("key", "contact_phone_secondary");
    await supabase.from("settings").update({ value: '"+917982850767"' }).eq("key", "whatsapp_number");

    console.log("✓ Updated settings table in Supabase!");
  } catch (err: any) {
    console.log("Notice: settings update info:", err.message);
  }

  console.log("Database phone numbers migration complete!");
}

updateDbPhoneNumbers().catch(console.error);
