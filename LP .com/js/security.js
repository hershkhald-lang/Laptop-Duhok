/**
 * Laptop Duhok — تخفيف سطحي: منع القائمة السياقية واختصارات أدوات المطور الشائعة.
 * لا يمنع المستخدم المُصرّ؛ الحماية الحقيقية عبر RLS والخادم وCSP.
 */
(function () {
  "use strict";

  document.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (e) {
      var k = e.key || "";
      var code = e.keyCode || e.which;

      if (code === 123 || k === "F12") {
        e.preventDefault();
        return;
      }

      if (e.ctrlKey && e.shiftKey) {
        var u = k.toUpperCase();
        if (u === "I" || u === "J" || u === "C") {
          e.preventDefault();
          return;
        }
      }

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        var u2 = k.toUpperCase();
        if (u2 === "U") {
          e.preventDefault();
          return;
        }
      }

      if (e.metaKey && e.altKey) {
        var u3 = k.toLowerCase();
        if (u3 === "i" || u3 === "j" || u3 === "c") {
          e.preventDefault();
        }
      }
    },
    true
  );
})();
