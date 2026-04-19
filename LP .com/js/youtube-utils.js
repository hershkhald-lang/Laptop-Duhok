/**
 * Laptop Duhok — استخراج معرّف فيديو يوتيوب وبناء رابط التضمين (embed)
 * استخراج المعرف: معرّف 11 حرفاً، watch?v=، youtu.be، /embed/، shorts، live
 * رابط العرض: https://www.youtube.com/embed/{id}?…
 */
(function (w) {
  function extractYoutubeVideoId(raw) {
    if (raw == null) return "";
    var s = String(raw).trim();
    if (!s) return "";
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    var patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
      /\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
      /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = s.match(patterns[i]);
      if (m) return m[1];
    }
    return "";
  }

  function buildYoutubeEmbedUrl(videoIdOrRaw) {
    var id = extractYoutubeVideoId(videoIdOrRaw);
    if (!id) return "";
    var parts = [
      "autoplay=1",
      "rel=0",
      "modestbranding=1",
      "playsinline=1",
      "enablejsapi=1"
    ];
    return "https://www.youtube.com/embed/" + encodeURIComponent(id) + "?" + parts.join("&");
  }

  w.LD_extractYoutubeVideoId = extractYoutubeVideoId;
  w.LD_buildYoutubeEmbedUrl = buildYoutubeEmbedUrl;
})(window);
