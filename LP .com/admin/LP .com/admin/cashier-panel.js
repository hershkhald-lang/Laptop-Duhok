/**
 * Laptop Duhok — إدارة فيديوهات شروحات الكاشير (يوتيوب + Supabase)
 */
(function () {
  var client = window.ldSupabase;
  var mounted = false;
  var editingId = null;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function setCvMsg(text, cls) {
    var el = $("cv-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "admin-msg " + (cls || "");
  }

  /** يقبل معرفاً مباشرة أو رابط youtube كامل */
  function extractYoutubeId(raw) {
    var s = (raw || "").trim();
    if (!s) return "";
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    var m = s.match(/(?:v=|\/embed\/|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  function thumbUrl(id) {
    return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
  }

  function clearForm() {
    editingId = null;
    $("cv-id").value = "";
    $("cv-youtube").value = "";
    $("cv-title-ar").value = "";
    $("cv-title-ckb").value = "";
    $("cv-desc-ar").value = "";
    $("cv-desc-ckb").value = "";
    $("cv-category").value = "basics";
    $("cv-sort").value = "0";
    $("cv-duration").value = "";
    $("cv-published").checked = true;
  }

  function fillForm(row) {
    editingId = row.id;
    $("cv-id").value = row.id;
    $("cv-youtube").value = row.youtube_id || "";
    $("cv-title-ar").value = row.title_ar || "";
    $("cv-title-ckb").value = row.title_ckb || "";
    $("cv-desc-ar").value = row.description_ar || "";
    $("cv-desc-ckb").value = row.description_ckb || "";
    $("cv-category").value = row.category || "basics";
    $("cv-sort").value = String(row.sort_order != null ? row.sort_order : 0);
    $("cv-duration").value = row.duration || "";
    $("cv-published").checked = row.is_published !== false;
    $("cashier-editor").hidden = false;
  }

  async function saveCashier() {
    if (!client) return;
    setCvMsg("جاري الحفظ…", "is-info");
    var yid = extractYoutubeId($("cv-youtube").value);
    if (!yid) {
      setCvMsg("أدخل رابط يوتيوب صالحاً أو معرف الفيديو (11 حرفاً).", "is-error");
      return;
    }
    var id = $("cv-id").value.trim();
    var payload = {
      youtube_id: yid,
      sort_order: parseInt($("cv-sort").value, 10) || 0,
      title_ar: ($("cv-title-ar").value || "").trim(),
      title_ckb: ($("cv-title-ckb").value || "").trim(),
      description_ar: ($("cv-desc-ar").value || "").trim(),
      description_ckb: ($("cv-desc-ckb").value || "").trim(),
      category: $("cv-category").value,
      duration: ($("cv-duration").value || "").trim() || null,
      is_published: $("cv-published").checked,
    };

    try {
      if (!id) {
        var ins = await client.from("cashier_videos").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
      } else {
        payload.updated_at = new Date().toISOString();
        var up = await client.from("cashier_videos").update(payload).eq("id", id);
        if (up.error) throw up.error;
      }
      setCvMsg("تم الحفظ. ستظهر التغييرات في صفحة شروحات الكاشير للزوار (إن كان المنشور مفعّلاً).", "is-success");
      clearForm();
      $("cashier-editor").hidden = true;
      loadList();
    } catch (e) {
      setCvMsg(e.message || "فشل الحفظ — نفّذ supabase/cashier-videos.sql", "is-error");
    }
  }

  async function deleteRow(id) {
    if (!confirm("حذف هذا الفيديو من القائمة؟")) return;
    if (!client) return;
    var r = await client.from("cashier_videos").delete().eq("id", id);
    if (r.error) {
      alert(r.error.message);
      return;
    }
    loadList();
  }

  async function moveSort(id, delta) {
    var r = await client.from("cashier_videos").select("id, sort_order").order("sort_order", { ascending: true });
    if (r.error || !r.data) return;
    var rows = r.data;
    var i = rows.findIndex(function (x) {
      return x.id === id;
    });
    if (i < 0) return;
    var j = i + delta;
    if (j < 0 || j >= rows.length) return;
    var a = rows[i];
    var b = rows[j];
    await client.from("cashier_videos").update({ sort_order: b.sort_order }).eq("id", a.id);
    await client.from("cashier_videos").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadList();
  }

  function loadList() {
    if (!client) return;
    var host = $("cashier-list-host");
    if (!host) return;
    host.innerHTML = '<p class="admin-msg is-info">جاري التحميل…</p>';
    client
      .from("cashier_videos")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) {
          host.innerHTML =
            '<p class="admin-msg is-error">' + esc(res.error.message) + " — نفّذ <code>cashier-videos.sql</code></p>";
          return;
        }
        var rows = res.data || [];
        if (!rows.length) {
          host.innerHTML = '<p class="empty-state">لا توجد فيديوهات. اضغط «فيديو جديد».</p>';
          return;
        }
        var html =
          '<table class="msg-table cv-table"><thead><tr><th></th><th>العنوان (عربي)</th><th>يوتيوب</th><th>التصنيف</th><th>ترتيب</th><th>نشر</th><th></th></tr></thead><tbody>';
        rows.forEach(function (row) {
          var img = row.youtube_id
            ? '<img src="' + esc(thumbUrl(row.youtube_id)) + '" class="cv-list-thumb" alt="" />'
            : "—";
          html +=
            "<tr><td>" +
            img +
            '</td><td><strong>' +
            esc(row.title_ar || "—") +
            '</strong></td><td><code class="cv-yt-code">' +
            esc(row.youtube_id) +
            '</code></td><td>' +
            esc(row.category) +
            "</td><td>" +
            String(row.sort_order) +
            "</td><td>" +
            (row.is_published ? "نعم" : "لا") +
            '</td><td class="cv-actions"><button type="button" class="btn btn-ghost btn-sm" data-cv-edit="' +
            esc(row.id) +
            '">تعديل</button> <button type="button" class="btn btn-ghost btn-sm" data-cv-up="' +
            esc(row.id) +
            '">↑</button> <button type="button" class="btn btn-ghost btn-sm" data-cv-down="' +
            esc(row.id) +
            '">↓</button> <button type="button" class="btn btn-danger btn-sm" data-cv-del="' +
            esc(row.id) +
            '">حذف</button></td></tr>';
        });
        html += "</tbody></table>";
        host.innerHTML = html;

        host.querySelectorAll("[data-cv-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var rid = btn.getAttribute("data-cv-edit");
            var row = rows.find(function (r) {
              return r.id === rid;
            });
            if (row) fillForm(row);
          });
        });
        host.querySelectorAll("[data-cv-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            deleteRow(btn.getAttribute("data-cv-del"));
          });
        });
        host.querySelectorAll("[data-cv-up]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-cv-up"), -1);
          });
        });
        host.querySelectorAll("[data-cv-down]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-cv-down"), 1);
          });
        });
      });
  }

  window.LD_cashierPanelInit = function () {
    if (mounted) {
      loadList();
      return;
    }
    mounted = true;
    $("btn-new-cashier").addEventListener("click", function () {
      clearForm();
      $("cashier-editor").hidden = false;
      $("cv-youtube").focus();
    });
    $("cv-cancel").addEventListener("click", function () {
      clearForm();
      $("cashier-editor").hidden = true;
    });
    $("cv-save").addEventListener("click", function () {
      saveCashier();
    });
    loadList();
  };
})();
