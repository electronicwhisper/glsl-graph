initialSrc = """
vec4 draw(vec2 p) {
  return vec4(p.x, p.y, 0., 1.);
}
"""



model = {
  src: initialSrc
  center: [0, 0]
  pixelSize: .01
}







R.create "AppRootView",
  render: ->
    R.div {},
      R.div {className: "Shader", onMouseDown: @_startPan},
        R.ShaderView {
          src: model.src
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
          onChange: @_codeChange
        }

  _codeChange: (newValue) ->
    model.src = newValue
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






startDrag = (callback) ->
  move = (e) ->
    callback(e)
  up = (e) ->
    document.removeEventListener("mousemove", move)
    document.removeEventListener("mouseup", up)
  document.addEventListener("mousemove", move)
  document.addEventListener("mouseup", up)
