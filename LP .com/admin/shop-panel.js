/**
 * Laptop Duhok — إدارة تصنيفات ومنتجات المتجر + رفع الصور (site-media/shop)
 */
(function () {
  var client = window.ldSupabase;
  var BUCKET = "site-media";
  var mounted = false;
  var catEditingId = null;
  var prodEditingId = null;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function setShopMsg(text, cls) {
    var el = $("shop-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "admin-msg " + (cls || "");
  }

  function clearCatForm() {
    catEditingId = null;
    if ($("sc-id")) $("sc-id").value = "";
    if ($("sc-slug")) $("sc-slug").value = "";
    if ($("sc-icon")) $("sc-icon").value = "package";
    if ($("sc-name-ar")) $("sc-name-ar").value = "";
    if ($("sc-name-ckb")) $("sc-name-ckb").value = "";
    if ($("sc-sort")) $("sc-sort").value = "0";
    if ($("sc-active")) $("sc-active").checked = true;
    if ($("sc-slug")) $("sc-slug").removeAttribute("readonly");
  }

  function clearProdForm() {
    prodEditingId = null;
    if ($("sp-id")) $("sp-id").value = "";
    [
      "sp-name-ar",
      "sp-name-ckb",
      "sp-desc-ar",
      "sp-desc-ckb",
      "sp-price",
      "sp-badge-ar",
      "sp-badge-ckb",
      "sp-sort",
    ].forEach(function (id) {
      var el = $(id);
      if (el) el.value = "";
    });
    if ($("sp-published")) $("sp-published").checked = true;
    if ($("sp-file")) $("sp-file").value = "";
    if ($("sp-current-img")) $("sp-current-img").innerHTML = "";
  }

  async function uploadProductImage(file, productId) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!/^(jpg|jpeg|png|webp|gif)$/.test(ext)) {
      throw new Error("صيغة الصورة غير مدعومة");
    }
    var path = "shop/products/" + productId + "." + ext;
    var up = await client.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (up.error) throw up.error;
    var pub = client.storage.from(BUCKET).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function saveCategory() {
    if (!client) return;
    var slug = ($("sc-slug").value || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) {
      setShopMsg("المعرّف (slug) لاتيني صغير: أحرف وأرقام وشرطة فقط.", "is-error");
      return;
    }
    setShopMsg("جاري الحفظ…", "is-info");
    var id = ($("sc-id").value || "").trim();
    var payload = {
      slug: slug,
      icon: ($("sc-icon").value || "package").trim() || "package",
      name_ar: ($("sc-name-ar").value || "").trim(),
      name_ckb: ($("sc-name-ckb").value || "").trim(),
      sort_order: parseInt($("sc-sort").value, 10) || 0,
      is_active: $("sc-active").checked,
    };
    try {
      if (!id) {
        var ins = await client.from("shop_categories").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
      } else {
        var up = await client.from("shop_categories").update(payload).eq("id", id);
        if (up.error) throw up.error;
      }
      setShopMsg("تم حفظ التصنيف.", "is-success");
      clearCatForm();
      if ($("shop-cat-editor")) $("shop-cat-editor").hidden = true;
      loadCategoryList();
      loadCategorySelect();
    } catch (e) {
      setShopMsg(e.message || "فشل الحفظ", "is-error");
    }
  }

  async function deleteCategory(id) {
    if (!client) return;
    var cnt = await client
      .from("shop_products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (cnt.error) {
      alert(cnt.error.message);
      return;
    }
    if ((cnt.count || 0) > 0) {
      alert("لا يمكن الحذف: يوجد منتجات مرتبطة بهذا التصنيف. انقلها أو احذفها أولاً.");
      return;
    }
    if (!confirm("حذف هذا التصنيف نهائياً؟")) return;
    var r = await client.from("shop_categories").delete().eq("id", id);
    if (r.error) {
      alert(r.error.message);
      return;
    }
    loadCategoryList();
    loadCategorySelect();
  }

  async function saveProduct() {
    if (!client) return;
    var catId = ($("sp-category").value || "").trim();
    if (!catId) {
      setShopMsg("اختر تصنيفاً للمنتج.", "is-error");
      return;
    }
    var price = parseInt($("sp-price").value, 10);
    if (isNaN(price) || price < 0) {
      setShopMsg("أدخل سعراً صحيحاً (دينار).", "is-error");
      return;
    }
    setShopMsg("جاري الحفظ…", "is-info");
    var id = ($("sp-id").value || "").trim();
    var payload = {
      category_id: catId,
      name_ar: ($("sp-name-ar").value || "").trim(),
      name_ckb: ($("sp-name-ckb").value || "").trim(),
      desc_ar: ($("sp-desc-ar").value || "").trim(),
      desc_ckb: ($("sp-desc-ckb").value || "").trim(),
      price: price,
      badge_ar: ($("sp-badge-ar").value || "").trim() || null,
      badge_ckb: ($("sp-badge-ckb").value || "").trim() || null,
      sort_order: parseInt($("sp-sort").value, 10) || 0,
      is_published: $("sp-published").checked,
    };
    var file = $("sp-file") && $("sp-file").files && $("sp-file").files[0];

    try {
      if (!id) {
        var ins = await client.from("shop_products").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
        $("sp-id").value = id;
        prodEditingId = id;
        if (file) {
          var url = await uploadProductImage(file, id);
          await client.from("shop_products").update({ image_url: url }).eq("id", id);
        }
      } else {
        if (file) {
          var url2 = await uploadProductImage(file, id);
          payload.image_url = url2;
        }
        var up = await client.from("shop_products").update(payload).eq("id", id);
        if (up.error) throw up.error;
      }
      setShopMsg("تم حفظ المنتج. حدّث صفحة المتجر لرؤية التغيير.", "is-success");
      clearProdForm();
      if ($("shop-prod-editor")) $("shop-prod-editor").hidden = true;
      loadProductList();
    } catch (e) {
      setShopMsg(e.message || "فشل الحفظ", "is-error");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("حذف هذا المنتج نهائياً؟")) return;
    if (!client) return;
    var r = await client.from("shop_products").delete().eq("id", id);
    if (r.error) {
      alert(r.error.message);
      return;
    }
    loadProductList();
  }

  async function moveProductSort(id, delta) {
    var r = await client
      .from("shop_products")
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
    await client.from("shop_products").update({ sort_order: b.sort_order }).eq("id", a.id);
    await client.from("shop_products").update({ sort_order: a.sort_order }).eq("id", b.id);
    loadProductList();
  }

  function fillCatForm(row) {
    catEditingId = row.id;
    $("sc-id").value = row.id;
    $("sc-slug").value = row.slug || "";
    $("sc-slug").setAttribute("readonly", "readonly");
    $("sc-icon").value = row.icon || "package";
    $("sc-name-ar").value = row.name_ar || "";
    $("sc-name-ckb").value = row.name_ckb || "";
    $("sc-sort").value = String(row.sort_order != null ? row.sort_order : 0);
    $("sc-active").checked = row.is_active !== false;
    $("shop-cat-editor").hidden = false;
  }

  function fillProdForm(row) {
    prodEditingId = row.id;
    $("sp-id").value = row.id;
    $("sp-category").value = row.category_id || "";
    $("sp-name-ar").value = row.name_ar || "";
    $("sp-name-ckb").value = row.name_ckb || "";
    $("sp-desc-ar").value = row.desc_ar || "";
    $("sp-desc-ckb").value = row.desc_ckb || "";
    $("sp-price").value = String(row.price != null ? row.price : "");
    $("sp-badge-ar").value = row.badge_ar || "";
    $("sp-badge-ckb").value = row.badge_ckb || "";
    $("sp-sort").value = String(row.sort_order != null ? row.sort_order : 0);
    $("sp-published").checked = row.is_published !== false;
    $("sp-file").value = "";
    var cur = $("sp-current-img");
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
    $("shop-prod-editor").hidden = false;
  }

  function loadCategorySelect() {
    if (!client) return;
    var sel = $("sp-category");
    if (!sel) return;
    client
      .from("shop_categories")
      .select("id, slug, name_ar, sort_order")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) return;
        var prev = sel.value;
        sel.innerHTML = '<option value="">— اختر التصنيف —</option>';
        (res.data || []).forEach(function (c) {
          var opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = (c.name_ar || c.slug) + " (" + c.slug + ")";
          sel.appendChild(opt);
        });
        if (prev) sel.value = prev;
      });
  }

  function loadCategoryList() {
    if (!client) return;
    var host = $("shop-cat-list-host");
    if (!host) return;
    host.innerHTML = '<p class="admin-msg is-info">جاري التحميل…</p>';
    client
      .from("shop_categories")
      .select("id, slug, icon, name_ar, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (res.error) {
          host.innerHTML = '<p class="admin-msg is-error">' + esc(res.error.message) + "</p>";
          return;
        }
        var rows = res.data || [];
        if (!rows.length) {
          host.innerHTML = '<p class="empty-state">لا توجد تصنيفات. نفّذ <code>supabase/shop.sql</code> أو أضف تصنيفاً.</p>';
          return;
        }
        var html =
          '<table class="msg-table pf-table"><thead><tr><th>المعرّف</th><th>العنوان (عربي)</th><th>أيقونة</th><th>ترتيب</th><th>نشط</th><th></th></tr></thead><tbody>';
        rows.forEach(function (row) {
          html +=
            "<tr><td><code>" +
            esc(row.slug) +
            "</code></td><td>" +
            esc(row.name_ar || "—") +
            "</td><td>" +
            esc(row.icon || "") +
            "</td><td>" +
            String(row.sort_order) +
            "</td><td>" +
            (row.is_active ? "نعم" : "لا") +
            '</td><td class="pf-actions"><button type="button" class="btn btn-ghost btn-sm" data-sc-edit="' +
            esc(row.id) +
            '">تعديل</button> <button type="button" class="btn btn-danger btn-sm" data-sc-del="' +
            esc(row.id) +
            '">حذف</button></td></tr>';
        });
        html += "</tbody></table>";
        host.innerHTML = html;
        host.querySelectorAll("[data-sc-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-sc-edit");
            var row = rows.find(function (r) {
              return r.id === id;
            });
            if (row) fillCatForm(row);
          });
        });
        host.querySelectorAll("[data-sc-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            deleteCategory(btn.getAttribute("data-sc-del"));
          });
        });
      });
  }

  function loadProductList() {
    if (!client) return;
    var host = $("shop-prod-list-host");
    if (!host) return;
    host.innerHTML = '<p class="admin-msg is-info">جاري التحميل…</p>';
    Promise.all([
      client
        .from("shop_products")
        .select("id, category_id, name_ar, price, image_url, sort_order, is_published")
        .order("sort_order", { ascending: true }),
      client.from("shop_categories").select("id, slug"),
    ])
      .then(function (results) {
        var res = results[0];
        var cr = results[1];
        if (res.error) {
          host.innerHTML = '<p class="admin-msg is-error">' + esc(res.error.message) + "</p>";
          return;
        }
        var slugById = {};
        (cr.data || []).forEach(function (c) {
          slugById[c.id] = c.slug;
        });
        var rows = res.data || [];
        if (!rows.length) {
          host.innerHTML = '<p class="empty-state">لا توجد منتجات بعد. اضغط «منتج جديد».</p>';
          return;
        }
        var html =
          '<table class="msg-table pf-table"><thead><tr><th></th><th>الاسم (عربي)</th><th>التصنيف</th><th>السعر</th><th>نشر</th><th></th></tr></thead><tbody>';
        rows.forEach(function (row) {
          var slug = slugById[row.category_id] || "—";
          var img = row.image_url
            ? '<img src="' + esc(row.image_url) + '" class="pf-list-thumb" alt="" />'
            : "—";
          html +=
            "<tr><td>" +
            img +
            "</td><td><strong>" +
            esc(row.name_ar || "—") +
            "</strong></td><td>" +
            esc(slug) +
            "</td><td>" +
            esc(String(row.price)) +
            "</td><td>" +
            (row.is_published ? "نعم" : "لا") +
            '</td><td class="pf-actions"><button type="button" class="btn btn-ghost btn-sm" data-sp-edit="' +
            esc(row.id) +
            '">تعديل</button> <button type="button" class="btn btn-ghost btn-sm" data-sp-up="' +
            esc(row.id) +
            '">↑</button> <button type="button" class="btn btn-ghost btn-sm" data-sp-down="' +
            esc(row.id) +
            '">↓</button> <button type="button" class="btn btn-danger btn-sm" data-sp-del="' +
            esc(row.id) +
            '">حذف</button></td></tr>';
        });
        html += "</tbody></table>";
        host.innerHTML = html;
        host.querySelectorAll("[data-sp-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-sp-edit");
            client
              .from("shop_products")
              .select("*")
              .eq("id", id)
              .single()
              .then(function (r) {
                if (r.error || !r.data) return;
                fillProdForm(r.data);
              });
          });
        });
        host.querySelectorAll("[data-sp-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            deleteProduct(btn.getAttribute("data-sp-del"));
          });
        });
        host.querySelectorAll("[data-sp-up]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveProductSort(btn.getAttribute("data-sp-up"), -1);
          });
        });
        host.querySelectorAll("[data-sp-down]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            moveProductSort(btn.getAttribute("data-sp-down"), 1);
          });
        });
      })
      .catch(function (err) {
        host.innerHTML =
          '<p class="admin-msg is-error">' + esc(err && err.message ? err.message : String(err)) + "</p>";
      });
  }

  window.LD_shopPanelInit = function () {
    if (!client) return;
    if (mounted) {
      loadCategoryList();
      loadProductList();
      loadCategorySelect();
      return;
    }
    mounted = true;

    var bnc = $("btn-new-shop-cat");
    if (bnc) {
      bnc.addEventListener("click", function () {
        clearCatForm();
        $("shop-cat-editor").hidden = false;
      });
    }
    var bsc = $("sc-cancel");
    if (bsc) {
      bsc.addEventListener("click", function () {
        clearCatForm();
        $("shop-cat-editor").hidden = true;
      });
    }
    var bss = $("sc-save");
    if (bss) bss.addEventListener("click", saveCategory);

    var bnp = $("btn-new-shop-prod");
    if (bnp) {
      bnp.addEventListener("click", function () {
        clearProdForm();
        loadCategorySelect();
        $("shop-prod-editor").hidden = false;
      });
    }
    var psc = $("sp-cancel");
    if (psc) {
      psc.addEventListener("click", function () {
        clearProdForm();
        $("shop-prod-editor").hidden = true;
      });
    }
    var pss = $("sp-save");
    if (pss) pss.addEventListener("click", saveProduct);

    loadCategoryList();
    loadProductList();
    loadCategorySelect();
  };
})();
