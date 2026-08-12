// One-time (or as-needed) script to create login accounts in Supabase Auth.
//
// Usage:
//   1. Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
//      your local .env.local (never commit the service role key).
//   2. Edit the USERS array below with the accounts you want to create.
//   3. Run:  node --env-file=.env.local scripts/create-users.mjs
//      (Node 20.6+ / 22+ supports --env-file natively — no extra package needed.)
//
// Safe to re-run: existing emails are skipped, not duplicated.
// This is also how you add the 3rd staff login later — just add a row
// and run the script again.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local first.",
  );
  process.exit(1);
}

const USERS = [
  { email: "regie@example.com", password: "CHANGE-ME-1!", full_name: "Regie" },
  { email: "mariaandrea@example.com", password: "CHANGE-ME-2!", full_name: "Maria Andrea T." },
  // Add a 3rd staff login here later, e.g.:
  // { email: "staff@example.com", password: "CHANGE-ME-3!", full_name: "New Staff Name" },
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const user of USERS) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      console.log(`Skipped (already exists): ${user.email}`);
    } else {
      console.error(`Failed to create ${user.email}:`, error.message);
    }
    continue;
  }

  console.log(`Created: ${user.email} (id: ${data.user.id})`);
}

console.log("\nDone. The 'profiles' row for each user is created automatically by a database trigger.");
