import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qaidrwudydgcobkvpvam.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaWRyd3VkeWRnY29ia3ZwdmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzIxNDAsImV4cCI6MjA4NTgwODE0MH0.28EMOIsrSDnLAJx7jBmlpHYaaA8aUmxy5_zspXL9Hgk"

export const supabase = createClient(supabaseUrl, supabaseKey)
