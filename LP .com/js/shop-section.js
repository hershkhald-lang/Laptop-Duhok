(function () {
  var CART_KEY = "ld_shop_cart_v1";

  function escAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/'/g, "&#39;");
  }

  function fmtMoney(n) {
    if (typeof n !== "number" || isNaN(n)) return "—";
    return n.toLocaleString("en-US") + " IQD";
  }

  function getLang() {
    var l = document.documentElement.getAttribute("lang");
    if (l === "ckb") return "ckb";
    if (l === "bad") return "bad";
    return "ar";
  }

  function tProduct(p, field) {
    var lang = getLang();
    var key = field + "_" + lang;
    if (p[key]) return p[key];
    if (lang === "bad" && p[field + "_ckb"]) return p[field + "_ckb"];
    return p[field + "_ar"] || p["name_ar"] || "";
  }

  function categoryLabel(id) {
    var cats = window.LD_SHOP_CATEGORIES || [];
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) {
        var lang = getLang();
        var k = "name_" + lang;
        if (cats[i][k]) return cats[i][k];
        if (lang === "bad" && cats[i].name_ckb) return cats[i].name_ckb;
        return lang === "ckb" || lang === "bad" ? cats[i].name_ckb || cats[i].name_ar || id : cats[i].name_ar || id;
      }
    }
    var map = {
      all: { ar: "الكل", ckb: "هەموو", bad: "هەمی" },
      cashier: { ar: "أجهزة الكاشير", ckb: "ئامێرەکانی کاشێر", bad: "ئامیرێن کاشێری" },
      laptops: { ar: "اللابتوبات", ckb: "لاپتۆپەکان", bad: "لاپتۆپ" },
      paper: { ar: "الورق والمستلزمات", ckb: "کاغەز و پێداویستی", bad: "کاغەز و پێداویستی" },
      peripherals: { ar: "كيبورد وماوس", ckb: "تەختە و ماوس", bad: "کیبۆرد و ماوس" },
      accessories: { ar: "إكسسوارات", ckb: "ئەکسسوار", bad: "ئەکسسوار" },
    };
    var lang = getLang();
    return (map[id] && map[id][lang]) || id;
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function cartCount() {
    return loadCart().reduce(function (s, it) {
      return s + (it.qty || 0);
    }, 0);
  }

  function cartTotal() {
    return loadCart().reduce(function (s, it) {
      var p = findProduct(it.id);
      if (!p) return s;
      return s + (p.price || 0) * (it.qty || 0);
    }, 0);
  }

  function findProduct(id) {
    var list = window.LD_SHOP_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function updateCartBadge() {
    var n = cartCount();
    document.querySelectorAll("[data-shop-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.setAttribute("data-empty", n === 0 ? "1" : "0");
    });
  }

  function renderTabs(activeId) {
    var wrap = document.getElementById("shop-tabs");
    if (!wrap) return;
    var cats = window.LD_SHOP_CATEGORIES || [];
    wrap.innerHTML = "";
    cats.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shop-tab" + (c.id === activeId ? " is-active" : "");
      btn.setAttribute("data-cat", c.id);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", c.id === activeId ? "true" : "false");
      var span = document.createElement("span");
      span.className = "shop-tab__icon";
      span.setAttribute("data-icon", c.icon || "package");
      var label = document.createElement("span");
      label.className = "shop-tab__label";
      label.textContent = categoryLabel(c.id);
      btn.appendChild(span);
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        renderTabs(c.id);
        renderGrid(c.id);
      });
      wrap.appendChild(btn);
    });
  }

  function filterProducts(catId) {
    var list = window.LD_SHOP_PRODUCTS || [];
    if (catId === "all") return list.slice();
    return list.filter(function (p) {
      return p.category === catId;
    });
  }

  function renderGrid(catId) {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;
    var products = filterProducts(catId);
    grid.innerHTML = "";
    if (products.length === 0) {
      var empty = document.createElement("p");
      empty.className = "shop-empty";
      empty.setAttribute("data-i18n", "shop.empty");
      empty.textContent =
        window.LD_I18N && window.LD_I18N.t
          ? window.LD_I18N.t(getLang(), "shop.empty")
          : getLang() === "ckb"
            ? "هیچ بەرهەمێک نییە لەم پۆلە."
            : "لا توجد منتجات في هذا التصنيف حالياً.";
      grid.appendChild(empty);
      return;
    }
    products.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "shop-card";
      card.setAttribute("data-product-id", p.id);

      var visual = document.createElement("div");
      visual.className = "shop-card__visual";
      if (p.image_url) {
        var im = document.createElement("img");
        im.className = "shop-card__img";
        im.src = p.image_url;
        im.alt = "";
        im.loading = "lazy";
        im.decoding = "async";
        visual.appendChild(im);
      } else {
        var initials = (tProduct(p, "name") || "P").slice(0, 2);
        var av = document.createElement("span");
        av.className = "shop-card__avatar";
        av.textContent = initials;
        visual.appendChild(av);
      }
      if (p.badge_ar || p.badge_ckb || p.badge_bad) {
        var badge = document.createElement("span");
        badge.className = "shop-card__badge";
        badge.textContent = tProduct(p, "badge");
        visual.appendChild(badge);
      }

      var body = document.createElement("div");
      body.className = "shop-card__body";
      var h3 = document.createElement("h3");
      h3.className = "shop-card__title";
      h3.textContent = tProduct(p, "name");
      var price = document.createElement("div");
      price.className = "shop-card__price";
      price.textContent = fmtMoney(p.price);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shop-card__cta";
      btn.setAttribute("data-i18n", "shop.view");
      btn.textContent =
        window.LD_I18N && window.LD_I18N.t
          ? window.LD_I18N.t(getLang(), "shop.view")
          : getLang() === "ckb"
            ? "بینین"
            : "عرض التفاصيل";

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openProductModal(p.id);
      });
      card.addEventListener("click", function () {
        openProductModal(p.id);
      });

      body.appendChild(h3);
      body.appendChild(price);
      body.appendChild(btn);
      card.appendChild(visual);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  var modalEl = null;
  var qtyInput = null;
  var shopModalKeydown = null;
  /** مستمع واحد (capture) على #shop-product-modal — إغلاق عبر × أو الخلفية */
  var shopModalClickCapture = null;

  var shopDrawerKeydown = null;
  var shopDrawerCloseClick = null;
  var shopDrawerBackdropClick = null;

  function closeProductModal() {
    var el = document.getElementById("shop-product-modal");
    if (shopModalKeydown) {
      document.removeEventListener("keydown", shopModalKeydown, true);
      shopModalKeydown = null;
    }
    if (shopModalClickCapture && el) {
      el.removeEventListener("click", shopModalClickCapture, true);
      shopModalClickCapture = null;
    }
    if (el) {
      el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("shop-modal-open");
  }

  function closeCartDrawer() {
    if (shopDrawerKeydown) {
      document.removeEventListener("keydown", shopDrawerKeydown, true);
      shopDrawerKeydown = null;
    }
    var drawer = document.getElementById("shop-cart-drawer");
    if (drawer) {
      var cb = drawer.querySelector("[data-shop-cart-close]");
      var bd = drawer.querySelector(".shop-drawer__backdrop");
      if (cb && shopDrawerCloseClick) {
        cb.removeEventListener("click", shopDrawerCloseClick);
        shopDrawerCloseClick = null;
      }
      if (bd && shopDrawerBackdropClick) {
        bd.removeEventListener("click", shopDrawerBackdropClick);
        shopDrawerBackdropClick = null;
      }
      drawer.hidden = true;
      drawer.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("shop-drawer-open");
  }

  function openProductModal(productId) {
    var p = findProduct(productId);
    if (!p) return;
    closeProductModal();
    closeCartDrawer();

    modalEl = document.getElementById("shop-product-modal");
    if (!modalEl) return;
    modalEl.removeAttribute("hidden");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("shop-modal-open");

    var titleEl =
      document.getElementById("shop-modal-title") ||
      modalEl.querySelector("[data-shop-modal-title]");
    var descEl =
      document.getElementById("shop-modal-desc") ||
      modalEl.querySelector("[data-shop-modal-desc]");
    var priceEl =
      document.getElementById("shop-modal-price") ||
      modalEl.querySelector("[data-shop-modal-price]");
    var imgEl = document.getElementById("shop-modal-img");
    var avEl =
      document.getElementById("shop-modal-avatar") ||
      modalEl.querySelector("[data-shop-modal-avatar]");
    if (titleEl) titleEl.textContent = tProduct(p, "name");
    if (descEl) descEl.textContent = tProduct(p, "desc");
    if (priceEl) priceEl.textContent = fmtMoney(p.price);
    if (p.image_url && imgEl) {
      imgEl.src = p.image_url;
      imgEl.alt = tProduct(p, "name") || "";
      imgEl.hidden = false;
      if (avEl) avEl.hidden = true;
    } else {
      if (imgEl) {
        imgEl.hidden = true;
        imgEl.removeAttribute("src");
        imgEl.alt = "";
      }
      if (avEl) {
        avEl.hidden = false;
        avEl.textContent = (tProduct(p, "name") || "P").slice(0, 2);
      }
    }
    modalEl.setAttribute("data-current-product", p.id);

    qtyInput = modalEl.querySelector("[data-shop-qty]");
    if (qtyInput) qtyInput.value = "1";

    var closeBtn = modalEl.querySelector("[data-shop-modal-close]");

    shopModalKeydown = function (e) {
      if (e.key !== "Escape") return;
      var m = document.getElementById("shop-product-modal");
      if (!m || m.hasAttribute("hidden")) return;
      e.preventDefault();
      e.stopPropagation();
      closeProductModal();
    };
    document.addEventListener("keydown", shopModalKeydown, true);

    shopModalClickCapture = function (e) {
      var m = document.getElementById("shop-product-modal");
      if (!m || m.hasAttribute("hidden")) return;
      var t = e.target;
      if (t.closest && t.closest("[data-shop-modal-close]")) {
        e.preventDefault();
        closeProductModal();
        return;
      }
      if (t.classList && t.classList.contains("shop-modal__backdrop")) {
        closeProductModal();
      }
    };
    modalEl.addEventListener("click", shopModalClickCapture, true);

    var addBtn = modalEl.querySelector("[data-shop-add]");
    if (addBtn) {
      addBtn.onclick = function () {
        var q = parseInt(qtyInput && qtyInput.value, 10) || 1;
        if (q < 1) q = 1;
        addToCart(p.id, q);
        closeProductModal();
        openCartDrawer();
      };
    }

    try {
      if (closeBtn) closeBtn.focus();
    } catch (e) {}
  }

  function addToCart(productId, qty) {
    var items = loadCart();
    var found = items.find(function (it) {
      return it.id === productId;
    });
    if (found) found.qty += qty;
    else items.push({ id: productId, qty: qty });
    saveCart(items);
    updateCartBadge();
    renderCartDrawer();
  }

  function removeLine(productId) {
    var items = loadCart().filter(function (it) {
      return it.id !== productId;
    });
    saveCart(items);
    updateCartBadge();
    renderCartDrawer();
  }

  function setQty(productId, qty) {
    var q = Math.max(1, parseInt(qty, 10) || 1);
    var items = loadCart();
    var found = items.find(function (it) {
      return it.id === productId;
    });
    if (found) {
      found.qty = q;
      saveCart(items);
    }
    updateCartBadge();
    renderCartDrawer();
  }

  function renderCartDrawer() {
    var listEl = document.getElementById("shop-cart-lines");
    var totalEl = document.getElementById("shop-cart-total");
    if (!listEl) return;
    var items = loadCart();
    listEl.innerHTML = "";
    if (items.length === 0) {
      var p = document.createElement("p");
      p.className = "shop-cart__empty";
      p.setAttribute("data-i18n", "shop.cart_empty");
      p.textContent =
        window.LD_I18N && window.LD_I18N.t
          ? window.LD_I18N.t(getLang(), "shop.cart_empty")
          : getLang() === "ckb"
            ? "سەبەتە بەتاڵە."
            : "سلة التسوق فارغة.";
      listEl.appendChild(p);
    } else {
      items.forEach(function (it) {
        var prod = findProduct(it.id);
        if (!prod) return;
        var row = document.createElement("div");
        row.className = "shop-cart__line";
        row.innerHTML =
          '<div class="shop-cart__line-main">' +
          '<span class="shop-cart__line-name"></span>' +
          '<span class="shop-cart__line-price"></span>' +
          "</div>" +
          '<div class="shop-cart__line-actions">' +
          '<label class="shop-cart__qty"><span class="sr-only">' +
          (window.LD_I18N && window.LD_I18N.t
            ? window.LD_I18N.t(getLang(), "shop.qty_label")
            : "Qty") +
          "</span>" +
          '<input type="number" min="1" value="' +
          escAttr(String(Math.max(1, parseInt(it.qty, 10) || 1))) +
          '" data-cart-qty="' +
          escAttr(it.id) +
          '" />' +
          "</label>" +
          '<button type="button" class="shop-cart__remove" data-cart-remove="' +
          escAttr(it.id) +
          '">&times;</button>' +
          "</div>";
        row.querySelector(".shop-cart__line-name").textContent = tProduct(prod, "name");
        row.querySelector(".shop-cart__line-price").textContent =
          fmtMoney(prod.price * it.qty);
        listEl.appendChild(row);
      });
      listEl.querySelectorAll("[data-cart-remove]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          removeLine(btn.getAttribute("data-cart-remove"));
        });
      });
      listEl.querySelectorAll("[data-cart-qty]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          setQty(inp.getAttribute("data-cart-qty"), inp.value);
        });
      });
    }
    if (totalEl) totalEl.textContent = fmtMoney(cartTotal());
  }

  function openCartDrawer() {
    var drawer = document.getElementById("shop-cart-drawer");
    if (!drawer) return;
    if (!drawer.hidden) {
      renderCartDrawer();
      return;
    }
    closeProductModal();

    closeCartDrawer();
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("shop-drawer-open");
    renderCartDrawer();

    var closeBtn = drawer.querySelector("[data-shop-cart-close]");
    var backdrop = drawer.querySelector(".shop-drawer__backdrop");

    shopDrawerKeydown = function (e) {
      if (e.key !== "Escape") return;
      var d = document.getElementById("shop-cart-drawer");
      if (!d || d.hasAttribute("hidden")) return;
      e.preventDefault();
      closeCartDrawer();
    };
    document.addEventListener("keydown", shopDrawerKeydown, true);

    shopDrawerCloseClick = function () {
      closeCartDrawer();
    };
    if (closeBtn) closeBtn.addEventListener("click", shopDrawerCloseClick);

    shopDrawerBackdropClick = function () {
      closeCartDrawer();
    };
    if (backdrop) backdrop.addEventListener("click", shopDrawerBackdropClick);
  }

  function buildOrderMessage() {
    var lines = [];
    loadCart().forEach(function (it) {
      var prod = findProduct(it.id);
      if (!prod) return;
      lines.push(
        "- " +
          tProduct(prod, "name") +
          " × " +
          it.qty +
          " — " +
          fmtMoney(prod.price * it.qty)
      );
    });
    var total = fmtMoney(cartTotal());
    return (
      lines.join("\n") +
      "\n\n" +
      (getLang() === "ckb" ? "کۆی گشتی: " : "المجموع: ") +
      total
    );
  }

  function checkout() {
    var items = loadCart();
    if (items.length === 0) {
      closeCartDrawer();
      return;
    }
    var prefix =
      window.LD_I18N && window.LD_I18N.t
        ? window.LD_I18N.t(getLang(), "shop.checkout_intro")
        : getLang() === "ckb"
          ? "سڵاو، ئەم داواکارییەم هەیە:\n\n"
          : "مرحباً، أود طلب التالي:\n\n";
    var fullText = prefix + buildOrderMessage();
    closeCartDrawer();

    var msg = document.getElementById("cf-msg");
    if (msg) {
      msg.value = fullText;
      var contact = document.getElementById("contact");
      if (contact) contact.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        msg.focus();
      } catch (e) {}
      return;
    }

    try {
      sessionStorage.setItem("ld_shop_checkout_draft", fullText);
    } catch (e) {}
    window.location.href = "index.html#contact";
  }

  function init() {
    renderTabs("all");
    renderGrid("all");
    updateCartBadge();
    renderCartDrawer();

    var fab = document.getElementById("shop-cart-fab");
    if (fab) fab.addEventListener("click", openCartDrawer);

    var checkoutBtn = document.getElementById("shop-checkout");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

    document.addEventListener("ld-lang-change", function () {
      var active = document.querySelector(".shop-tab.is-active");
      var cat = active ? active.getAttribute("data-cat") : "all";
      renderTabs(cat || "all");
      renderGrid(cat || "all");
      renderCartDrawer();
    });
  }

  function boot() {
    var p = window.LD_SHOP_READY;
    if (p && typeof p.then === "function") {
      p.then(function () {
        init();
      }).catch(function () {
        init();
      });
    } else {
      init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
