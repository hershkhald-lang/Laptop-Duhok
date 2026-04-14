/**
 * Laptop Duhok — إدارة معرض الأعمال + رفع الصور (site-media)
 */
(function () {
  var client = window.ldSupabase;
  var BUCKET = "site-media";
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

  function setPfMsg(text, cls) {
    var el = $("pf-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "admin-msg " + (cls || "");
  }

  function clearForm() {
    editingId = null;
    $("pf-id").value = "";
    [
      "pf-title-ar",
      "pf-title-ckb",
      "pf-meta-ar",
      "pf-meta-ckb",
      "pf-desc-ar",
      "pf-desc-ckb",
      "pf-specs-ar",
      "pf-specs-ckb",
    ].forEach(function (id) {
      var el = $(id);
      if (el) el.value = "";
    });
    $("pf-category").value = "web";
    $("pf-sort").value = "0";
    $("pf-published").checked = true;
    $("pf-file").value = "";
    $("pf-current-img").innerHTML = "";
  }

  function fillForm(row) {
    editingId = row.id;
    $("pf-id").value = row.id;
    $("pf-title-ar").value = row.title_ar || "";
    $("pf-title-ckb").value = row.title_ckb || "";
    $("pf-meta-ar").value = row.meta_ar || "";
    $("pf-meta-ckb").value = row.meta_ckb || "";
    $("pf-desc-ar").value = row.description_ar || "";
    $("pf-desc-ckb").value = row.description_ckb || "";
    $("pf-specs-ar").value = row.specs_ar || "";
    $("pf-specs-ckb").value = row.specs_ckb || "";
    $("pf-category").value = row.category || "web";
    $("pf-sort").value = String(row.sort_order != null ? row.sort_order : 0);
    $("pf-published").checked = row.is_published !== false;
    $("pf-file").value = "";
    var cur = $("pf-current-img");
    if (row.image_url) {
      cur.innerHTML =
        '<img src="' +
        esc(row.image_url) +
        '" alt="" class="pf-thumb" /> <span class="pf-url-hint">' +
        esc(row.image_url) +
        "</span>";
    } else {
      cur.innerHTML = "<span>لا توجد صورة</span>";
    }
    $("portfolio-editor").hidden = false;
  }

  async function uploadImage(file, itemId) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!/^(jpg|jpeg|png|webp|gif)$/.test(ext)) {
      throw new Error("صيغة الصورة غير مدعومة");
    }
    var path = "portfolio/" + itemId + "." + ext;
    var up = await client.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (up.error) throw up.error;
    var pub = client.storage.from(BUCKET).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function savePortfolio() {
    if (!client) return;
    setPfMsg("جاري الحفظ…", "is-info");
    var id = $("pf-id").value.trim();
    var payload = {
      category: $("pf-category").value,
      sort_order: parseInt($("pf-sort").value, 10) || 0,
      title_ar: ($("pf-title-ar").value || "").trim(),
      title_ckb: ($("pf-title-ckb").value || "").trim(),
      meta_ar: ($("pf-meta-ar").value || "").trim(),
      meta_ckb: ($("pf-meta-ckb").value || "").trim(),
      description_ar: ($("pf-desc-ar").value || "").trim(),
      description_ckb: ($("pf-desc-ckb").value || "").trim(),
      specs_ar: ($("pf-specs-ar").value || "").trim() || null,
      specs_ckb: ($("pf-specs-ckb").value || "").trim() || null,
      is_published: $("pf-published").checked,
    };

    var file = $("pf-file").files && $("pf-file").files[0];

    try {
      if (!id) {
        var ins = await client.from("portfolio_items").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
        $("pf-id").value = id;
        editingId = id;
        if (file) {
          var url = await uploadImage(file, id);
          await client.from("portfolio_items").update({ image_url: url }).eq("id", id);
        }
      } else {
        if (file) {
          var url2 = await uploadImage(file, id);
          payload.image_url = url2;
        }
        payload.updated_at = new Date().toISOString();
        var up = await client.from("portfolio_items").update(payload).eq("id", id);
        if (up.error) throw up.error;
      }
      setPfMsg("تم الحفظ.", "is-success");
      clearForm();
      $("portfolio-editor").hidden = true;
      loadList();
    } catch (e) {
      setPfMsg(e.message || "فشل الحفظ", "is-error");
    }
  }

  async function deleteRow(id) {
    if (!confirm("حذف هذا المشروع نهائياً؟")) return;
    if (!client) return;
    var r = await client.from("portfolio_items").delete().eq("id", id);
    if (r.error) {
      alert(r.error.message);
      return;
    }
    loadList();
  }

  async function moveSort(id, delta) {
    var r = await client
      .from("portfolio_items")
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
    await client.from("portfolio_items").update({ sort_order: b.sort_order }).eq("id", a.id);
    await client.from("portfolio_items").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadList();
  }

  function loadList() {
    if (!client) return;
    var host = $("portfolio-list-host");
    if (!host) return;
    host.innerHTML = "<p class=\"admin-msg is-info\">جاري التحميل…</p>";
    client
      .from("portfolio_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) {
          host.innerHTML =
            "<p class=\"admin-msg is-error\">" + esc(res.error.message) + "</p>";
          return;
        }
        var rows = res.data || [];
        if (!rows.length) {
          host.innerHTML =
            "<p class=\"empty-state\">لا توجد عناصر. اضغط «مشروع جديد».</p>";
          return;
        }
        var html =
          "<table class=\"msg-table pf-table\"><thead><tr><th></th><th>العنوان (عربي)</th><th>التصنيف</th><th>ترتيب</th><th>نشر</th><th></th></tr></thead><tbody>";
        rows.forEach(function (row) {
          var img = row.image_url
            ? '<img src="' + esc(row.image_url) + '" class="pf-list-thumb" alt="" />'
            : "—";
          html +=
            "<tr><td>" +
            img +
            "</td><td><strong>" +
            esc(row.title_ar || "—") +
            "</strong></td><td>" +
            esc(row.category) +
            "</td><td>" +
            String(row.sort_order) +
            "</td><td>" +
            (row.is_published ? "نعم" : "لا") +
            '</td><td class="pf-actions"><button type="button" class="btn btn-ghost btn-sm" data-pf-edit="' +
            esc(row.id) +
            '">تعديل</button> <button type="button" class="btn btn-ghost btn-sm" data-pf-up="' +
            esc(row.id) +
            '">↑</button> <button type="button" class="btn btn-ghost btn-sm" data-pf-down="' +
            esc(row.id) +
            '">↓</button> <button type="button" class="btn btn-danger btn-sm" data-pf-del="' +
            esc(row.id) +
            '">حذف</button></td></tr>';
        });
        html += "</tbody></table>";
        host.innerHTML = html;
        host.querySelectorAll("[data-pf-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-pf-edit");
            var row = rows.find(function (r) {
              return r.id === id;
            });
            if (row) fillForm(row);
          });
        });
        host.querySelectorAll("[data-pf-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            deleteRow(btn.getAttribute("data-pf-del"));
          });
        });
        host.querySelectorAll("[data-pf-up]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-pf-up"), -1);
          });
        });
        host.querySelectorAll("[data-pf-down]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveSort(btn.getAttribute("data-pf-down"), 1);
          });
        });
      });
  }

  window.LD_portfolioPanelInit = function () {
    if (mounted) {
      loadList();
      return;
    }
    mounted = true;
    $("btn-new-portfolio").addEventListener("click", function () {
      clearForm();
      $("portfolio-editor").hidden = false;
      $("pf-current-img").innerHTML = "";
    });
    $("pf-cancel").addEventListener("click", function () {
      clearForm();
      $("portfolio-editor").hidden = true;
    });
    $("pf-save").addEventListener("click", function () {
      savePortfolio();
    });
    loadList();
  };
})();
