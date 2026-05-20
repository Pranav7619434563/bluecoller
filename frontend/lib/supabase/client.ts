import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mock-client'

let mockClient: any = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes("your-project") || !key || key.includes("your-anon")) {
    if (!mockClient) {
      mockClient = createMockClient()
    }
    return mockClient
  }

  return createBrowserClient(url, key)
}
