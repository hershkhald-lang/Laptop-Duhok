/**
 * Laptop Duhok — إعدادات Supabase (مفتاح publishable آمن للواجهة الأمامية مع RLS)
 */
(function () {
  window.LD_CONFIG = {
    supabaseUrl: "https://rngrbopltkwcjjhoqmnb.supabase.co",
    supabaseKey:
      "sb_publishable_2e18-W-JD8L7RIWcLrGikw_2ykRh5Df",
  };

  if (typeof supabase !== "undefined" && window.LD_CONFIG.supabaseUrl && window.LD_CONFIG.supabaseKey) {
    window.ldSupabase = supabase.createClient(window.LD_CONFIG.supabaseUrl, window.LD_CONFIG.supabaseKey);
  }
})();
