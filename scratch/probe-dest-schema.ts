import { supabase } from "../src/lib/supabase";

async function probe() {
  console.log("--- PROBING DESTINATIONS SCHEMA ---");
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .limit(1);

  if (error) {
    console.error("SELECT * Error:", error);
  } else if (data && data.length > 0) {
    console.log("Existing columns on destinations:", Object.keys(data[0]));
    console.log("Sample record:", data[0]);
  } else {
    console.log("No records found in destinations table.");
  }
}

probe().catch(console.error);
