/**
 * يحمّل تصنيفات ومنتجات المتجر من Supabase إن وُجدت؛ وإلا يبقى الكتالوج من products-catalog.js
 */
(function () {
  window.LD_SHOP_READY = Promise.resolve();

  if (!window.ldSupabase) return;

  window.LD_SHOP_READY = (async function () {
    var client = window.ldSupabase;
    var defCats = window.LD_SHOP_CATEGORIES ? window.LD_SHOP_CATEGORIES.slice() : [];
    var defProds = window.LD_SHOP_PRODUCTS ? window.LD_SHOP_PRODUCTS.slice() : [];

    try {
      var cr = await client
        .from("shop_categories")
        .select("id, slug, icon, name_ar, name_ckb, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (cr.error) throw cr.error;

      var pr = await client
        .from("shop_products")
        .select(
          "id, category_id, name_ar, name_ckb, desc_ar, desc_ckb, price, badge_ar, badge_ckb, image_url, sort_order"
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (pr.error) throw pr.error;

      var cats = cr.data || [];
      var rows = pr.data || [];

      if (!rows.length) {
        return;
      }

      var catById = {};
      cats.forEach(function (c) {
        catById[c.id] = c;
      });

      window.LD_SHOP_CATEGORIES = [
        { id: "all", icon: "grid", name_ar: "الكل", name_ckb: "هەموو" },
      ].concat(
        cats.map(function (c) {
          return {
            id: c.slug,
            icon: c.icon || "package",
            name_ar: c.name_ar || "",
            name_ckb: c.name_ckb || "",
          };
        })
      );

      window.LD_SHOP_PRODUCTS = rows.map(function (row) {
        var cat = catById[row.category_id];
        var slug = cat && cat.slug ? cat.slug : "accessories";
        return {
          id: row.id,
          category: slug,
          name_ar: row.name_ar || "",
          name_ckb: row.name_ckb || "",
          desc_ar: row.desc_ar || "",
          desc_ckb: row.desc_ckb || "",
          price: typeof row.price === "number" ? row.price : parseInt(String(row.price), 10) || 0,
          badge_ar: row.badge_ar || "",
          badge_ckb: row.badge_ckb || "",
          image_url: row.image_url || "",
        };
      });
    } catch (e) {
      window.LD_SHOP_CATEGORIES = defCats;
      window.LD_SHOP_PRODUCTS = defProds;
    }
  })();
})();
