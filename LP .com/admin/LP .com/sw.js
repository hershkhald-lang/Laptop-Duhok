/**
 * Service worker — يدعم تثبيت PWA؛ عند النشر استبدل باستراتيجية كاش أو احذف إن لم تُرد وضعاً دون اتصال.
 */
var CACHE_VERSION = "ld-app-v3";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
