import { runStartupIntegrityCheck } from "../src/lib/integrity-checker";

async function testIntegrity() {
  console.log("=== RUNNING STARTUP INTEGRITY CHECKER ===");
  const report = await runStartupIntegrityCheck();
  console.log("Integrity Report:", JSON.stringify(report, null, 2));
}

testIntegrity().catch(console.error);
