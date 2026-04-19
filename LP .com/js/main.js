/**
 * Laptop Duhok — counters, hero slider, nav, form, filters
 */
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* Footer year */
  onReady(function () {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  });

  /* طلب المتجر: عند الإكمال من shop.html يُعبّأ نموذج التواصل في الرئيسية */
  onReady(function () {
    try {
      var draft = sessionStorage.getItem("ld_shop_checkout_draft");
      if (!draft) return;
      var msg = document.getElementById("cf-msg");
      if (!msg) return;
      msg.value = draft;
      sessionStorage.removeItem("ld_shop_checkout_draft");
      if (window.location.hash === "#contact") {
        var contact = document.getElementById("contact");
        if (contact) {
          requestAnimationFrame(function () {
            contact.scrollIntoView({ behavior: "smooth", block: "start" });
            try {
              msg.focus();
            } catch (e) {}
          });
        }
      }
    } catch (e) {}
  });

  /* i18n — بعد تحميل site_cms */
  onReady(function () {
    function bootI18n() {
      if (window.LD_I18N) window.LD_I18N.init();
    }
    if (window.LD_CMS_READY) {
      window.LD_CMS_READY.then(bootI18n).catch(bootI18n);
    } else {
      bootI18n();
    }
  });

  /* Header shadow on scroll */
  onReady(function () {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  /* Scroll-in reveal for main sections (hero excluded) */
  onReady(function () {
    if (prefersReducedMotion) return;
    var sections = document.querySelectorAll("main > section:not(.hero):not(.page-hero)");
    if (!sections.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sections.forEach(function (sec) {
          sec.classList.add("reveal-on-scroll");
          io.observe(sec);
        });
      });
    });
  });

  /* Mobile nav */
  onReady(function () {
    var toggle = document.querySelector(".nav-toggle");
    var panel = document.getElementById("mobile-nav");
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  });

  /* Hero slides: js/hero-loader.js */

  /* Easing for counters */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  var SESSION_VISIT_KEY = "ld_session_visit_v2";
  var SESSION_DIGITAL_KEY = "ld_session_digital_v2";

  function storageGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key) {
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) {
      if (key === SESSION_VISIT_KEY) window.__ldVisitDone = true;
      if (key === SESSION_DIGITAL_KEY) window.__ldDigitalDone = true;
    }
  }

  function hasSessionFlag(key) {
    if (key === SESSION_VISIT_KEY && window.__ldVisitDone) return true;
    if (key === SESSION_DIGITAL_KEY && window.__ldDigitalDone) return true;
    return !!storageGet(key);
  }

  function fetchSiteStats() {
    var client = window.ldSupabase;
    if (!client) return Promise.resolve();
    return client
      .from("site_stats")
      .select("key, value")
      .then(function (res) {
        if (res.error || !res.data || !res.data.length) return;
        var map = {};
        for (var i = 0; i < res.data.length; i++) {
          map[res.data[i].key] = res.data[i].value;
        }
        document.querySelectorAll("[data-stat-key]").forEach(function (el) {
          var k = el.getAttribute("data-stat-key");
          if (k != null && map[k] != null) {
            el.setAttribute("data-target", String(map[k]));
          }
        });
        var dc = document.getElementById("digital-counter");
        if (dc && map.digital_interactions != null) {
          dc.setAttribute("aria-label", String(map.digital_interactions));
        }
      });
  }

  /** زيارة واحدة لكل جلسة متصفح، ثم جلب الأرقام من القاعدة */
  function recordVisitThenFetchStats() {
    var client = window.ldSupabase;
    if (!client) return fetchSiteStats();
    if (hasSessionFlag(SESSION_VISIT_KEY)) return fetchSiteStats();
    return client
      .rpc("increment_site_stat", { stat_key: "stat_visits" })
      .then(function (res) {
        if (res.error) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("LD stat_visits:", res.error.message);
          }
        } else {
          storageSet(SESSION_VISIT_KEY);
        }
        return fetchSiteStats();
      })
      .catch(function () {
        return fetchSiteStats();
      });
  }

  function animateValue(el, target, suffix, duration) {
    var start = 0;
    var startTime = null;

    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      var eased = easeOutQuart(p);
      var val = Math.round(eased * target);
      if (target >= 1000) {
        el.textContent = val.toLocaleString("en-US") + (suffix || "");
      } else {
        el.textContent = String(val) + (suffix || "");
      }
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        if (target >= 1000) {
          el.textContent = target.toLocaleString("en-US") + (suffix || "");
        } else {
          el.textContent = String(target) + (suffix || "");
        }
      }
    }

    if (prefersReducedMotion) {
      if (target >= 1000) {
        el.textContent = target.toLocaleString("en-US") + (suffix || "");
      } else {
        el.textContent = String(target) + (suffix || "");
      }
      return;
    }
    requestAnimationFrame(step);
  }

  /* Stat counters + digital strip (زيارة مسجّلة ثم أرقام من القاعدة) */
  onReady(function () {
    recordVisitThenFetchStats().finally(function () {
      runStatCounters();
      runDigitalStrip();
    });
  });

  function runStatCounters() {
    var counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    function run() {
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-target"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        if (isNaN(target)) return;
        animateValue(el, target, suffix, 1600);
      });
    }

    if (prefersReducedMotion) {
      run();
      return;
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    var statsSection = document.getElementById("stats");
    if (statsSection) obs.observe(statsSection);
    else run();
  }

  function runDigitalStrip() {
    var wrap = document.getElementById("digital-counter");
    if (!wrap) return;

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.disconnect();

          var client = window.ldSupabase;
          var needBump = client && !hasSessionFlag(SESSION_DIGITAL_KEY);

          function parseTarget() {
            return parseInt(wrap.getAttribute("data-target"), 10) || 30335;
          }

          function syncBoxes(target) {
            var digitStr = String(target).split("");
            var boxes = wrap.querySelectorAll(".digit-box");
            while (boxes.length < digitStr.length) {
              var s = document.createElement("span");
              s.className = "digit-box";
              wrap.appendChild(s);
              boxes = wrap.querySelectorAll(".digit-box");
            }
            while (wrap.querySelectorAll(".digit-box").length > digitStr.length) {
              var all = wrap.querySelectorAll(".digit-box");
              wrap.removeChild(all[all.length - 1]);
            }
            return { boxes: wrap.querySelectorAll(".digit-box"), digits: digitStr };
          }

          function setDigits(boxes, arr) {
            arr.forEach(function (ch, i) {
              if (boxes[i]) boxes[i].textContent = ch;
            });
          }

          function playAnimation(target) {
            var synced = syncBoxes(target);
            var boxes = synced.boxes;
            var digits = synced.digits;
            wrap.setAttribute("aria-label", String(target));

            if (prefersReducedMotion) {
              setDigits(boxes, digits);
              return;
            }

            var current = 0;
            var dur = 2000;
            var start = null;

            function frame(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / dur, 1);
              current = Math.round(easeOutQuart(p) * target);
              setDigits(
                boxes,
                String(current).padStart(digits.length, "0").split("")
              );
              if (p < 1) requestAnimationFrame(frame);
              else setDigits(boxes, digits);
            }
            requestAnimationFrame(frame);
          }

          if (needBump) {
            client
              .rpc("increment_site_stat", { stat_key: "digital_interactions" })
              .then(function (res) {
                if (!res.error) {
                  storageSet(SESSION_DIGITAL_KEY);
                  if (res.data != null) {
                    var n =
                      typeof res.data === "number"
                        ? res.data
                        : parseInt(res.data, 10);
                    if (!isNaN(n)) {
                      wrap.setAttribute("data-target", String(n));
                    }
                  }
                } else if (typeof console !== "undefined" && console.warn) {
                  console.warn("LD digital_interactions:", res.error.message);
                }
                playAnimation(parseTarget());
              })
              .catch(function () {
                playAnimation(parseTarget());
              });
          } else {
            playAnimation(parseTarget());
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(wrap);
  }

  /* Portfolio filters + horizontal slider (يدعم بطاقات ديناميكية من portfolio-loader) */
  function portfolioVisibleCards(slider) {
    return [].slice.call(slider.querySelectorAll(".portfolio-card")).filter(function (c) {
      return !c.classList.contains("is-hidden");
    });
  }

  function initPortfolioSlider() {
    var section = document.getElementById("portfolio");
    var slider = document.getElementById("portfolio-slider");
    var wrap = document.querySelector(".portfolio-slider-wrap");
    if (!section || !slider || !wrap) return;

    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function resetScrollToStart() {
      var vis = portfolioVisibleCards(slider);
      if (!vis.length) return;
      vis[0].scrollIntoView({ block: "nearest", inline: "start", behavior: "auto" });
    }

    function updateNoScrollClass() {
      wrap.classList.toggle("is-no-scroll", slider.scrollWidth <= slider.clientWidth + 6);
    }

    function stepCarousel(direction) {
      var vis = portfolioVisibleCards(slider);
      if (!vis.length) return;
      var behavior = mqReduce.matches ? "auto" : "smooth";
      var box = slider.getBoundingClientRect();
      var idx = 0;
      var maxOverlap = 0;
      vis.forEach(function (card, i) {
        var r = card.getBoundingClientRect();
        var o = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        if (o > maxOverlap) {
          maxOverlap = o;
          idx = i;
        }
      });
      var nextIdx = idx + direction;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= vis.length) nextIdx = vis.length - 1;
      if (nextIdx === idx) return;
      vis[nextIdx].scrollIntoView({ block: "nearest", inline: "start", behavior: behavior });
    }

    if (!section.dataset.ldPortfolioBound) {
      section.dataset.ldPortfolioBound = "1";
      section.addEventListener("click", function (e) {
        var chip = e.target.closest(".filter-chips .chip");
        if (chip) {
          var f = chip.getAttribute("data-filter");
          section.querySelectorAll(".filter-chips .chip").forEach(function (c) {
            c.classList.toggle("is-active", c === chip);
          });
          slider.querySelectorAll(".portfolio-card").forEach(function (card) {
            var cat = card.getAttribute("data-category");
            var show = f === "all" || cat === f;
            card.classList.toggle("is-hidden", !show);
          });
          resetScrollToStart();
          requestAnimationFrame(updateNoScrollClass);
          return;
        }
        if (e.target.closest(".portfolio-slider-btn--prev")) stepCarousel(-1);
        if (e.target.closest(".portfolio-slider-btn--next")) stepCarousel(1);
      });

      slider.addEventListener("scroll", updateNoScrollClass, { passive: true });
      window.addEventListener("resize", updateNoScrollClass, { passive: true });
      document.addEventListener("ld-lang-change", function () {
        requestAnimationFrame(updateNoScrollClass);
      });

      slider.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        stepCarousel(e.key === "ArrowRight" ? 1 : -1);
      });
    }

    resetScrollToStart();
    updateNoScrollClass();
  }

  window.LD_reinitPortfolio = initPortfolioSlider;

  onReady(function () {
    initPortfolioSlider();
  });

  /* Ripple on interactive elements */
  onReady(function () {
    if (prefersReducedMotion) return;
    var selector =
      "a.btn, button.btn, .chip, .portfolio-card, .portfolio-slider-btn, .service-card, .value-card, .stat-item, .table-row, .testimonial-card, .faq-item summary, .nav-desktop .nav-list a, .nav-mobile-list a, .lang-btn, .hero-arrow, .hero-dot, .fab-download, .footer-links a, a.portfolio-link, .header-phone, .brand, .skip-link, .contact-form button[type='submit'], .nav-toggle";
    document.addEventListener(
      "click",
      function (e) {
        var host = e.target.closest(selector);
        if (!host) return;
        createRipple(host, e);
      },
      false
    );

    function createRipple(host, e) {
      var rect = host.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var size = Math.max(rect.width, rect.height) * 0.95;
      var span = document.createElement("span");
      span.className = "ripple-wave";
      var primaryLike =
        host.classList.contains("btn-primary") ||
        host.classList.contains("fab-download") ||
        host.classList.contains("hero-arrow") ||
        (host.classList.contains("chip") && host.classList.contains("is-active"));
      span.style.background = primaryLike
        ? "rgba(255, 255, 255, 0.32)"
        : "rgba(14, 74, 255, 0.16)";
      span.style.width = span.style.height = size + "px";
      span.style.left = x - size / 2 + "px";
      span.style.top = y - size / 2 + "px";
      host.classList.add("ripple-host");
      host.appendChild(span);
      window.setTimeout(function () {
        if (span.parentNode) span.parentNode.removeChild(span);
      }, 620);
    }
  });

  /* Contact — Supabase مع احتياطي mailto */
  onReady(function () {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var statusEl = document.getElementById("contact-form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    function showFormStatus(kind, message) {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = message;
      statusEl.classList.remove("is-success", "is-error");
      if (kind === "success") statusEl.classList.add("is-success");
      else if (kind === "error") statusEl.classList.add("is-error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (document.getElementById("cf-name") || {}).value || "";
      var email = (document.getElementById("cf-email") || {}).value || "";
      var msg = (document.getElementById("cf-msg") || {}).value || "";
      var lang = window.LD_I18N ? window.LD_I18N.getLang() : "ar";
      var t = function (key) {
        return window.LD_I18N ? window.LD_I18N.t(lang, key) : key;
      };

      function mailtoFallback() {
        var subj =
          lang === "ckb"
            ? "پەیام لە ماڵپەڕی Laptop Duhok"
            : "رسالة من موقع Laptop Duhok";
        var body =
          (lang === "ckb" ? "ناو: " : "الاسم: ") +
          name +
          "\n" +
          (lang === "ckb" ? "ئیمەیڵ: " : "البريد: ") +
          email +
          "\n\n" +
          msg;
        var href =
          "mailto:info@laptopduhok.example.com?subject=" +
          encodeURIComponent(subj) +
          "&body=" +
          encodeURIComponent(body);
        window.location.href = href;
      }

      var client = window.ldSupabase;
      if (!client) {
        mailtoFallback();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
      }
      showFormStatus("", t("contact.sending"));

      client
        .from("contact_messages")
        .insert({
          name: name.trim(),
          email: email.trim() || null,
          message: msg.trim(),
          locale: lang,
        })
        .then(function (res) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-busy");
          }
          if (res.error) {
            showFormStatus("error", t("contact.send_err"));
            return;
          }
          showFormStatus("success", t("contact.send_ok"));
          form.reset();
        })
        .catch(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-busy");
          }
          showFormStatus("error", t("contact.send_err"));
        });
    });
  });

  /* PWA — تسجيل Service Worker (لا يعمل من file://) */
  onReady(function () {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {});
  });

  /* وضع التطبيق المثبت (PWA / iOS) + شريط التبويب السفلي */
  onReady(function () {
    try {
      var iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
      var displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (displayStandalone || iosStandalone) {
        document.documentElement.classList.add("app-standalone");
        if (document.body) document.body.classList.add("app-standalone-body");
      }
    } catch (e) {}

    function syncAppTabs() {
      var bar = document.querySelector("[data-app-tabbar]");
      if (!bar) return;
      var path = (location.pathname || "").replace(/\\/g, "/");
      var file = path.split("/").pop() || "";
      var hash = (location.hash || "").toLowerCase();
      var name = "home";
      if (file === "services.html") name = "services";
      else if (file.indexOf("cashier") !== -1) name = "cashier";
      else if (file === "shop.html") name = "shop";
      else if ((file === "" || file === "index.html") && hash === "#contact") name = "contact";
      bar.querySelectorAll(".app-tab[data-app-tab]").forEach(function (a) {
        var on = a.getAttribute("data-app-tab") === name;
        a.classList.toggle("is-active", on);
        a.setAttribute("aria-current", on ? "page" : "false");
      });
    }
    syncAppTabs();
    window.addEventListener("hashchange", syncAppTabs);
  });
})();
