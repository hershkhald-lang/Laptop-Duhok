/**
 * Laptop Duhok — محرر محتوى الموقع (site_cms)
 */
(function () {
  var client = window.ldSupabase;
  var mounted = false;
  var fieldMap = {};

  function $(id) {
    return document.getElementById(id);
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  /** أيقونات بسيطة لكل مجموعة (تمييز بصري دون الاعتماد على النص فقط) */
  var GROUP_ICONS = {
    seo:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    nav:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    header:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
    hero:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg>',
    stats:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 20V10M12 20V4M20 20v-6"/></svg>',
    services:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    process:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>',
    portfolio:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    pricing:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    about:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    faq:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>',
    contact:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>',
    footer:
      '<svg class="cms-group-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  };

  function groupIconHtml(gid) {
    return GROUP_ICONS[gid] || GROUP_ICONS.seo;
  }

  function buildForm() {
    var root = $("cms-form-root");
    if (!root || !window.LD_CMS_KEY_LIST) return;
    var groups = {};
    window.LD_CMS_KEY_LIST.forEach(function (row) {
      var key = row[0];
      var gid = row[1];
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push({ key: key, label: row[2] });
    });

    var labels = window.LD_CMS_GROUP_LABELS || {};
    var html = "";
    Object.keys(groups).forEach(function (gid) {
      var title = labels[gid] || gid;
      html +=
        '<details class="cms-group" data-cms-group="' +
        escapeAttr(gid) +
        '" open><summary class="cms-group-title">' +
        groupIconHtml(gid) +
        '<span class="cms-group-title-text">' +
        escapeAttr(title) +
        "</span></summary>";
      groups[gid].forEach(function (item) {
        var safeKey = item.key.replace(/[^a-zA-Z0-9._-]/g, "_");
        html +=
          '<div class="cms-field" data-key="' +
          escapeAttr(item.key) +
          '">' +
          '<span class="cms-field-label">' +
          escapeAttr(item.label) +
          ' <code class="cms-key-hint">' +
          escapeAttr(item.key) +
          "</code></span>" +
          '<div class="cms-lang-grid">' +
          '<label><span>العربية</span><textarea class="cms-ta" data-lang="ar" rows="2"></textarea></label>' +
          '<label><span>کوردی</span><textarea class="cms-ta" data-lang="ckb" rows="2"></textarea></label>' +
          "</div></div>";
      });
      html += "</details>";
    });
    root.innerHTML = html;

    root.querySelectorAll(".cms-field").forEach(function (wrap) {
      var key = wrap.getAttribute("data-key");
      fieldMap[key] = {
        ar: wrap.querySelector('.cms-ta[data-lang="ar"]'),
        ckb: wrap.querySelector('.cms-ta[data-lang="ckb"]'),
      };
    });
  }

  function fillFromObject(strings) {
    if (!strings || typeof strings !== "object") return;
    Object.keys(fieldMap).forEach(function (key) {
      var o = strings[key];
      var f = fieldMap[key];
      if (!f || !f.ar || !f.ckb) return;
      if (o && typeof o === "object") {
        f.ar.value = o.ar != null ? String(o.ar) : "";
        f.ckb.value = o.ckb != null ? String(o.ckb) : "";
      } else {
        f.ar.value = "";
        f.ckb.value = "";
      }
    });
    var raw = $("cms-json-raw");
    if (raw) {
      try {
        raw.value = JSON.stringify(strings, null, 2);
      } catch (e) {
        raw.value = "";
      }
    }
  }

  function collectStringsFromForm() {
    var out = {};
    Object.keys(fieldMap).forEach(function (key) {
      var f = fieldMap[key];
      var a = (f.ar.value || "").trim();
      var c = (f.ckb.value || "").trim();
      if (!a && !c) {
        out[key] = null;
      } else {
        out[key] = { ar: a, ckb: c };
      }
    });
    return out;
  }

  function mergeStrings(base, delta) {
    var merged = {};
    if (base && typeof base === "object") {
      Object.keys(base).forEach(function (k) {
        merged[k] = base[k];
      });
    }
    Object.keys(delta).forEach(function (k) {
      if (delta[k] === null) {
        delete merged[k];
      } else {
        merged[k] = delta[k];
      }
    });
    return merged;
  }

  function setMsg(text, cls) {
    var el = $("cms-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "admin-msg " + (cls || "");
  }

  function loadCms() {
    if (!client) {
      setMsg("عميل Supabase غير متوفر.", "is-error");
      return;
    }
    setMsg("جاري التحميل…", "is-info");
    client
      .from("site_cms")
      .select("strings")
      .eq("id", 1)
      .maybeSingle()
      .then(function (res) {
        if (res.error) {
          setMsg(res.error.message || "خطأ في القراءة", "is-error");
          return;
        }
        var str = (res.data && res.data.strings) || {};
        fillFromObject(str);
        setMsg("", "");
      });
  }

  function saveCms() {
    if (!client) return;
    var delta = collectStringsFromForm();
    var btn = $("btn-cms-save");
    if (btn) btn.disabled = true;
    setMsg("جاري الحفظ…", "is-info");
    client
      .from("site_cms")
      .select("strings")
      .eq("id", 1)
      .maybeSingle()
      .then(function (prev) {
        if (prev.error) throw new Error(prev.error.message || "قراءة");
        var base = (prev.data && prev.data.strings) || {};
        var strings = mergeStrings(base, delta);
        return client.from("site_cms").upsert(
          {
            id: 1,
            strings: strings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      })
      .then(function (up) {
        if (btn) btn.disabled = false;
        if (up && up.error) {
          setMsg(up.error.message || "فشل الحفظ", "is-error");
          return;
        }
        setMsg("تم الحفظ. حدّث الصفحة الرئيسية لرؤية التغييرات.", "is-success");
      })
      .catch(function (e) {
        if (btn) btn.disabled = false;
        setMsg(e && e.message ? e.message : "خطأ في الحفظ.", "is-error");
      });
  }

  function applyJsonRaw() {
    var raw = $("cms-json-raw");
    if (!raw || !raw.value.trim()) return;
    try {
      var obj = JSON.parse(raw.value);
      if (typeof obj !== "object" || obj === null) throw new Error("ليس كائناً");
      fillFromObject(obj);
      setMsg("تم تطبيق JSON على الحقول (لم يُحفظ بعد في القاعدة).", "is-info");
    } catch (e) {
      setMsg("JSON غير صالح: " + (e.message || ""), "is-error");
    }
  }

  window.LD_CMS_tryInit = function () {
    if (mounted) {
      loadCms();
      return;
    }
    mounted = true;
    buildForm();
    loadCms();
    var saveBtn = $("btn-cms-save");
    if (saveBtn) saveBtn.addEventListener("click", saveCms);
    var applyBtn = $("btn-cms-apply-json");
    if (applyBtn) applyBtn.addEventListener("click", applyJsonRaw);
  };
})();
