/*
 * IHSP widget SDK: talks to the LMS page that frames an author-made HTML widget.
 * Copy ihsp-widget.js (and ihsp-widget.css) into the widget .zip next to index.html and load it with
 *   <script src="ihsp-widget.js"></script>
 * The widget runs in a sandbox (scripts and popups only): no network, cookies or storage; postMessage is the only way out.
 *
 *   IHSP.reportScore(85)            score 0..100; passed when score >= IHSP.passPct (default 100)
 *   IHSP.reportScore(85, true)      score with an explicit pass
 *   IHSP.resize()                   tell the page the current content height (also automatic)
 *   IHSP.lang                       "uz" | "ru" | "en" (from the player, default "uz")
 *   IHSP.theme                      "light" | "dark"
 *   IHSP.t({ uz: "...", ru: "...", en: "..." })   pick the text of the current language
 */
;(function () {
  "use strict"
  var params = new URLSearchParams(location.hash.slice(1))
  var lang = /^(uz|ru|en)$/.test(params.get("lang") || "") ? params.get("lang") : "uz"
  var theme = params.get("theme") === "dark" ? "dark" : "light"
  document.documentElement.lang = lang
  document.documentElement.setAttribute("data-theme", theme)

  function post(message) {
    // The page checks that the message comes from this very frame; "*" is required because the sandboxed widget has
    // an opaque origin and cannot name the page's origin.
    if (window.parent !== window) window.parent.postMessage(message, "*")
  }

  var lastHeight = 0
  function resize() {
    // The body, not the document: the document is at least as tall as the frame, so it could never shrink.
    var body = document.body
    if (!body) return
    var style = getComputedStyle(body)
    var height = Math.ceil(
      body.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
    )
    if (height === lastHeight) return
    lastHeight = height
    post({ type: "ihsp-widget-size", height: height })
  }

  var IHSP = {
    version: "1",
    lang: lang,
    theme: theme,
    passPct: 100,
    reportScore: function (pct, passed) {
      var score = Math.max(0, Math.min(100, Number(pct)))
      if (!isFinite(score)) throw new TypeError("IHSP.reportScore: score must be a number from 0 to 100")
      post({
        type: "ihsp-widget-result",
        score_pct: score,
        passed: typeof passed === "boolean" ? passed : score >= IHSP.passPct,
      })
    },
    resize: resize,
    t: function (texts) {
      return (texts && (texts[lang] || texts.uz || texts.en || texts.ru)) || ""
    },
  }
  window.IHSP = IHSP

  function start() {
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(document.body)
    resize()
  }
  window.addEventListener("load", resize)
  if (document.readyState !== "loading") start()
  else document.addEventListener("DOMContentLoaded", start)
})()
