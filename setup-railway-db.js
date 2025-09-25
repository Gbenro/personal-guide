const { Pool } = require('pg')
const fs = require('fs')

const connectionString = "postgresql://postgres:BHTAPOEuFSosurZMFUAvqVsjNubOTdRa@shinkansen.proxy.rlwy.net:24068/railway"

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to Railway PostgreSQL...')

    // Read schema file
    const schema = fs.readFileSync('./railway-schema.sql', 'utf8')

    console.log('📋 Running schema migration...')
    await pool.query(schema)

    console.log('✅ Database schema created successfully!')
    console.log('🚀 Your Railway PostgreSQL is ready!')

  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
  } finally {
    await pool.end()
  }
}

setupDatabase()