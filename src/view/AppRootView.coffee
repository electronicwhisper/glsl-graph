initialSrc = """
float draw(float x) {
  return sin(x);
}
"""



model = {
  src: initialSrc
}







R.create "AppRootView",
  render: ->
    R.div {className: "Code"},
      R.CodeMirrorView {
        value: model.src
        onChange: @_codeChange
      }

  _codeChange: (newValue) ->
    model.src = newValue
    refresh()
