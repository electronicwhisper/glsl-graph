glslCheckError = require("./glsl/glslCheckError")





# initialSrc = """
# vec4 draw(vec2 p) {
#   return vec4(p.x, p.y, 0., 1.);
# }
# """
initialSrc = """
float draw(float x) {
  return fract(x);
}
"""



model = {
  src: initialSrc
  errors: []
  center: [0, 0]
  pixelSize: .01
}







R.create "AppRootView",
  render: ->
    R.div {},
      R.div {className: "Shader", onMouseDown: @_startPan, onWheel: @_onWheel},
        R.ShaderView {
          src: model.src
          errors: model.errors
          center: model.center
          pixelSize: model.pixelSize
        }
        R.GridView {
          center: model.center
          pixelSize: model.pixelSize
        }
      R.div {className: "Code"},
        R.CodeMirrorView {
          value: model.src
          errors: model.errors
          onChange: @_codeChange
        }

  _codeChange: (newValue) ->
    model.src = newValue
    model.errors = glslCheckError(model.src)
    refresh()

  _startPan: (e) ->
    e.preventDefault()

    lastX = e.clientX
    lastY = e.clientY
    startDrag (e) =>
      x = e.clientX
      y = e.clientY
      model.center = [
        model.center[0] - (x - lastX) * model.pixelSize
        model.center[1] + (y - lastY) * model.pixelSize
      ]
      lastX = x
      lastY = y

  _onWheel: (e) ->
    e.preventDefault()

    return if Math.abs(e.deltaY) <= 1
    scaleFactor = 1.1
    scaleFactor = 1 / scaleFactor if e.deltaY < 0

    rect = e.target.getBoundingClientRect()
    zoomCenter = [
      model.center[0] + (e.clientX - (rect.left + rect.width / 2)) * model.pixelSize
      model.center[1] - (e.clientY - (rect.top + rect.height / 2)) * model.pixelSize
    ]

    offset = numeric.sub(model.center, zoomCenter)
    model.center = numeric.add(
      zoomCenter
      numeric.mul(offset, scaleFactor)
    )

    model.pixelSize *= scaleFactor




startDrag = (callback) ->
  move = (e) ->
    callback(e)
  up = (e) ->
    document.removeEventListener("mousemove", move)
    document.removeEventListener("mouseup", up)
  document.addEventListener("mousemove", move)
  document.addEventListener("mouseup", up)
