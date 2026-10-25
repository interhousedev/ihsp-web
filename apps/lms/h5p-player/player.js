// Runs inside the sandboxed iframe (sandbox="allow-scripts", opaque origin). It only talks to the parent through
// postMessage; the parent checks source and origin ("null") and the shape of every message.
;(function () {
  var params = new URLSearchParams(location.hash.slice(1))
  var base = params.get("base") || ""
  // The parent's origin, named by the parent in the hash: messages go to that origin only, never to "*".
  var parentOrigin = params.get("origin") || ""
  var VERBS = {
    "http://adlnet.gov/expapi/verbs/completed": true,
    "http://adlnet.gov/expapi/verbs/answered": true,
  }
  function send(message) {
    if (parentOrigin) parent.postMessage(message, parentOrigin)
  }
  function onXapi(event) {
    var statement = event && event.data && event.data.statement
    if (!statement || !statement.verb || !VERBS[statement.verb.id]) return
    var parents = statement.context && statement.context.contextActivities && statement.context.contextActivities.parent
    if (parents && parents.length > 0) return
    var result = statement.result
    if (!result || !result.score) return
    send({
      type: "ihsp-h5p-xapi",
      verb: statement.verb.id,
      score: { raw: result.score.raw, max: result.score.max },
      completion: result.completion === true,
    })
  }
  function reportSize() {
    send({ type: "ihsp-h5p-size", height: document.documentElement.scrollHeight })
  }
  if (!base || base.indexOf("/v1/lms/h5p/") === -1) return
  var player = new H5PStandalone.H5P(document.getElementById("h5p"), {
    id: params.get("id") || "h5p",
    h5pJsonPath: base,
    contentJsonPath: base + "/content",
    librariesPath: base,
    frameJs: "/h5p-player/frame.bundle.js",
    frameCss: "/h5p-player/styles/h5p.css",
    frame: false,
    copyright: false,
    export: false,
    embed: false,
    fullScreen: false,
  })
  Promise.resolve(player).then(function () {
    if (window.H5P && window.H5P.externalDispatcher) window.H5P.externalDispatcher.on("xAPI", onXapi)
  })
  if (window.ResizeObserver) new ResizeObserver(reportSize).observe(document.body)
})()
