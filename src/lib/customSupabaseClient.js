import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rzlcwlmhhgmowibsmdhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bGN3bG1oaGdtb3dpYnNtZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjI1ODcsImV4cCI6MjA4OTE5ODU4N30.2k2ziDCrwt3DkbZdgBndolAPDkio-8ZnMY1VAbbWESE';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
