/**
 * Laptop Duhok — تحميل معرض الأعمال من Supabase (portfolio_items)
 */
(function () {
  var cachedRows = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function pick(row, ar, ckb) {
    var lang = window.LD_I18N ? window.LD_I18N.getLang() : "ar";
    if (lang === "ckb" && row[ckb]) return String(row[ckb]);
    return String(row[ar] || row[ckb] || "");
  }

  function tagClass(cat) {
    if (cat === "app") return "ph-app";
    if (cat === "brand") return "ph-brand";
    return "ph-web";
  }

  function specsHtml(row) {
    var lang = window.LD_I18N ? window.LD_I18N.getLang() : "ar";
    var raw =
      lang === "ckb"
        ? (row.specs_ckb || "").trim()
        : (row.specs_ar || "").trim();
    if (!raw) return "";
    var lines = raw.split(/\r?\n/).filter(function (l) {
      return l.trim().length;
    });
    if (!lines.length) return "";
    var li = lines
      .map(function (line) {
        return "<li>" + esc(line.trim()) + "</li>";
      })
      .join("");
    return '<ul class="portfolio-specs">' + li + "</ul>";
  }

  function buildCard(row) {
    var cat = row.category || "web";
    var title = pick(row, "title_ar", "title_ckb");
    var meta = pick(row, "meta_ar", "meta_ckb");
    var desc = pick(row, "description_ar", "description_ckb");
    var view =
      window.LD_I18N && window.LD_I18N.t
        ? window.LD_I18N.t(window.LD_I18N.getLang(), "portfolio.view")
        : "تفاصيل المشروع";
    var tagKey =
      cat === "app"
        ? "portfolio.tag_app"
        : cat === "brand"
          ? "portfolio.tag_brand"
          : "portfolio.tag_web";
    var tag =
      window.LD_I18N && window.LD_I18N.t
        ? window.LD_I18N.t(window.LD_I18N.getLang(), tagKey)
        : cat;
    var imgUrl = (row.image_url || "").trim();
    var media = imgUrl
      ? '<img class="portfolio-thumb-img" src="' +
        esc(imgUrl) +
        '" alt="" loading="lazy" width="400" height="240" />'
      : '<div class="portfolio-thumb ' +
        tagClass(cat) +
        '" role="img" aria-hidden="true"></div>';
    var specs = specsHtml(row);
    return (
      '<article class="portfolio-card" data-category="' +
      esc(cat) +
      '">' +
      '<div class="portfolio-card-media">' +
      media +
      "</div>" +
      '<div class="portfolio-card-body">' +
      '<span class="portfolio-tag">' +
      esc(tag) +
      "</span>" +
      '<h3 class="portfolio-card-title">' +
      esc(title) +
      "</h3>" +
      '<p class="portfolio-meta">' +
      esc(meta) +
      "</p>" +
      '<p class="portfolio-card-desc">' +
      esc(desc) +
      "</p>" +
      specs +
      '<a href="#contact" class="portfolio-link">' +
      esc(view) +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function renderFromCache() {
    var slider = document.getElementById("portfolio-slider");
    if (!slider || !cachedRows || !cachedRows.length) return;
    slider.innerHTML = cachedRows.map(buildCard).join("");
    if (window.LD_reinitPortfolio) window.LD_reinitPortfolio();
  }

  function load() {
    var client = window.ldSupabase;
    var slider = document.getElementById("portfolio-slider");
    if (!client || !slider) return;

    client
      .from("portfolio_items")
      .select(
        "id, sort_order, category, image_url, title_ar, title_ckb, meta_ar, meta_ckb, description_ar, description_ckb, specs_ar, specs_ckb, is_published"
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) {
          cachedRows = null;
          return;
        }
        cachedRows = res.data;
        renderFromCache();
      });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    if (window.LD_CMS_READY) {
      window.LD_CMS_READY.then(function () {
        if (window.LD_I18N) {
          load();
        } else {
          load();
        }
      }).catch(load);
    } else {
      load();
    }
  });

  document.addEventListener("ld-lang-change", function () {
    renderFromCache();
  });
})();
