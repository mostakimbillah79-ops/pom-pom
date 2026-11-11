import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfzjeqbqsvsutxldlgrl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmemplcWJxc3ZzdXR4bGRsZ3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzOTAxMDYsImV4cCI6MjEwOTk2NjEwNn0.bffkAX8hrdrqBDo2f0Mo-R1HolEnW45MPzBkuW01BCE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
