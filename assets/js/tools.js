/* tools.js — tab utama (Buat QR / Scan QR) dengan dukungan keyboard & #hash. */
(function () {
    "use strict";

    var KQR = window.KQR;
    if (!KQR) return;
    var $ = KQR.$;

    var NAMES = ["generate", "scan"];
    var tabs = {};

    function show(name, updateHash) {
        if (NAMES.indexOf(name) === -1) name = "generate";

        NAMES.forEach(function (n) {
            var active = n === name;
            tabs[n].btn.setAttribute("aria-selected", active ? "true" : "false");
            tabs[n].btn.tabIndex = active ? 0 : -1;
            tabs[n].panel.hidden = !active;
        });

        if (name !== "scan" && KQR.scanner) KQR.scanner.stopCamera();

        if (updateHash && window.history && history.replaceState) {
            history.replaceState(null, "", window.location.pathname + window.location.search + (name === "scan" ? "#scan" : ""));
        }
    }

    function fromHash() {
        return window.location.hash === "#scan" ? "scan" : "generate";
    }

    function init() {
        if (!$("panel-generate")) return;

        NAMES.forEach(function (n) {
            tabs[n] = { btn: $("tab-" + n), panel: $("panel-" + n) };
            tabs[n].btn.addEventListener("click", function () { show(n, true); });
            tabs[n].btn.addEventListener("keydown", function (e) {
                var i = NAMES.indexOf(n);
                var next = null;
                if (e.key === "ArrowRight") next = NAMES[(i + 1) % NAMES.length];
                else if (e.key === "ArrowLeft") next = NAMES[(i - 1 + NAMES.length) % NAMES.length];
                else if (e.key === "Home") next = NAMES[0];
                else if (e.key === "End") next = NAMES[NAMES.length - 1];
                if (next) {
                    e.preventDefault();
                    show(next, true);
                    tabs[next].btn.focus();
                }
            });
        });

        // Di layar lebar, panel kustomisasi langsung terbuka agar mudah ditemukan
        var custom = document.querySelector(".ws-custom");
        if (custom && window.matchMedia && window.matchMedia("(min-width: 960px)").matches) custom.open = true;

        window.addEventListener("hashchange", function () { show(fromHash(), false); });
        show(fromHash(), false);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
