/* =========================================
   STUDENT DIGITAL HUB
   SUPABASE CONFIGURATION
========================================= */

const SUPABASE_URL =
    "https://dmitfcqiowtvrbwptrjg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_55xS8ZOWqAPm6w29eEHLRQ__tcM5cLa";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
