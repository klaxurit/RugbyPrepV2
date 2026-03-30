import '@testing-library/jest-dom/vitest'

// Provide dummy Supabase env vars so createClient doesn't crash in tests
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-placeholder-not-a-real-key'
}
