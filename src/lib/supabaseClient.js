import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Crea un archivo .env (ver .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
