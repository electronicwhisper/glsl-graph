initialSrc = """
vec4 draw(vec2 p) {
  return vec4(sin(p.x), p.y, 0., 1.);
}
"""



model = {
  src: initialSrc
}







R.create "AppRootView",
  render: ->
    R.div {},
      R.div {className: "Shader"},
        R.ShaderView {
          src: model.src
        }
      R.div {className: "Code"},
        R.CodeMirrorView {
          value: model.src
          onChange: @_codeChange
        }

  _codeChange: (newValue) ->
    model.src = newValue
    refresh()
