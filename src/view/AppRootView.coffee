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
      R.div {className: "Shader"},
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
