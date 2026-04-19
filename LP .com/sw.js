/**
 * Service Worker — PWA: صفحة offline + تمرير الطلبات الأخرى للشبكة
 * يعمل على HTTPS أو localhost فقط (ليس file://)
 */
var CACHE_VERSION = "ld-app-v4";
var OFFLINE_CACHE = "ld-offline-" + CACHE_VERSION;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then(function (cache) {
      return cache.addAll(["offline.html"]).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key.startsWith("ld-offline-") && key !== OFFLINE_CACHE) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  /* صفحات HTML فقط — عند انقطاع الشبكة نعرض offline.html المحفوظة */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match("offline.html");
      })
    );
    return;
  }

  event.respondWith(fetch(req));
});
