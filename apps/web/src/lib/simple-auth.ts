// Simple JWT Authentication for Railway
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Server-side only imports
let Pool: any = null
if (typeof window === 'undefined') {
  Pool = require('pg').Pool
}

console.log('🚀 Initializing database connection...')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL)
console.log('Using:', process.env.DATABASE_PUBLIC_URL ? 'DATABASE_PUBLIC_URL' : 'DATABASE_URL')

const db = Pool ? new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : null

// Test database connection (server-side only)
if (db) {
  db.on('connect', () => {
    console.log('✅ Database connected successfully')
  })

  db.on('error', (err) => {
    console.error('❌ Database connection error:', err)
  })
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key'

export interface User {
  id: string
  email: string
  full_name?: string
}

// Sign JWT token
export function signToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.name
    }
  } catch (error) {
    return null
  }
}

// Create user
export async function createUser(email: string, password: string, fullName?: string) {
  if (!db) throw new Error('Database not available')

  console.log('🔐 Creating user:', { email, fullName, hasPassword: !!password })
  console.log('🗃️ Database URL available:', !!process.env.DATABASE_URL)

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await db.query(
    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
    [email, hashedPassword, fullName]
  )

  return result.rows[0]
}

// Login user
export async function loginUser(email: string, password: string) {
  if (!db) throw new Error('Database not available')

  const result = await db.query(
    'SELECT id, email, full_name, password_hash FROM users WHERE email = $1',
    [email]
  )

  const user = result.rows[0]
  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name
  }
}

// Get user from request cookies
export function getUserFromCookies(cookies: string): User | null {
  try {
    const tokenMatch = cookies.match(/auth-token=([^;]+)/)
    if (!tokenMatch) return null

    return verifyToken(tokenMatch[1])
  } catch (error) {
    return null
  }
}

// Export db for other server-side modules
export { db }