console.log('=== Environment Variables Debug ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Working directory:', process.cwd());

// Try loading from .env.local directly
const fs = require('fs');
const path = require('path');

try {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  console.log('\n=== .env.local file found ===');
  console.log('Content preview:', envLocal.substring(0, 100) + '...');
} catch (error) {
  console.log('\n=== .env.local file NOT found ===');
  console.log('Error:', error.message);
}

// Check root directory too
try {
  const envLocal = fs.readFileSync('../.env.local', 'utf8');
  console.log('\n=== ../.env.local file found ===');
  console.log('Content preview:', envLocal.substring(0, 100) + '...');
} catch (error) {
  console.log('\n=== ../.env.local file NOT found ===');
  console.log('Error:', error.message);
}