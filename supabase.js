// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://oimidjxvheebxeyspcrw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_1KT7e01fdf7ItXjTGAdFnw_91WFwb9Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)