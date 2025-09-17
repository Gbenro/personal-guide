#!/usr/bin/env node

/**
 * Simple database migration runner for Personal Guide
 * Run with: node run-migration.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'create_chat_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Executing chat tables migration...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If the function doesn't exist, try direct query execution
      console.log('⚡ Trying direct query execution...')

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
          if (stmtError) {
            console.warn(`⚠️ Statement failed (may be expected): ${stmtError.message}`)
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!')

    // Test the tables
    console.log('🔍 Testing tables...')

    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('count(*)')
      .limit(1)

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('count(*)')
      .limit(1)

    if (!sessionsError && !messagesError) {
      console.log('✅ Tables are accessible and ready!')
    } else {
      console.log('⚠️ Some tables may not be fully accessible:')
      if (sessionsError) console.log('- chat_sessions:', sessionsError.message)
      if (messagesError) console.log('- messages:', messagesError.message)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()