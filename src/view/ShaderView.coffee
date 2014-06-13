Glod = require("./Glod")

createProgramFromSrc = (glod, name, vertex, fragment) ->
  Glod.preprocessed[name] = {name, fragment, vertex}

  delete glod._programs[name]
  glod.createProgram(name)




colorMap = {}
colorMap.vertex = """
precision highp float;
precision highp int;

attribute vec4 gg_vertexPosition;
uniform vec2 gg_translate;
uniform vec2 gg_scale;
varying vec2 gg_position;

void main() {
  gl_Position = vec4(gg_vertexPosition);

  gg_position = gg_vertexPosition.xy * gg_scale + gg_translate;
}
"""
colorMap.fragment = """
precision highp float;
precision highp int;

varying vec2 gg_position;

// INSERT

void main() {
  gl_FragColor = draw(gg_position);
}
"""


R.create "ShaderView",
  propTypes:
    src: String
    center: Array
    pixelSize: Number

  render: ->
    R.canvas {}

  componentDidMount: ->
    @_init()
    @_draw()

  componentDidUpdate: ->
    @_draw()

  shouldComponentUpdate: (nextProps) ->
    !_.isEqual(@props, nextProps)

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

    canvas = @getDOMNode()
    width = canvas.width
    height = canvas.height

    translate = @center
    scale = [(width/2) * @pixelSize, (height/2) * @pixelSize]

    @_glod
      .begin("program")
      .pack("quad", "gg_vertexPosition")
      .valuev("gg_translate", translate)
      .valuev("gg_scale", scale)
      .ready().triangles().drawArrays(0, 6)
      .end()











