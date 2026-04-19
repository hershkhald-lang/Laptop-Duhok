/**
 * Laptop Duhok — لوحة الإدارة (Supabase Auth + RLS)
 */
(function () {
  var client = window.ldSupabase;

  var STAT_LABELS = {
    digital_interactions: "الشريط الرقمي (التفاعلات)",
    stat_projects: "عدد المشاريع",
    stat_years: "سنوات الخبرة",
    stat_visits: "الزيارات",
    stat_clients: "العملاء",
  };

  /** أيقونات تطابق مكان الظهور في الصفحة الرئيسية */
  var STAT_ICONS = {
    digital_interactions:
      '<svg class="stat-field-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>',
    stat_projects:
      '<svg class="stat-field-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    stat_years:
      '<svg class="stat-field-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    stat_visits:
      '<svg class="stat-field-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    stat_clients:
      '<svg class="stat-field-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function showView(name) {
    var login = $("view-login");
    var dash = $("view-dashboard");
    if (!login || !dash) return;
    if (name === "login") {
      login.hidden = false;
      dash.hidden = true;
    } else {
      login.hidden = true;
      dash.hidden = false;
    }
  }

  function setMsg(el, type, text) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.remove("is-error", "is-success", "is-info");
    if (type) el.classList.add(type);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString("ar-IQ", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (_) {
      return iso;
    }
  }

  function renderMessages(rows) {
    var tbody = $("msg-tbody");
    var empty = $("msg-empty");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows || !rows.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var preview = (row.message || "").slice(0, 200);
      if ((row.message || "").length > 200) preview += "…";
      tr.innerHTML =
        "<td>" +
        formatDate(row.created_at) +
        "</td>" +
        "<td><strong>" +
        escapeHtml(row.name) +
        "</strong><div class=\"msg-meta\">" +
        escapeHtml(row.email || "—") +
        "</div></td>" +
        "<td><span class=\"msg-preview\">" +
        escapeHtml(preview) +
        "</span>" +
        "<div class=\"msg-full\">" +
        escapeHtml(row.message || "") +
        "</div></td>" +
        "<td>" +
        escapeHtml(row.locale || "ar") +
        "</td>" +
        "<td><button type=\"button\" class=\"btn btn-danger btn-sm\" data-del=\"" +
        row.id +
        "\">" +
        (window.LD_ADMIN_ICO && window.LD_ADMIN_ICO.trash
          ? window.LD_ADMIN_ICO.trash
          : "") +
        " حذف</button></td>";
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-del");
        if (!id || !confirm("حذف هذه الرسالة نهائياً؟")) return;
        deleteMessage(id);
      });
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function loadMessages() {
    if (!client) return;
    var loading = $("msg-loading");
    if (loading) loading.hidden = false;
    client
      .from("contact_messages")
      .select("id, created_at, name, email, message, locale")
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (loading) loading.hidden = true;
        if (res.error) {
          setMsg($("dash-error"), "is-error", res.error.message || "خطأ في تحميل الرسائل");
          return;
        }
        setMsg($("dash-error"), "", "");
        renderMessages(res.data || []);
      });
  }

  function deleteMessage(id) {
    if (!client) return;
    client
      .from("contact_messages")
      .delete()
      .eq("id", id)
      .then(function (res) {
        if (res.error) {
          alert(res.error.message || "فشل الحذف");
          return;
        }
        loadMessages();
      });
  }

  function renderStatsForm(rows) {
    var container = $("stats-fields");
    if (!container) return;
    container.innerHTML = "";
    var list = rows && rows.length ? rows : [];
    if (!list.length) {
      container.innerHTML = "<p class=\"empty-state\">لا توجد إحصائيات. شغّل schema.sql ثم أعد التحميل.</p>";
      return;
    }
    list.forEach(function (row) {
      var key = row.key;
      var label = STAT_LABELS[key] || key;
      var icon = STAT_ICONS[key] || STAT_ICONS.stat_projects;
      var wrap = document.createElement("div");
      wrap.className = "stat-field";
      wrap.innerHTML =
        "<label class=\"stat-field-inner\">" +
        "<span class=\"stat-field-visual\" aria-hidden=\"true\">" +
        icon +
        "</span>" +
        "<span class=\"stat-field-text\">" +
        "<span class=\"stat-label\">" +
        escapeHtml(label) +
        "</span>" +
        "<span class=\"stat-key\">" +
        escapeHtml(key) +
        "</span>" +
        "</span>" +
        "<input type=\"number\" min=\"0\" step=\"1\" name=\"" +
        escapeHtml(key) +
        "\" value=\"" +
        String(row.value) +
        "\" />" +
        "</label>";
      container.appendChild(wrap);
    });
  }

  function loadStats() {
    if (!client) return;
    client
      .from("site_stats")
      .select("key, value")
      .order("key")
      .then(function (res) {
        if (res.error) {
          setMsg($("stats-msg"), "is-error", res.error.message || "خطأ في الإحصائيات");
          return;
        }
        setMsg($("stats-msg"), "", "");
        renderStatsForm(res.data || []);
      });
  }

  function saveStats() {
    if (!client) return;
    var container = $("stats-fields");
    if (!container) return;
    var inputs = container.querySelectorAll("input[type=\"number\"]");
    var btn = $("btn-save-stats");
    if (btn) {
      btn.disabled = true;
    }
    var chain = Promise.resolve();
    var errors = [];

    inputs.forEach(function (input) {
      var key = input.getAttribute("name");
      var val = parseInt(input.value, 10);
      if (isNaN(val) || val < 0) {
        errors.push(key || "?");
        return;
      }
      chain = chain.then(function () {
        return client
          .from("site_stats")
          .update({ value: val, updated_at: new Date().toISOString() })
          .eq("key", key)
          .then(function (r) {
            if (r.error) errors.push(key + ": " + r.error.message);
          });
      });
    });

    if (!inputs.length) {
      if (btn) btn.disabled = false;
      setMsg($("stats-msg"), "is-info", "لا توجد حقول للحفظ.");
      return;
    }

    chain.then(function () {
      if (btn) btn.disabled = false;
      if (errors.length) {
        setMsg($("stats-msg"), "is-error", "خطأ: " + errors.join(" — "));
      } else {
        setMsg($("stats-msg"), "is-success", "تم حفظ الأرقام. ستظهر في الموقع الرئيسي بعد التحديث.");
      }
    });
  }

  function updateUserUi(session) {
    var emailEl = $("admin-email");
    if (emailEl && session && session.user) {
      emailEl.textContent = session.user.email || "";
    }
  }

  function activateTab(target) {
    var tabs = document.querySelectorAll(".admin-tab");
    var panels = document.querySelectorAll(".admin-panel");
    tabs.forEach(function (t) {
      var isMatch = t.getAttribute("data-tab") === target;
      t.classList.toggle("is-active", isMatch);
      t.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== target;
    });
    document.querySelectorAll(".admin-map-node").forEach(function (n) {
      n.classList.toggle("is-active", n.getAttribute("data-map-tab") === target);
    });
    if (target === "messages") loadMessages();
    if (target === "stats") loadStats();
    if (target === "cms" && window.LD_CMS_tryInit) window.LD_CMS_tryInit();
    if (target === "portfolio" && window.LD_portfolioPanelInit) window.LD_portfolioPanelInit();
    if (target === "shop" && window.LD_shopPanelInit) window.LD_shopPanelInit();
    if (target === "cashier" && window.LD_cashierPanelInit) window.LD_cashierPanelInit();
    if (target === "hero" && window.LD_heroPanelInit) window.LD_heroPanelInit();
  }

  function bindTabs() {
    var tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateTab(tab.getAttribute("data-tab"));
      });
    });
    document.querySelectorAll("[data-map-tab]").forEach(function (node) {
      node.addEventListener("click", function () {
        var t = node.getAttribute("data-map-tab");
        if (t) activateTab(t);
      });
    });
  }

  function initDashboard() {
    bindTabs();
    var btnLogout = $("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", function () {
        if (client) client.auth.signOut();
      });
    }
    var btnRefresh = $("btn-refresh-msgs");
    if (btnRefresh) btnRefresh.addEventListener("click", loadMessages);
    var btnSave = $("btn-save-stats");
    if (btnSave) btnSave.addEventListener("click", saveStats);
    loadMessages();
    loadStats();
  }

  function initLogin() {
    var form = $("login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = ($("login-email") || {}).value || "";
      var pass = ($("login-password") || {}).value || "";
      setMsg($("login-error"), "", "");
      if (!client) {
        setMsg($("login-error"), "is-error", "عميل Supabase غير مهيأ. تحقق من تحميل الإعدادات.");
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      client.auth
        .signInWithPassword({ email: email.trim(), password: pass })
        .then(function (res) {
          if (btn) btn.disabled = false;
          if (res.error) {
            setMsg($("login-error"), "is-error", res.error.message || "فشل تسجيل الدخول");
            return;
          }
        });
    });
  }

  function onSession(session) {
    updateUserUi(session);
    if (session && session.user) {
      showView("dashboard");
      if (!els.dashboardInited) {
        els.dashboardInited = true;
        initDashboard();
      } else {
        loadMessages();
        loadStats();
      }
    } else {
      showView("login");
    }
  }

  function boot() {
    if (!client) {
      var loginErr = $("login-error");
      if (loginErr) {
        loginErr.hidden = false;
        loginErr.classList.add("is-error");
        loginErr.textContent =
          "تعذّر تهيئة Supabase. تأكد من مسار js/ld-config.js والمفتاح.";
      }
      return;
    }
    initLogin();
    client.auth.getSession().then(function (res) {
      onSession(res.data && res.data.session ? res.data.session : null);
    });
    client.auth.onAuthStateChange(function (_event, session) {
      onSession(session);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
