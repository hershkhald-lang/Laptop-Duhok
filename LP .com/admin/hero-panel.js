/**
 * Laptop Duhok — إدارة شرائح Hero (hero_slides + site-media/hero)
 */
(function () {
  var client = window.ldSupabase;
  var BUCKET = "site-media";
  var mounted = false;
  var editingId = null;

  function ico(name) {
    return (window.LD_ADMIN_ICO && window.LD_ADMIN_ICO[name]) || "";
  }

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function setMsg(text, cls) {
    var el = $("hs-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "admin-msg " + (cls || "");
  }

  function clearForm() {
    editingId = null;
    $("hs-id").value = "";
    [
      "hs-kicker-ar",
      "hs-kicker-ckb",
      "hs-title-ar",
      "hs-title-ckb",
      "hs-desc-ar",
      "hs-desc-ckb",
      "hs-pri-text-ar",
      "hs-pri-text-ckb",
      "hs-pri-url",
      "hs-sec-text-ar",
      "hs-sec-text-ckb",
      "hs-sec-url",
      "hs-label-ar",
      "hs-label-ckb",
      "hs-bg-css",
    ].forEach(function (id) {
      var el = $(id);
      if (el) el.value = "";
    });
    $("hs-sort").value = "0";
    $("hs-published").checked = true;
    $("hs-file").value = "";
    $("hs-current-img").innerHTML = "";
  }

  function fillForm(row) {
    editingId = row.id;
    $("hs-id").value = row.id;
    $("hs-kicker-ar").value = row.kicker_ar || "";
    $("hs-kicker-ckb").value = row.kicker_ckb || "";
    $("hs-title-ar").value = row.title_ar || "";
    $("hs-title-ckb").value = row.title_ckb || "";
    $("hs-desc-ar").value = row.description_ar || "";
    $("hs-desc-ckb").value = row.description_ckb || "";
    $("hs-pri-text-ar").value = row.primary_btn_text_ar || "";
    $("hs-pri-text-ckb").value = row.primary_btn_text_ckb || "";
    $("hs-pri-url").value = row.primary_btn_url || "#contact";
    $("hs-sec-text-ar").value = row.secondary_btn_text_ar || "";
    $("hs-sec-text-ckb").value = row.secondary_btn_text_ckb || "";
    $("hs-sec-url").value = row.secondary_btn_url || "#portfolio";
    $("hs-label-ar").value = row.featured_label_ar || "";
    $("hs-label-ckb").value = row.featured_label_ckb || "";
    $("hs-bg-css").value = row.background_css || "";
    $("hs-sort").value = String(row.sort_order != null ? row.sort_order : 0);
    $("hs-published").checked = row.is_published !== false;
    $("hs-file").value = "";
    var cur = $("hs-current-img");
    if (row.featured_image_url) {
      cur.innerHTML =
        '<img src="' +
        esc(row.featured_image_url) +
        '" alt="" class="pf-thumb" /> <span class="pf-url-hint">' +
        esc(row.featured_image_url) +
        "</span>";
    } else {
      cur.innerHTML = "<span>لا توجد صورة — يُعرض التدرّج الافتراضي</span>";
    }
    $("hero-slide-editor").hidden = false;
  }

  async function uploadImage(file, itemId) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!/^(jpg|jpeg|png|webp|gif)$/.test(ext)) {
      throw new Error("صيغة الصورة غير مدعومة");
    }
    var path = "hero/" + itemId + "." + ext;
    var up = await client.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (up.error) throw up.error;
    var pub = client.storage.from(BUCKET).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function saveHero() {
    if (!client) return;
    setMsg("جاري الحفظ…", "is-info");
    var id = $("hs-id").value.trim();
    var payload = {
      sort_order: parseInt($("hs-sort").value, 10) || 0,
      kicker_ar: ($("hs-kicker-ar").value || "").trim(),
      kicker_ckb: ($("hs-kicker-ckb").value || "").trim(),
      title_ar: ($("hs-title-ar").value || "").trim(),
      title_ckb: ($("hs-title-ckb").value || "").trim(),
      description_ar: ($("hs-desc-ar").value || "").trim(),
      description_ckb: ($("hs-desc-ckb").value || "").trim(),
      primary_btn_text_ar: ($("hs-pri-text-ar").value || "").trim(),
      primary_btn_text_ckb: ($("hs-pri-text-ckb").value || "").trim(),
      primary_btn_url: ($("hs-pri-url").value || "").trim() || "#contact",
      secondary_btn_text_ar: ($("hs-sec-text-ar").value || "").trim(),
      secondary_btn_text_ckb: ($("hs-sec-text-ckb").value || "").trim(),
      secondary_btn_url: ($("hs-sec-url").value || "").trim() || "#portfolio",
      featured_label_ar: ($("hs-label-ar").value || "").trim(),
      featured_label_ckb: ($("hs-label-ckb").value || "").trim(),
      background_css: ($("hs-bg-css").value || "").trim() || null,
      is_published: $("hs-published").checked,
    };

    var file = $("hs-file").files && $("hs-file").files[0];

    try {
      if (!id) {
        var ins = await client.from("hero_slides").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
        $("hs-id").value = id;
        editingId = id;
        if (file) {
          var url = await uploadImage(file, id);
          await client.from("hero_slides").update({ featured_image_url: url }).eq("id", id);
        }
      } else {
        if (file) {
          var url2 = await uploadImage(file, id);
          payload.featured_image_url = url2;
        }
        var up = await client.from("hero_slides").update(payload).eq("id", id);
        if (up.error) throw up.error;
      }
      setMsg("تم الحفظ. حدّث الصفحة الرئيسية لمعاينة التغيير.", "is-success");
      clearForm();
      $("hero-slide-editor").hidden = true;
      loadList();
    } catch (e) {
      setMsg(e.message || "فشل الحفظ", "is-error");
    }
  }

  async function deleteRow(id) {
    if (!confirm("حذف هذه الشريحة نهائياً؟")) return;
    if (!client) return;
    var r = await client.from("hero_slides").delete().eq("id", id);
    if (r.error) {
      alert(r.error.message);
      return;
    }
    loadList();
  }

  async function moveSort(id, delta) {
    var r = await client
      .from("hero_slides")
      .select("id, sort_order")
      .order("sort_order", { ascending: true });
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
    await client.from("hero_slides").update({ sort_order: b.sort_order }).eq("id", a.id);
    await client.from("hero_slides").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadList();
  }

  function loadList() {
    if (!client) return;
    var host = $("hero-list-host");
    if (!host) return;
    host.innerHTML = '<p class="admin-msg is-info">جاري التحميل…</p>';
    client
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) {
          host.innerHTML =
            '<p class="admin-msg is-error">' + esc(res.error.message) + "</p>";
          return;
        }
        var rows = res.data || [];
        if (!rows.length) {
          host.innerHTML =
            '<p class="empty-state">لا توجد شرائح. نفّذ <code>supabase/hero-slides.sql</code> أو اضغط «شريحة جديدة».</p>';
          return;
        }
        var html =
          '<table class="msg-table pf-table"><thead><tr><th></th><th>العنوان (عربي)</th><th>ترتيب</th><th>نشر</th><th></th></tr></thead><tbody>';
        rows.forEach(function (row) {
          var img = row.featured_image_url
            ? '<img src="' + esc(row.featured_image_url) + '" class="pf-list-thumb" alt="" />'
            : "—";
          html +=
            "<tr><td>" +
            img +
            "</td><td><strong>" +
            esc(row.title_ar || "—") +
            "</strong></td><td>" +
            String(row.sort_order) +
            "</td><td>" +
            (row.is_published ? "نعم" : "لا") +
            '</td><td class="pf-actions"><button type="button" class="btn btn-ghost btn-sm" data-hs-edit="' +
            esc(row.id) +
            '">' +
            ico("edit") +
            ' تعديل</button> <button type="button" class="btn btn-ghost btn-sm" data-hs-up="' +
            esc(row.id) +
            '" title="أعلى">' +
            ico("up") +
            '</button> <button type="button" class="btn btn-ghost btn-sm" data-hs-down="' +
            esc(row.id) +
            '" title="أسفل">' +
            ico("down") +
            '</button> <button type="button" class="btn btn-danger btn-sm" data-hs-del="' +
            esc(row.id) +
            '">' +
            ico("trash") +
            " حذف</button></td></tr>";
        });
        html += "</tbody></table>";
        host.innerHTML = html;
        host.querySelectorAll("[data-hs-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var hid = btn.getAttribute("data-hs-edit");
            var row = rows.find(function (r) {
              return r.id === hid;
            });
            if (row) fillForm(row);
          });
        });
        host.querySelectorAll("[data-hs-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            deleteRow(btn.getAttribute("data-hs-del"));
          });
        });
        host.querySelectorAll("[data-hs-up]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-hs-up"), -1);
          });
        });
        host.querySelectorAll("[data-hs-down]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-hs-down"), 1);
          });
        });
      });
  }

  window.LD_heroPanelInit = function () {
    if (mounted) {
      loadList();
      return;
    }
    mounted = true;
    $("btn-new-hero").addEventListener("click", function () {
      clearForm();
      $("hero-slide-editor").hidden = false;
      $("hs-current-img").innerHTML = "";
    });
    $("hs-cancel").addEventListener("click", function () {
      clearForm();
      $("hero-slide-editor").hidden = true;
    });
    $("hs-save").addEventListener("click", function () {
      saveHero();
    });
    loadList();
  };
})();
