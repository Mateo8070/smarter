
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gsbvvwbievhkslpxycjr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYnZ2d2JpZXZoa3NscHh5Y2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDA1NDgsImV4cCI6MjA3MDM3NjU0OH0.2H7lKMykxZwsNpAIAdD8gIbZ3xcH5D30OfP1cI6u4EA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
