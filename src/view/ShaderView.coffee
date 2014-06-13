Glod = require("./Glod")

createProgramFromSrc = (glod, name, vertex, fragment) ->
  Glod.preprocessed[name] = {name, fragment, vertex}

  delete glod._programs[name]
  glod.createProgram(name)




colorMap = {}
colorMap.vertex = """
precision highp float;
precision highp int;

attribute vec4 vertexPosition;
varying vec2 position;

void main() {
  gl_Position = vec4(vertexPosition);
  position = (vertexPosition.xy + 1.0) * 0.5;
}
"""
colorMap.fragment = """
precision highp float;
precision highp int;

varying vec2 position;

// INSERT

void main() {
  gl_FragColor = draw(position);
}
"""


R.create "ShaderView",
  propTypes:
    src: String

  render: ->
    R.canvas {}

  componentDidMount: ->
    @_init()
    @_draw()

  componentDidUpdate: ->
    @_draw()

  shouldComponentUpdate: (nextProps) ->
    @src != nextProps.src

  _init: ->
    canvas = @getDOMNode()

    # Size it
    rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    # Create glod
    @_glod = new Glod()
    @_glod.canvas(canvas, {antialias: true})

    # Buffer quad
    @_glod
      .createVBO("quad")
      .uploadCCWQuad("quad")

  _draw: ->
    vertex = colorMap.vertex
    fragment = colorMap.fragment.replace("// INSERT", @src)

    try
      createProgramFromSrc(@_glod, "program", vertex, fragment)

    @_glod
      .begin("program")
      .pack("quad", "vertexPosition")
      .ready().triangles().drawArrays(0, 6)
      .end()











