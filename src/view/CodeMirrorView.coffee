R.create "CodeMirrorView",
  propTypes:
    value: String
    errors: Array
    onChange: Function

  render: ->
    R.div {style: {width: "100%", height: "100%"}}

  _init: ->
    el = @getDOMNode()
    rect = el.getBoundingClientRect()

    @_cm = CodeMirror(el, {
      value: @value
      mode: "text/x-glsl"
      lineNumbers: true
    })
    @_cm.setSize("100%", rect.height)
    @_cm.on("change", @_onChange)

  _update: ->
    if @_cm.getValue() != @value
      @_cm.setValue(@value)

    for line in [0 ... @_cm.lineCount()]
      @_cm.removeLineClass(line, "wrap")

    for error in @errors
      @_cm.addLineClass(error.line, "wrap", "LineError")

  _onChange: ->
    newValue = @_cm.getValue()
    @onChange(newValue)

  componentDidMount: ->
    @_init()

  componentDidUpdate: ->
    @_update()
