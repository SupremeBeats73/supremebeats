import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rpdsusbghxytanfmjofb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZHN1c2JnaHh5dGFuZm1qb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzgwNDIsImV4cCI6MjA4ODUxNDA0Mn0.V_tkqwwAAabQlvIW4HN0xLWY2TgTq6i5kMvsS6MWNTw'

export const supabase = createClient(supabaseUrl, supabaseKey)

