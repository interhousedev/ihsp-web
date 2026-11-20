// Texts of offline.html (the app's own i18n is not available without the network).
;(function () {
  var texts = {
    en: ["You are offline. This page was not saved on your device yet.", "Try again"],
    ru: ["Нет сети. Эта страница ещё не сохранена на устройстве.", "Повторить"],
    uz: ["Internet yoʻq. Bu sahifa qurilmangizda hali saqlanmagan.", "Qayta urinish"],
  }
  var stored = null
  try {
    stored = localStorage.getItem("ihsp.locale")
  } catch (_error) {}
  var language = (stored || navigator.language || "ru").slice(0, 2)
  var pair = texts[language] || texts.ru
  document.documentElement.lang = texts[language] ? language : "ru"
  document.querySelector("[data-lang]").textContent = pair[0]
  var button = document.querySelector("[data-reload]")
  button.textContent = pair[1]
  button.addEventListener("click", function () {
    location.href = "/"
  })
})()
