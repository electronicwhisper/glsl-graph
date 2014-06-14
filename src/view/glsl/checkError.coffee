Glod = require("../Glod")
glslParseError = require("./glslParseError")

createProgramFromSrc = (glod, name, vertex, fragment) ->
  Glod.preprocessed[name] = {name, fragment, vertex}

  delete glod._programs[name]
  glod.createProgram(name)

canvas = document.createElement("canvas")
glod = new Glod()

glod.canvas(canvas)

vertexSrc = """
precision highp float;
precision highp int;

void main() {
  gl_Position = vec4(0., 0., 0., 1.);
}
"""

fragmentSrc = """
precision highp float;
precision highp int;

// INSERT

void main() {
  gl_FragColor = vec4(0., 0., 0., 1.);
}
"""

module.exports = checkError = (src) ->
  fragment = fragmentSrc.replace("// INSERT", src)

  try
    createProgramFromSrc(glod, "tester", vertexSrc, fragment)
  catch err
    if err.data
      errors = glslParseError(err.data)
      lineOffset = 3
      for error in errors
        error.line -= lineOffset

      return errors

  return []


