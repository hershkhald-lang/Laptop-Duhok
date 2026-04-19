/**
 * Laptop Duhok — تحميل نصوص CMS من Supabase قبل تهيئة i18n
 */
(function () {
  window.LD_CMS_STRINGS = {};
  window.LD_CMS_READY = new Promise(function (resolve) {
    var isResolved = false;
    function finish() {
      if (isResolved) return;
      isResolved = true;
      resolve();
    }
    setTimeout(finish, 2000); // 2 seconds timeout

    if (!window.ldSupabase) {
      finish();
      return;
    }
    window.ldSupabase
      .from("site_cms")
      .select("strings")
      .eq("id", 1)
      .maybeSingle()
      .then(function (res) {
        if (res.data && res.data.strings && typeof res.data.strings === "object") {
          window.LD_CMS_STRINGS = res.data.strings;
        }
        finish();
      })
      .catch(function () {
        finish();
      });
  });
})();
