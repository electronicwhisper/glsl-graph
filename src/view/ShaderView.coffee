Glod = require("./Glod")

createProgramFromSrc = (glod, name, vertex, fragment) ->
  Glod.preprocessed[name] = {name, fragment, vertex}

  delete glod._programs[name]
  glod.createProgram(name)

bufferQuad = (glod) ->
  glod
    .createVBO("quad")
    .uploadCCWQuad("quad")

bufferCartesianSamples = (glod, numSamples) ->
  samplesArray = []
  for i in [0..numSamples]
    samplesArray.push(i)

  if glod.hasVBO("samples")
    glod.deleteVBO("samples")

  glod
    .createVBO("samples")
    .bufferDataStatic("samples", new Float32Array(samplesArray))



cartesian = {}
cartesian.vertex = """
precision highp float;
precision highp int;

attribute float gg_sample;

uniform float gg_start, gg_step;
uniform vec2 gg_translate;
uniform vec2 gg_scale;

// INSERT

void main() {
  float x = gg_start + gg_step * gg_sample;
  float y = draw(x);

  vec2 position = (vec2(x, y) - gg_translate) / gg_scale;
  gl_Position = vec4(position, 0., 1.);
}
"""
cartesian.fragment = """
precision highp float;
precision highp int;

void main() {
  gl_FragColor = vec4(0., 0., 0., 1.);
}
"""





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

    # Buffer
    bufferQuad(@_glod)
    bufferCartesianSamples(@_glod, 20000)

  _draw: ->
    # @_drawColorMap()
    @_drawCartesian()

  _drawColorMap: ->
    vertex = colorMap.vertex
    fragment = colorMap.fragment.replace("// INSERT", @src)

    @_createProgram(vertex, fragment)

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

  _drawCartesian: ->
    vertex = cartesian.vertex.replace("// INSERT", @src)
    fragment = cartesian.fragment

    @_createProgram(vertex, fragment)

    canvas = @getDOMNode()
    width = canvas.width
    height = canvas.height

    translate = @center
    scale = [(width/2) * @pixelSize, (height/2) * @pixelSize]

    start = @center[0] - (width / 2) * @pixelSize
    step = @pixelSize * config.resolution
    numSamples = width / config.resolution

    @_glod
      .begin("program")
      .pack("samples", "gg_sample")
      .valuev("gg_translate", translate)
      .valuev("gg_scale", scale)
      .value("gg_start", start)
      .value("gg_step", step)
      .ready().lineStrip().drawArrays(0, numSamples)
      .end()

  _createProgram: (vertex, fragment) ->
    if vertex != @_lastVertex or fragment != @_lastFragment
      try
        createProgramFromSrc(@_glod, "program", vertex, fragment)
      @_lastVertex = vertex
      @_lastFragment = fragment



