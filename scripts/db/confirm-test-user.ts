// Auto-confirm test user via Supabase admin API
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
    // List users
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) {
        console.error("Failed to list users:", listErr.message)
        // Try creating a pre-confirmed user instead
        console.log("\nAttempting to create pre-confirmed user...")
        const { data, error } = await supabase.auth.admin.createUser({
            email: "dev@modelforge.test",
            password: "TestDev123!",
            email_confirm: true,
            user_metadata: { name: "Dev User" }
        })
        if (error) {
            console.error("Create failed:", error.message)
        } else {
            console.log("✅ Created confirmed user:", data.user?.email, data.user?.id)
        }
        return
    }

    console.log(`Found ${users.length} users:`)
    for (const u of users) {
        console.log(`  - ${u.email} (confirmed: ${!!u.email_confirmed_at}, id: ${u.id})`)

        // Auto-confirm unconfirmed users
        if (!u.email_confirmed_at) {
            console.log(`    → Auto-confirming ${u.email}...`)
            const { error } = await supabase.auth.admin.updateUserById(u.id, {
                email_confirm: true
            })
            if (error) {
                console.error(`    ❌ Failed: ${error.message}`)
            } else {
                console.log(`    ✅ Confirmed!`)
            }
        }
    }

    // Also create a dev user if none exist
    const devExists = users.some(u => u.email === "dev@modelforge.test")
    if (!devExists) {
        console.log("\nCreating dev@modelforge.test...")
        const { data, error } = await supabase.auth.admin.createUser({
            email: "dev@modelforge.test",
            password: "TestDev123!",
            email_confirm: true,
            user_metadata: { name: "Dev User" }
        })
        if (error) console.error("Create failed:", error.message)
        else console.log("✅ Created:", data.user?.email)
    }
}

main().catch(console.error)
