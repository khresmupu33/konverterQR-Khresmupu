/* theme-init.js — dijalankan di <head> sebelum render agar tidak ada "kilat" tema. */
(function () {
    var theme = "light";
    try {
        theme = localStorage.getItem("kqr-theme") || localStorage.getItem("theme") || "";
        if (theme !== "dark" && theme !== "light") {
            theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
    } catch (e) {
        theme = "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
})();
