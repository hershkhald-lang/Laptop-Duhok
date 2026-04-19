/**
 * شروحات فيديو نظام الكاشير — يوتيوب
 * يُحمّل من Supabase (cashier_videos) عند توفر العميل؛ وإلا يُستخدم النسخ الاحتياطي أدناه.
 */
(function () {
  var FALLBACK = [
    {
      youtube_id: "M7lc1UVf-VE",
      title_ar: "مقدمة — واجهة الكاشير",
      title_ckb: "مقدمة — واجهة الكاشير",
      description_ar: "جولة سريعة في الشاشة الرئيسية وأهم الأزرار قبل البدء بالبيع.",
      description_ckb: "جولة سريعة في الشاشة الرئيسية وأهم الأزرار قبل البدء بالبيع.",
      category: "basics",
      duration: "مثال",
      sort_order: 0,
    },
    {
      youtube_id: "M7lc1UVf-VE",
      title_ar: "تسجيل عملية بيع",
      title_ckb: "تسجيل عملية بيع",
      description_ar: "إضافة أصناف، خصومات، وإتمام الدفع خطوة بخطوة.",
      description_ckb: "إضافة أصناف، خصومات، وإتمام الدفع خطوة بخطوة.",
      category: "sales",
      duration: "مثال",
      sort_order: 1,
    },
    {
      youtube_id: "M7lc1UVf-VE",
      title_ar: "تقرير يومي ومخزون",
      title_ckb: "تقرير يومي ومخزون",
      description_ar: "قراءة الملخص اليومي والتحقق من الأرصدة بسرعة.",
      description_ckb: "قراءة الملخص اليومي والتحقق من الأرصدة بسرعة.",
      category: "reports",
      duration: "مثال",
      sort_order: 2,
    },
  ];

  var CATEGORY_LABELS = {
    all: "الكل",
    basics: "البداية",
    sales: "المبيعات",
    reports: "التقارير",
    settings: "الإعدادات",
    hardware: "الأجهزة",
  };

  /** @type {any[]} */
  var sourceRows = [];
  var usedDatabase = false;
  var host;
  var modal;
  var iframe;

  function currentLang() {
    var l = document.documentElement.lang;
    if (l === "ckb") return "ckb";
    if (l === "bad") return "bad";
    return "ar";
  }

  function pickTitle(row) {
    var lang = currentLang();
    if (lang === "ckb" && (row.title_ckb || "").trim()) return row.title_ckb.trim();
    if (lang === "bad" && (row.title_bad || row.title_ckb || "").trim()) return (row.title_bad || row.title_ckb).trim();
    return (row.title_ar || row.title_ckb || row.title_bad || "").trim() || "—";
  }

  function pickDesc(row) {
    var lang = currentLang();
    if (lang === "ckb" && (row.description_ckb || "").trim()) return row.description_ckb.trim();
    if (lang === "bad" && (row.description_bad || row.description_ckb || "").trim()) return (row.description_bad || row.description_ckb).trim();
    return (row.description_ar || row.description_ckb || row.description_bad || "").trim() || "";
  }

  function thumbUrl(id) {
    return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
  }

  function watchUrl(id) {
    return "https://www.youtube.com/watch?v=" + id;
  }

  function embedUrl(id) {
    if (window.LD_buildYoutubeEmbedUrl) {
      var u = window.LD_buildYoutubeEmbedUrl(id);
      if (u) return u;
    }
    var clean = ytId(id);
    if (!clean) return "";
    return "https://www.youtube.com/embed/" + encodeURIComponent(clean) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1";
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function ytId(raw) {
    if (window.LD_extractYoutubeVideoId) return window.LD_extractYoutubeVideoId(raw) || "";
    var s = (raw == null ? "" : String(raw)).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    var m = s.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  function normalizeRows(rows) {
    var sorted = (rows || []).slice().sort(function (a, b) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
    sorted.forEach(function (r, i) {
      r._ytClean = ytId(r.youtube_id);
      r._episodeNum = i + 1;
    });
    return sorted;
  }

  function loadFromSupabase() {
    var client = window.ldSupabase;
    if (!client) {
      sourceRows = normalizeRows(FALLBACK);
      usedDatabase = false;
      return Promise.resolve();
    }
    return client
      .from("cashier_videos")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) {
          sourceRows = normalizeRows(FALLBACK);
          usedDatabase = false;
        } else {
          sourceRows = normalizeRows(res.data);
          usedDatabase = true;
        }
      })
      .catch(function () {
        sourceRows = normalizeRows(FALLBACK);
        usedDatabase = false;
      });
  }

  function renderEpisodes(filterCat) {
    if (!host) return;
    var list = sourceRows.filter(function (ep) {
      return filterCat === "all" || ep.category === filterCat;
    });
    var countEl = document.getElementById("ct-count-ep");
    if (countEl) countEl.textContent = String(sourceRows.length);

    if (!list.length) {
      var emptyMsg;
      if (!sourceRows.length) {
        emptyMsg = 'لا توجد فيديوهات حالياً.';
      } else {
        emptyMsg = "لا توجد حلقات في هذا التصنيف — جرّب «الكل» أو أضف حلقة بهذا التصنيف من الإدارة.";
      }
      host.innerHTML = '<p class="ct-empty">' + emptyMsg + "</p>";
      return;
    }

    var html = "";
    var shown = 0;
    list.forEach(function (ep) {
      var yid = ep._ytClean || ytId(ep.youtube_id);
      if (!yid) return;
      shown++;
      var title = pickTitle(ep);
      var desc = pickDesc(ep);
      var idx = shown;
      var catLabel = CATEGORY_LABELS[ep.category] || ep.category;
      html +=
        '<article class="ct-card" data-youtube-id="' +
        esc(yid) +
        '">' +
        '<button type="button" class="ct-card__open" aria-label="تشغيل: ' +
        esc(title) +
        '">' +
        '<div class="ct-card__media">' +
        '<img src="' +
        esc(thumbUrl(yid)) +
        '" alt="" class="ct-card__thumb" loading="lazy" width="480" height="360" />' +
        '<span class="ct-card__shade" aria-hidden="true"></span>' +
        '<span class="ct-card__play" aria-hidden="true">' +
        '<svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        "</span>" +
        (ep.duration
          ? '<span class="ct-card__duration">' + esc(ep.duration) + "</span>"
          : "") +
        "</div>" +
        '<div class="ct-card__body">' +
        '<span class="ct-card__ep">حلقة ' +
        idx +
        '</span>' +
        '<span class="ct-card__cat">' +
        esc(catLabel) +
        "</span>" +
        '<h3 class="ct-card__title">' +
        esc(title) +
        "</h3>" +
        '<p class="ct-card__desc">' +
        esc(desc) +
        "</p>" +
        '<div class="ct-card__actions">' +
        '<span class="ct-card__cta">تشغيل</span>' +
        '<a class="ct-card__link" href="' +
        esc(watchUrl(yid)) +
        '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">يوتيوب</a>' +
        "</div>" +
        "</div>" +
        "</button>" +
        "</article>";
    });
    host.innerHTML = html;

    host.querySelectorAll(".ct-card__open").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".ct-card");
        var id = card && card.getAttribute("data-youtube-id");
        if (id) openModal(id);
      });
    });
  }

  function openModal(youtubeId) {
    if (!modal || !iframe) return;
    var clean = ytId(youtubeId);
    if (!clean) return;
    var url = embedUrl(clean);
    if (!url) return;
    iframe.src = url;
    var ytLink = document.getElementById("ct-modal-yt-link");
    if (ytLink) ytLink.href = watchUrl(clean);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".ct-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal || !iframe) return;
    iframe.src = "about:blank";
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function bindFilters() {
    document.querySelectorAll(".ct-filter .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var cat = chip.getAttribute("data-ct-cat") || "all";
        document.querySelectorAll(".ct-filter .chip").forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
        });
        renderEpisodes(cat);
      });
    });
  }

  function bindModal() {
    if (!modal) return;
    modal.querySelectorAll("[data-ct-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) closeModal();
    });
  }

  function start() {
    host = document.getElementById("ct-episodes");
    modal = document.getElementById("ct-modal");
    iframe = document.getElementById("ct-modal-iframe");
    if (!host) return;

    bindFilters();
    bindModal();

    loadFromSupabase().then(function () {
      renderEpisodes("all");
    });

    document.addEventListener("ld-lang-change", function () {
      var active = document.querySelector(".ct-filter .chip.is-active");
      var cat = active ? active.getAttribute("data-ct-cat") || "all" : "all";
      renderEpisodes(cat);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
