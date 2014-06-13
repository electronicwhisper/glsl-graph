(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var eventName, refresh, refreshEventNames, refreshView, willRefreshNextFrame, _i, _len;

willRefreshNextFrame = false;

window.refresh = refresh = function() {
  if (willRefreshNextFrame) {
    return;
  }
  willRefreshNextFrame = true;
  return requestAnimationFrame(function() {
    refreshView();
    return willRefreshNextFrame = false;
  });
};

refreshView = function() {
  var appRootEl;
  appRootEl = document.querySelector("#AppRoot");
  return React.renderComponent(R.AppRootView(), appRootEl);
};

refreshEventNames = ["mousedown", "mousemove", "mouseup", "keydown", "scroll", "change", "wheel", "mousewheel"];

for (_i = 0, _len = refreshEventNames.length; _i < _len; _i++) {
  eventName = refreshEventNames[_i];
  window.addEventListener(eventName, refresh);
}

refresh();


},{}],2:[function(require,module,exports){
window.config = {
  resolution: 0.5,
  minGridSpacing: 90,
  gridColor: "204,194,163"
};


},{}],3:[function(require,module,exports){
require("./config");

require("./view/R");

require("./bootstrap");


},{"./bootstrap":1,"./config":2,"./view/R":8}],4:[function(require,module,exports){
var initialSrc, model, startDrag;

initialSrc = "vec4 draw(vec2 p) {\n  return vec4(p.x, p.y, 0., 1.);\n}";

model = {
  src: initialSrc,
  center: [0, 0],
  pixelSize: .01
};

R.create("AppRootView", {
  render: function() {
    return R.div({}, R.div({
      className: "Shader",
      onMouseDown: this._startPan
    }, R.ShaderView({
      src: model.src,
      center: model.center,
      pixelSize: model.pixelSize
    }), R.GridView({
      center: model.center,
      pixelSize: model.pixelSize
    })), R.div({
      className: "Code"
    }, R.CodeMirrorView({
      value: model.src,
      onChange: this._codeChange
    })));
  },
  _codeChange: function(newValue) {
    model.src = newValue;
    return refresh();
  },
  _startPan: function(e) {
    var lastX, lastY;
    e.preventDefault();
    lastX = e.clientX;
    lastY = e.clientY;
    return startDrag((function(_this) {
      return function(e) {
        var x, y;
        x = e.clientX;
        y = e.clientY;
        model.center = [model.center[0] - (x - lastX) * model.pixelSize, model.center[1] + (y - lastY) * model.pixelSize];
        lastX = x;
        return lastY = y;
      };
    })(this));
  }
});

startDrag = function(callback) {
  var move, up;
  move = function(e) {
    return callback(e);
  };
  up = function(e) {
    document.removeEventListener("mousemove", move);
    return document.removeEventListener("mouseup", up);
  };
  document.addEventListener("mousemove", move);
  return document.addEventListener("mouseup", up);
};


},{}],5:[function(require,module,exports){
R.create("CodeMirrorView", {
  propTypes: {
    value: String,
    onChange: Function
  },
  render: function() {
    return R.div({
      style: {
        width: "100%",
        height: "100%"
      }
    });
  },
  _init: function() {
    var el, rect;
    el = this.getDOMNode();
    rect = el.getBoundingClientRect();
    this._cm = CodeMirror(el, {
      value: this.value,
      mode: "text/x-glsl",
      lineNumbers: true
    });
    this._cm.setSize("100%", rect.height);
    return this._cm.on("change", this._onChange);
  },
  _update: function() {
    if (this._cm.getValue() !== this.value) {
      return this._cm.setValue(this.value);
    }
  },
  _onChange: function() {
    var newValue;
    newValue = this._cm.getValue();
    return this.onChange(newValue);
  },
  componentDidMount: function() {
    return this._init();
  },
  componentDidUpdate: function() {
    return this._update();
  }
});


},{}],6:[function(require,module,exports){
'use strict';

module.exports = Glod;

function GlodError(message, data) {
  this.message = message;
  this.data = data;
}
GlodError.prototype = Object.create(Error.prototype);

function die(message, data) {
  var error = new GlodError(message || 'Glod: die', data);

  // try {
  //   throw new Error(message || 'die');
  // }
  // catch(err) {
  //   error = err;
  // }

  // var line = error.stack.split('\n')[3];
  // var at = line.indexOf('at ');
  // var origin = line.slice(at + 3, line.length);

  // error.name = 'at ' + origin;

  throw error;
}

function Glod() {
  // Prevent instantiation without new.
  if (!Glod.prototype.isPrototypeOf(this)) {
    die('Glod: instantiate with `new Glod()`')
  }

  this._canvas            = null;
  this._gl                = null;
  this._vbos              = {};
  this._fbos              = {};
  this._rbos              = {};
  this._programs          = {};
  this._textures          = {};
  this._extensions        = {};

  this._variables         = {};

  this._mode              = -1;
  this._activeProgram     = null;
  this._contextLost       = false;
  this._onContextLost     = this.onContextLost.bind(this);
  this._onContextRestored = this.onContextRestored.bind(this);
  this.loseContext        = null;
  this.restoreContext     = null;
  this._initIds           = {};
  this._allocIds          = {};
  this._versionedIds      = {};

  this._optional  = {};
  this._optionalv = {};

  this._state = 0;
}

Glod.preprocessed = {};

// this should probably be called "cache shader" or something like that
Glod.preprocess = function(source) {
  var line_re      = /\n|\r/;
  var directive_re = /^\/\/!\s*(.*)$/;

  var vertex   = [];
  var fragment = [];

  var lines = source.split(line_re);

  var name = null;

  var section = "common";

  for (var i = 0; i < lines.length; i++) {
    var line  = lines[i];
    var match = directive_re.exec(line);

    if (match) {
      var tokens = match[1].split(/\s+/);

      switch(tokens[0]) {
        case "name":     name    = tokens[1];  break;
        case "common":   section = "common";   break;
        case "vertex":   section = "vertex";   break;
        case "fragment": section = "fragment"; break;
        default: die('gl.preprocess: bad directive: ' + tokens[0]);
      }
    }

    switch(section) {
      case "common":   vertex.push(line); fragment.push(line); break;
      case "vertex":   vertex.push(line); fragment.push(''  ); break;
      case "fragment": vertex.push(''  ); fragment.push(line); break;
    }
  }

  var fragment_src = fragment.join('\n');
  var vertex_src   = vertex  .join('\n');

  name         || die('gl.preprocess: no name');
  vertex_src   || die('gl.preprocess: no vertex source: ' + name);
  fragment_src || die('gl.preprocess: no fragment source: ' + name);

  var o = {
    name:     name,
    vertex:   vertex_src,
    fragment: fragment_src
  };

  Glod.preprocessed[o.name] && die('Glod: duplicate shader name: '+ o.name);
  Glod.preprocessed[o.name] = o;
};

Glod.prototype.isInactive      = function() { return this._state === 0;     };
Glod.prototype.isPreparing     = function() { return this._state === 1;     };
Glod.prototype.isDrawing       = function() { return this._state === 2;     };
Glod.prototype.isProgramActive = function() { return !!this._activeProgram; };

Glod.prototype.startInactive  = function() { this._state = 0; return this; };
Glod.prototype.startPreparing = function() { this._state = 1; return this; };
Glod.prototype.startDrawing   = function() { this._state = 2; return this; };

Glod.prototype.assertInactive      = function() { this.isInactive()      || this.outOfPhase(0); return this; };
Glod.prototype.assertPreparing     = function() { this.isPreparing()     || this.outOfPhase(1); return this; };
Glod.prototype.assertDrawing       = function() { this.isDrawing()       || this.outOfPhase(2); return this; };
Glod.prototype.assertProgramActive = function() { this.isProgramActive() || this.outOfPhase(1); return this; };

Glod.prototype.outOfPhase = function(expected, actual) {
  function s(n) {
    return n === 0 ? 'inactive'  :
           n === 1 ? 'preparing' :
           n === 2 ? 'drawing'   :
                     'unknown (' + n + ')';
  }

  die('Glod: out of phase: expected to be ' + s(expected) + ' but was ' + s(this._state));
};


// todo: print string names and type instead of [object WebGLProgram]
// function throwOnGLError(err, funcName, args) {
//   throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
// }

// function validateNoneOfTheArgsAreUndefined(functionName, args) {
//   for (var ii = 0; ii < args.length; ++ii) {
//     if (args[ii] === undefined) {
//       console.error("undefined passed to gl." + functionName + "(" +
//                     WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
//     }
//   }
// }

// function logGLCall(functionName, args) {
//   console.log("gl." + functionName + "(" +
//       WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
// }

// function logAndValidate(functionName, args) {
//   logGLCall(functionName, args);
//   validateNoneOfTheArgsAreUndefined (functionName, args);
// }


Glod.prototype.initContext = function() {
  var gl = this._gl;

  var supported = gl.getSupportedExtensions();

  for (var i = 0; i < supported.length; i++) {
    var name = supported[i];
    this._extensions[name] = gl.getExtension(name);
  }

  var lc = this.extension('WEBGL_lose_context');

  this.loseContext    = lc.loseContext.bind(lc);
  this.restoreContext = lc.restoreContext.bind(lc);
};

Glod.prototype.gl = function() {
  this._gl || die('Glod.gl: no gl context');
  return this._gl;
};

Glod.prototype.extension = function() {
  var l = arguments.length;
  for (var i = 0; i < l; i++) {
    var e = this._extensions[arguments[i]];
    if (e) return e;
  }
  die('Glod.extension: extension not found: ' + arguments);
};

Glod.prototype.canvas = function(canvas, options) {
  if (arguments.length === 0) {
    this.hasCanvas() || die('Glod.canvas: no canvas');
    return this._canvas;
  }

  if (this.hasCanvas()) {
    this._canvas.removeEventListener('webglcontextlost', this._onContextLost);
    this._canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
  }

  this._canvas = canvas || null;

  if (canvas && !this.hasCanvas()) {
    die('Glod.canvas: bad canvas: ' + canvas);
  }

  if (this.hasCanvas()) {
    this._canvas.addEventListener('webglcontextlost', this._onContextLost);
    this._canvas.addEventListener('webglcontextrestored', this._onContextRestored);
    var opts = options || { antialias: false };
    var gl = this._canvas.getContext('webgl', options);
    gl || (gl = this._canvas.getContext('experimental-webgl', opts));
    gl || (die('Glod.canvas: failed to create context'));
    // wrap && (gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, logAndValidate));
    this._gl = gl;
    this.initContext();
  }
  else {
    this._gl = null;
  }

  return this;
};

Glod.prototype.hasCanvas = function() {
  return !!(this._canvas); // && this._canvas.length == 1);
};

Glod.prototype.hasVBO     = function(name) { return this._vbos    .hasOwnProperty(name); };
Glod.prototype.hasFBO     = function(name) { return this._fbos    .hasOwnProperty(name); };
Glod.prototype.hasRBO     = function(name) { return this._rbos    .hasOwnProperty(name); };
Glod.prototype.hasTexture = function(name) { return this._textures.hasOwnProperty(name); };
Glod.prototype.hasProgram = function(name) { return this._programs.hasOwnProperty(name); };

Glod.prototype.createVBO = function(name) {
  this.hasVBO(name) && die('Glod.createVBO: duplicate name: ' + name);
  this._vbos[name] = this.gl().createBuffer();
  return this;
};

Glod.prototype.createFBO = function(name) {
  this.hasFBO(name) && die('Glod.createFBO: duplicate resource name: ' + name);
  this._fbos[name] = this.gl().createFramebuffer();
  return this;
};

Glod.prototype.createRBO = function(name) {
  this.hasRBO(name) && die('Glod.createRBO: duplicate resource name: ' + name);
  this._rbos[name] = this.gl().createRenderbuffer();
  return this;
};

Glod.prototype.createTexture = function(name) {
  this.hasTexture(name) && die('Glod.createTexture: duplicate resource name: ' + name);
  this._textures[name] = this.gl().createTexture();
  return this;
};

Glod.prototype.deleteVBO = function(name) {
  var vbo = this.vbo(name);
  this.gl().deleteBuffer(vbo);
  delete this._vbos[name];
  return this;
};

var NRF = function(type, name) {
  die('Glod.' + type + ': no resource found: ' + name);
};

Glod.prototype.vbo     = function(name) { this.hasVBO(name) || NRF('vbo', name); return this._vbos[name]; };
Glod.prototype.fbo     = function(name) { this.hasFBO(name) || NRF('fbo', name); return this._fbos[name]; };
Glod.prototype.rbo     = function(name) { this.hasRBO(name) || NRF('rbo', name); return this._rbos[name]; };

Glod.prototype.program = function(name) {
  this.hasProgram(name) || NRF('program', name); return this._programs[name];
};

Glod.prototype.texture = function(name) {
  this.hasTexture(name) || NRF('texture', name); return this._textures[name];
};

Glod.prototype.onContextLost = function(e) {
  e.preventDefault();
  this._contextLost = true;
};

Glod.prototype.onContextRestored = function(e) {
  this._contextLost = false;

  var name;
  for (name in this._vbos    ) { delete this._vbos    [name]; this.createVBO    (name); }
  for (name in this._fbos    ) { delete this._fbos    [name]; this.createFBO    (name); }
  for (name in this._rbos    ) { delete this._rbos    [name]; this.createRBO    (name); }
  for (name in this._textures) { delete this._textures[name]; this.createTexture(name); }
  for (name in this._programs) { delete this._programs[name]; this.createProgram(name); }

  this.initContext();
  this._allocIds     = {};
  this._versionedIds = {};
};

Glod.prototype.createProgram = function(name) {
  name || die('bad program name: ' + name);

  var o = Glod.preprocessed[name];

  o          || die('Glod.createProgram: program not preprocessed: ' + name);
  o.name     || die('Glod.createProgram: no name specified');
  o.vertex   || die('Glod.createProgram: no vertex source');
  o.fragment || die('Glod.createProgram: no fragment source');

  name             = o.name;
  var vertex_src   = o.vertex;
  var fragment_src = o.fragment;

  this.hasProgram(name) && die('Glod.createProgram: duplicate program name: ' + name);

  var gl = this.gl();
  var program = gl.createProgram();
  this._programs[name] = program;

  function shader(type, source) {
    var s = gl.createShader(type);

    gl.shaderSource(s, source);
    gl.compileShader(s);

    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      console.log(log);
      console.log(source);
      die('Glod.createProgram: compilation failed', log);
    }

    gl.attachShader(program, s);
  }

  shader(gl.VERTEX_SHADER,   vertex_src);
  shader(gl.FRAGMENT_SHADER, fragment_src);

  for (var pass = 0; pass < 2; pass++) {
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(program));
      die('Glod.createProgram: linking failed');
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      console.log(gl.getProgramInfoLog(program));
      die('Glod.createProgram: validation failed');
    }

    if (pass === 0) {
      var active = [];

      var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (var i = 0; i < activeAttributes; i++) {
        var info = gl.getActiveAttrib(program, i);
        var re = new RegExp('^\\s*attribute\\s+([a-z0-9A-Z_]+)\\s+' + info.name + '\\s*;', 'm');
        var sourcePosition = vertex_src.search(re);
        sourcePosition >= 0 || die('couldn\'t find active attribute "' + info.name + '" in source');
        active.push([info.name, sourcePosition]);
      }

      var layout = active.sort(function(a, b) { return a[1] > b[1]; })
                         .map (function(x   ) { return x[0];        });

      for (var i = 0; i < layout.length; i++) {
        gl.bindAttribLocation(program, i, layout[i]);
      }

      continue;
    }

    var variables = this._variables[name] = {};

    var addVariable = function(index, attrib) {
      var info = attrib ? gl.getActiveAttrib (program, i) :
                          gl.getActiveUniform(program, i);

      var name = info.name;

      variables[name] && die('Glod: duplicate variable name: ' + name);

      var location = attrib ? gl.getAttribLocation (program, name) :
                              gl.getUniformLocation(program, name) ;

      var type = info.type;

      var count = type === gl.BYTE           ? 1  :
                  type === gl.UNSIGNED_BYTE  ? 1  :
                  type === gl.SHORT          ? 1  :
                  type === gl.UNSIGNED_SHORT ? 1  :
                  type === gl.INT            ? 1  :
                  type === gl.UNSIGNED_INT   ? 1  :
                  type === gl.FLOAT          ? 1  :
                  type === gl.BOOL           ? 1  :
                  type === gl.SAMPLER_2D     ? 1  :
                  type === gl.SAMPLER_CUBE   ? 1  :

                  type === gl.  INT_VEC2     ? 2  :
                  type === gl.FLOAT_VEC2     ? 2  :
                  type === gl. BOOL_VEC2     ? 2  :

                  type === gl. INT_VEC3      ? 3  :
                  type === gl.FLOAT_VEC3     ? 3  :
                  type === gl. BOOL_VEC3     ? 3  :

                  type === gl.  INT_VEC4     ? 4  :
                  type === gl.FLOAT_VEC4     ? 4  :
                  type === gl. BOOL_VEC4     ? 4  :

                  type === gl.FLOAT_MAT2     ? 4  :
                  type === gl.FLOAT_MAT3     ? 9  :
                  type === gl.FLOAT_MAT4     ? 16 :
                  die('Glod: unknown variable type: ' + type);

      var matrix = type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4;

      var float = type === gl.FLOAT      ||
                  type === gl.FLOAT_VEC2 || type === gl.FLOAT_VEC3 || type === gl.FLOAT_VEC4 ||
                  type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4;

      variables[name] = {
        location: location,
        info:     info,
        attrib:   attrib,
        count:    count,
        float:    float,
        matrix:   matrix,
        ready:    false
      };
    }

    var activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < activeUniforms; i++) addVariable(i, false);
    var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < activeAttributes; i++) addVariable(i, true);
  }

  var error = this.gl().getError();
  if (error !== 0) die('unexpected error: ' + error);

  return this;
};

Glod.prototype.variable = function(name) {
  this.assertProgramActive()
  var variable = this._variables[this._activeProgram][name];
  // TODO(ryan): Maybe add a flag for this? It can be useful to know when
  // variables are unused, but also annoying if you want to set them regardless.
  // variable || die('Glod.variable: variable not found: ' + name);
  return variable;
};

Glod.prototype.location = function(name) { return this.variable(name).location; };
Glod.prototype.info     = function(name) { return this.variable(name).info;     };
Glod.prototype.isAttrib = function(name) { return this.variable(name).attrib;   };

Glod.prototype.uploadCCWQuad = function() {
  var positions = new Float32Array([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1]);

  return function(name) {
    var gl = this.gl();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo(name));
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return this;
  };
}();

Glod.prototype.uploadPlaceholderTexture = function() {
  var rgba = new Uint8Array([255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255]);

  return function(name) {
    var gl  = this.gl();
    var tex = this.texture(name);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return this;
  };
}();

Glod.prototype.bindFramebuffer = function(name) {
  var fbo = name === null ? null : this.fbo(name);
  var gl = this.gl();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  return this;
};


// todo:
//   use the vbo's type to determine which target to bind it to
//   support stream and dynamic draw
//   support passing a normal JS array
Glod.prototype.bufferDataStatic = function(targetName) {
  var al  = arguments.length;
  var gl  = this.gl();
  var vbo = this.vbo(targetName);

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  var a;
  if (al === 2) {
    a = arguments[1];
    Array.prototype.isPrototypeOf(a) && (a = new Float32Array(a));
    gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
  }
  else if (al === 3) {
    a = arguments[1];
    Array.prototype.isPrototypeOf(a) && (a = new Float32Array(a));
    gl.bufferSubData(gl.ARRAY_BUFFER, a, arguments[2]);
  }
  else {
    die('Glod.bufferData: bad argument count: ' + al);
  }

  return this;
};

// todo:
//   support aperture base and opening
//   support scale factor
Glod.prototype.viewport = function() {
  var gl = this.gl();
  var x, y, w, h;

  var al = arguments.length;
  if (al === 4) {
    x = arguments[0];
    y = arguments[1];
    w = arguments[2];
    h = arguments[3];
  }
  else if (al === 0) {
    var canvas = this.canvas();
    x = y = 0;
    w = canvas.width;
    h = canvas.height;
  }
  else {
    die('Glod.viewport: bad argument count: ' + al);
  }

  gl.viewport(x, y, w, h);
  gl.scissor(x, y, w, h);

  return this;
}

Glod.prototype.begin = function(programName) {
  this.assertInactive().startPreparing();

  this.gl().useProgram(this.program(programName));

  this._activeProgram = programName;
  this._mode = -1;

  var variables = this._variables[programName];

  for (var name in variables) {
    variables[name].ready = false;
  }

  return this;
};

Glod.prototype.ready = function() {
  this.assertPreparing().startDrawing();

  var variables = this._variables[this._activeProgram];

  for (var name in variables) {
    var ov = this._optional[name];
    if (!variables[name].ready && ov) {
      switch(ov.length) {
        case 4: this.value(name, ov[0], ov[1], ov[2], ov[3]); break;
        case 3: this.value(name, ov[0], ov[1], ov[2]       ); break;
        case 2: this.value(name, ov[0], ov[1]              ); break;
        case 1: this.value(name, ov[0]                     ); break;
      }
    }

    variables[name].ready || die('Glod.ready: variable not ready: ' + name);
  }

  return this;
};

Glod.prototype.end = function() {
  this.assertDrawing().startInactive();
  this._activeProgram = null;
  return this;
};

Glod.prototype.manual = function() {
  this.assertProgramActive();
  for (var i = 0; i < arguments.length; i++) {
    this.variable(arguments[i]).ready = true;
  }
  return this;
};

Glod.prototype.value = function(name, a, b, c, d) {
  var v  = this.variable(name);

  // Bail if the variable does not exist.
  if (!v) return this;

  var gl = this.gl();
  var l  = arguments.length - 1;
  var loc = v.location;

  if (v.attrib) {
    l === 1 ? gl.vertexAttrib1f(loc, a         ) :
    l === 2 ? gl.vertexAttrib2f(loc, a, b      ) :
    l === 3 ? gl.vertexAttrib3f(loc, a, b, c   ) :
    l === 4 ? gl.vertexAttrib4f(loc, a, b, c, d) :
              die('Glod.value: bad length: ' + l);
  }
  else {
    var type = v.info.type;
    l === 1 ? (v.float ? gl.uniform1f(loc, a         ) : gl.uniform1i(loc, a         )) :
    l === 2 ? (v.float ? gl.uniform2f(loc, a, b      ) : gl.uniform2i(loc, a, b      )) :
    l === 3 ? (v.float ? gl.uniform3f(loc, a, b, c   ) : gl.uniform3i(loc, a, b, c   )) :
    l === 4 ? (v.float ? gl.uniform4f(loc, a, b, c, d) : gl.uniform4i(loc, a, b, c, d)) :
              die('Glod.value: bad length: ' + l);
  }
  v.ready = true;
  return this;
};

Glod.prototype.valuev = function(name, s, transpose) {
  s || die('Glod.valuev: bad vector: ' + s);

  var v = this.variable(name);

  // Bail if the variable does not exist.
  if (!v) return this;

  var gl = this.gl();
  var l = v.count;
  var loc = v.location;

  if (v.attrib) {
    l === s.length || die('Glod.valuev: bad vector length: ' + s.length);
    gl.disableVertexAttribArray(loc);
    l === 1 ? gl.vertexAttrib1fv(loc, s) :
    l === 2 ? gl.vertexAttrib2fv(loc, s) :
    l === 3 ? gl.vertexAttrib3fv(loc, s) :
    l === 4 ? gl.vertexAttrib4fv(loc, s) :
              die('Glod.valuev: bad length: ' + l);
  }
  else {
    if (v.matrix) {
      l === 4  ? gl.uniformMatrix2fv(loc, !!transpose, s) :
      l === 9  ? gl.uniformMatrix3fv(loc, !!transpose, s) :
      l === 16 ? gl.uniformMatrix4fv(loc, !!transpose, s) :
                 die('Glod.valuev: bad length: ' + l);
    }
    else {
      l === 1 ? (v.float ? gl.uniform1fv(loc, s) : gl.uniform1iv(loc, s)) :
      l === 2 ? (v.float ? gl.uniform2fv(loc, s) : gl.uniform2iv(loc, s)) :
      l === 3 ? (v.float ? gl.uniform3fv(loc, s) : gl.uniform3iv(loc, s)) :
      l === 4 ? (v.float ? gl.uniform4fv(loc, s) : gl.uniform4iv(loc, s)) :
                die('Glod.valuev: bad length: ' + l);
    }
  }

  v.ready = true;

  return this;
};

Glod.prototype.optional = function(name, a, b, c, d) {
  var l = arguments.length - 1;

  if (l === 1 && a === undefined) {
    delete this._optional[name];
    return this;
  }

  var v = this._optional[name] || [];
  this._optional[name] = v;
  v.length = l;

  switch (l) {
    case 4: v[3] = d;
    case 3: v[2] = c;
    case 2: v[1] = b;
    case 1: v[0] = a;
  }

  return this;
};

Glod.prototype.optionalv = function(name, s, transpose) {
  // WARNING: I'm not sure this actually works.
  if (arguments.length === 2 && s === undefined) {
    delete this._optionalv[name];
    return this;
  }

  var v = this._optionalv[name] || [];
  var l = s.length;
  this._optionalv[name] = v;
  v.length = s.length;
  v.TRANSPOSE = !!transpose;
  for (var i = 0; i < l; i++) {
    v[i] = s[i];
  }

  return this;
};

Glod.prototype.pack = function(vboName) {
  var vbo = this.vbo(vboName);
  var gl  = this.gl();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  arguments.length < 2 && die('Glod.pack: no attribute provided');

  var stride = 0;
  var counts = [];
  var vars = [];
  for (var i = 1; i < arguments.length; i++) {
    var name = arguments[i];
    var v = this.variable(name);
    v.attrib || die('Glod.pack: tried to pack uniform: ' + name);
    v.ready  && die('Glod.pack: variable already ready: ' + name);
    var count = v.count;
    stride += count;
    counts.push(count);
    vars.push(v);
  }

  var offset = 0;
  for (var i = 1; i < arguments.length; i++) {
    var name = arguments[i];
    var v = vars[i - 1];
    var loc = v.location;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, v.count, gl.FLOAT, false, stride * 4, offset * 4);
    offset += v.count;
    v.ready = true;
  }

  return this;
};

Glod.prototype.primitive = function(mode) {
  (mode >= 0 && mode <= 6) || die('Glod.mode: bad mode: ' + mode);
  this._mode = mode
  return this;
};

Glod.prototype.points        = function() { this._mode = this._gl.POINTS;         return this; };
Glod.prototype.lines         = function() { this._mode = this._gl.LINES;          return this; };
Glod.prototype.lineLoop      = function() { this._mode = this._gl.LINE_LOOP;      return this; };
Glod.prototype.lineStrip     = function() { this._mode = this._gl.LINE_STRIP;     return this; };
Glod.prototype.triangles     = function() { this._mode = this._gl.TRIANGLES;      return this; };
Glod.prototype.triangleStrip = function() { this._mode = this._gl.TRIANGLE_STRIP; return this; };
Glod.prototype.triangleFan   = function() { this._mode = this._gl.TRIANGLE_FAN;   return this; };

Glod.prototype.drawArrays = function(first, count) {
  var mode = this._mode;
  (mode >= 0 && mode <= 6) || die('Glod.drawArrays: mode not set');
  var gl = this.gl();
  gl.drawArrays(mode, first, count);
  return this;
};

Glod.prototype.clearColor   = function(r, g, b, a) { this.gl().clearColor  (r, g, b, a); return this; };
Glod.prototype.clearDepth   = function(d         ) { this.gl().clearDepth  (d         ); return this; };
Glod.prototype.clearStencil = function(s         ) { this.gl().clearStencil(s         ); return this; };

Glod.prototype.clearColorv = function(s) {
  return this.clearColor(s[0], s[1], s[2], s[3]);
};

Glod.prototype.clear = function(color, depth, stencil) {
  var gl = this.gl();

  var clearBits = 0;
  color   && (clearBits |= gl.  COLOR_BUFFER_BIT);
  depth   && (clearBits |= gl.  DEPTH_BUFFER_BIT);
  stencil && (clearBits |= gl.STENCIL_BUFFER_BIT);

  clearBits && gl.clear(clearBits);
  return this;
};

Glod.prototype.bindArrayBuffer = function(name) {
  var gl = this._gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo(name));
  return this;
};

Glod.prototype.bindElementBuffer = function(name) {
  var gl = this._gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo(name));
  return this;
};

Glod.prototype.bindTexture2D = function(name) {
  var texture = name === null ? null : this.texture(name);
  var gl = this._gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  return this;
};

Glod.prototype.activeTexture = function(unit) {
  var gl = this._gl;
  gl.activeTexture(gl.TEXTURE0 + unit);
  return this;
};

Glod.prototype.init = function(id, f) {
  this._initIds[id] || f();
  this._initIds[id] = true;
  return this;
};

Glod.prototype.alloc = function(id, f) {
  this._allocIds[id] || f();
  this._allocIds[id] = true;
  return this;
};

Glod.prototype.allocv = function(id, v, f) {
  if (this._versionedIds[id] !== v) {
    this._versionedIds[id] = v;
    f();
  }
  return this;
};

},{}],7:[function(require,module,exports){
var canvasBounds, clear, drawGrid, drawLine, getSpacing, lerp, ticks;

R.create("GridView", {
  propTypes: {
    center: Array,
    pixelSize: Number
  },
  render: function() {
    return R.canvas({});
  },
  componentDidMount: function() {
    return this._draw();
  },
  componentDidUpdate: function() {
    return this._draw();
  },
  shouldComponentUpdate: function(nextProps) {
    return !_.isEqual(this.props, nextProps);
  },
  _draw: function() {
    var canvas, ctx, rect;
    canvas = this.getDOMNode();
    rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    ctx = canvas.getContext("2d");
    clear(ctx);
    return drawGrid(ctx, this.center, this.pixelSize);
  }
});

clear = function(ctx) {
  var canvas;
  canvas = ctx.canvas;
  return ctx.clearRect(0, 0, canvas.width, canvas.height);
};

canvasBounds = function(ctx) {
  var canvas;
  canvas = ctx.canvas;
  return {
    cxMin: 0,
    cxMax: canvas.width,
    cyMin: canvas.height,
    cyMax: 0,
    width: canvas.width,
    height: canvas.height
  };
};

lerp = function(x, dMin, dMax, rMin, rMax) {
  var ratio;
  ratio = (x - dMin) / (dMax - dMin);
  return ratio * (rMax - rMin) + rMin;
};

ticks = function(spacing, min, max) {
  var first, last, x, _i, _results;
  first = Math.ceil(min / spacing);
  last = Math.floor(max / spacing);
  _results = [];
  for (x = _i = first; first <= last ? _i <= last : _i >= last; x = first <= last ? ++_i : --_i) {
    _results.push(x * spacing);
  }
  return _results;
};

drawLine = function(ctx, _arg, _arg1) {
  var x1, x2, y1, y2;
  x1 = _arg[0], y1 = _arg[1];
  x2 = _arg1[0], y2 = _arg1[1];
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  return ctx.stroke();
};

getSpacing = function(pixelSize) {
  var div, largeSpacing, minSpacing, smallSpacing, z;
  minSpacing = pixelSize * config.minGridSpacing;

  /*
  need to determine:
    largeSpacing = {1, 2, or 5} * 10^n
    smallSpacing = divide largeSpacing by 4 (if 1 or 2) or 5 (if 5)
  largeSpacing must be greater than minSpacing
   */
  div = 4;
  largeSpacing = z = Math.pow(10, Math.ceil(Math.log(minSpacing) / Math.log(10)));
  if (z / 5 > minSpacing) {
    largeSpacing = z / 5;
  } else if (z / 2 > minSpacing) {
    largeSpacing = z / 2;
    div = 5;
  }
  smallSpacing = largeSpacing / div;
  return {
    largeSpacing: largeSpacing,
    smallSpacing: smallSpacing
  };
};

drawGrid = function(ctx, center, pixelSize) {
  var axesColor, axesOpacity, color, cx, cxMax, cxMin, cy, cyMax, cyMin, fromLocal, height, labelColor, labelDistance, labelOpacity, largeSpacing, majorColor, majorOpacity, minorColor, minorOpacity, smallSpacing, text, textHeight, toLocal, width, x, xMax, xMin, y, yMax, yMin, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
  _ref = canvasBounds(ctx), cxMin = _ref.cxMin, cxMax = _ref.cxMax, cyMin = _ref.cyMin, cyMax = _ref.cyMax, width = _ref.width, height = _ref.height;
  xMin = center[0] - (width / 2) * pixelSize;
  xMax = center[0] + (width / 2) * pixelSize;
  yMin = center[1] - (height / 2) * pixelSize;
  yMax = center[1] + (height / 2) * pixelSize;
  _ref1 = canvasBounds(ctx), cxMin = _ref1.cxMin, cxMax = _ref1.cxMax, cyMin = _ref1.cyMin, cyMax = _ref1.cyMax, width = _ref1.width, height = _ref1.height;
  _ref2 = getSpacing(pixelSize), largeSpacing = _ref2.largeSpacing, smallSpacing = _ref2.smallSpacing;
  toLocal = function(_arg) {
    var cx, cy;
    cx = _arg[0], cy = _arg[1];
    return [lerp(cx, cxMin, cxMax, xMin, xMax), lerp(cy, cyMin, cyMax, yMin, yMax)];
  };
  fromLocal = function(_arg) {
    var x, y;
    x = _arg[0], y = _arg[1];
    return [lerp(x, xMin, xMax, cxMin, cxMax), lerp(y, yMin, yMax, cyMin, cyMax)];
  };
  labelDistance = 5;
  color = config.gridColor;
  minorOpacity = 0.075;
  majorOpacity = 0.1;
  axesOpacity = 0.25;
  labelOpacity = 1.0;
  textHeight = 12;
  minorColor = "rgba(" + color + ", " + minorOpacity + ")";
  majorColor = "rgba(" + color + ", " + majorOpacity + ")";
  axesColor = "rgba(" + color + ", " + axesOpacity + ")";
  labelColor = "rgba(" + color + ", " + labelOpacity + ")";
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = minorColor;
  _ref3 = ticks(smallSpacing, xMin, xMax);
  for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
    x = _ref3[_i];
    drawLine(ctx, fromLocal([x, yMin]), fromLocal([x, yMax]));
  }
  _ref4 = ticks(smallSpacing, yMin, yMax);
  for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
    y = _ref4[_j];
    drawLine(ctx, fromLocal([xMin, y]), fromLocal([xMax, y]));
  }
  ctx.strokeStyle = majorColor;
  _ref5 = ticks(largeSpacing, xMin, xMax);
  for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
    x = _ref5[_k];
    drawLine(ctx, fromLocal([x, yMin]), fromLocal([x, yMax]));
  }
  _ref6 = ticks(largeSpacing, yMin, yMax);
  for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
    y = _ref6[_l];
    drawLine(ctx, fromLocal([xMin, y]), fromLocal([xMax, y]));
  }
  ctx.strokeStyle = axesColor;
  drawLine(ctx, fromLocal([0, yMin]), fromLocal([0, yMax]));
  drawLine(ctx, fromLocal([xMin, 0]), fromLocal([xMax, 0]));
  ctx.font = "" + textHeight + "px verdana";
  ctx.fillStyle = labelColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  _ref7 = ticks(largeSpacing, xMin, xMax);
  for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
    x = _ref7[_m];
    if (x !== 0) {
      text = parseFloat(x.toPrecision(12)).toString();
      _ref8 = fromLocal([x, 0]), cx = _ref8[0], cy = _ref8[1];
      if (cx < cxMax) {
        cy += labelDistance;
        if (cy < labelDistance) {
          cy = labelDistance;
        }
        if (cy + textHeight + labelDistance > height) {
          cy = height - labelDistance - textHeight;
        }
        ctx.fillText(text, cx, cy);
      }
    }
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  _ref9 = ticks(largeSpacing, yMin, yMax);
  for (_n = 0, _len5 = _ref9.length; _n < _len5; _n++) {
    y = _ref9[_n];
    if (y !== 0) {
      text = parseFloat(y.toPrecision(12)).toString();
      _ref10 = fromLocal([0, y]), cx = _ref10[0], cy = _ref10[1];
      if (cy > 0) {
        cx += labelDistance;
        if (cx < labelDistance) {
          cx = labelDistance;
        }
        if (cx + ctx.measureText(text).width + labelDistance > width) {
          cx = width - labelDistance - ctx.measureText(text).width;
        }
        ctx.fillText(text, cx, cy);
      }
    }
  }
  return ctx.restore();
};


},{}],8:[function(require,module,exports){
var R, desugarPropType, key, value, _ref,
  __hasProp = {}.hasOwnProperty;

window.R = R = {};

_ref = React.DOM;
for (key in _ref) {
  if (!__hasProp.call(_ref, key)) continue;
  value = _ref[key];
  R[key] = value;
}

R.cx = React.addons.classSet;

R.UniversalMixin = {
  ownerView: function() {
    var _ref1;
    return (_ref1 = this._owner) != null ? _ref1 : this.props.__owner__;
  },
  lookup: function(keyName) {
    var _ref1, _ref2;
    return (_ref1 = this[keyName]) != null ? _ref1 : (_ref2 = this.ownerView()) != null ? _ref2.lookup(keyName) : void 0;
  },
  lookupView: function(viewName) {
    var _ref1;
    if (this === viewName || this.viewName() === viewName) {
      return this;
    }
    return (_ref1 = this.ownerView()) != null ? _ref1.lookupView(viewName) : void 0;
  },
  lookupViewWithKey: function(keyName) {
    var _ref1;
    if (this[keyName] != null) {
      return this;
    }
    return (_ref1 = this.ownerView()) != null ? _ref1.lookupViewWithKey(keyName) : void 0;
  },
  setPropsOnSelf: function(nextProps) {
    var propName, propValue, _results;
    _results = [];
    for (propName in nextProps) {
      if (!__hasProp.call(nextProps, propName)) continue;
      propValue = nextProps[propName];
      if (propName === "__owner__") {
        continue;
      }
      _results.push(this[propName] = propValue);
    }
    return _results;
  },
  componentWillMount: function() {
    return this.setPropsOnSelf(this.props);
  },
  componentWillUpdate: function(nextProps) {
    return this.setPropsOnSelf(nextProps);
  },
  componentDidMount: function() {
    var el;
    el = this.getDOMNode();
    return el.dataFor != null ? el.dataFor : el.dataFor = this;
  },
  componentWillUnmount: function() {
    var el;
    el = this.getDOMNode();
    return delete el.dataFor;
  }
};

desugarPropType = function(propType, optional) {
  var required;
  if (optional == null) {
    optional = false;
  }
  if (propType.optional) {
    propType = propType.optional;
    required = false;
  } else if (optional) {
    required = false;
  } else {
    required = true;
  }
  if (propType === Number) {
    propType = React.PropTypes.number;
  } else if (propType === String) {
    propType = React.PropTypes.string;
  } else if (propType === Boolean) {
    propType = React.PropTypes.bool;
  } else if (propType === Function) {
    propType = React.PropTypes.func;
  } else if (propType === Array) {
    propType = React.PropTypes.array;
  } else if (propType === Object) {
    propType = React.PropTypes.object;
  } else if (_.isArray(propType)) {
    propType = React.PropTypes.any;
  } else {
    propType = React.PropTypes.instanceOf(propType);
  }
  if (required) {
    propType = propType.isRequired;
  }
  return propType;
};

R.create = function(name, opts) {
  var propName, propType, _ref1;
  opts.displayName = name;
  opts.viewName = function() {
    return name;
  };
  if (opts.propTypes == null) {
    opts.propTypes = {};
  }
  _ref1 = opts.propTypes;
  for (propName in _ref1) {
    if (!__hasProp.call(_ref1, propName)) continue;
    propType = _ref1[propName];
    opts.propTypes[propName] = desugarPropType(propType);
  }
  if (opts.mixins == null) {
    opts.mixins = [];
  }
  opts.mixins.unshift(R.UniversalMixin);
  return R[name] = React.createClass(opts);
};

require("./AppRootView");

require("./CodeMirrorView");

require("./ShaderView");

require("./GridView");


},{"./AppRootView":4,"./CodeMirrorView":5,"./GridView":7,"./ShaderView":9}],9:[function(require,module,exports){
var Glod, colorMap, createProgramFromSrc;

Glod = require("./Glod");

createProgramFromSrc = function(glod, name, vertex, fragment) {
  Glod.preprocessed[name] = {
    name: name,
    fragment: fragment,
    vertex: vertex
  };
  delete glod._programs[name];
  return glod.createProgram(name);
};

colorMap = {};

colorMap.vertex = "precision highp float;\nprecision highp int;\n\nattribute vec4 gg_vertexPosition;\nuniform vec2 gg_translate;\nuniform vec2 gg_scale;\nvarying vec2 gg_position;\n\nvoid main() {\n  gl_Position = vec4(gg_vertexPosition);\n\n  gg_position = gg_vertexPosition.xy * gg_scale + gg_translate;\n}";

colorMap.fragment = "precision highp float;\nprecision highp int;\n\nvarying vec2 gg_position;\n\n// INSERT\n\nvoid main() {\n  gl_FragColor = draw(gg_position);\n}";

R.create("ShaderView", {
  propTypes: {
    src: String,
    center: Array,
    pixelSize: Number
  },
  render: function() {
    return R.canvas({});
  },
  componentDidMount: function() {
    this._init();
    return this._draw();
  },
  componentDidUpdate: function() {
    return this._draw();
  },
  shouldComponentUpdate: function(nextProps) {
    return !_.isEqual(this.props, nextProps);
  },
  _init: function() {
    var canvas, rect;
    canvas = this.getDOMNode();
    rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    this._glod = new Glod();
    this._glod.canvas(canvas, {
      antialias: true
    });
    return this._glod.createVBO("quad").uploadCCWQuad("quad");
  },
  _draw: function() {
    var canvas, fragment, height, scale, translate, vertex, width;
    vertex = colorMap.vertex;
    fragment = colorMap.fragment.replace("// INSERT", this.src);
    try {
      createProgramFromSrc(this._glod, "program", vertex, fragment);
    } catch (_error) {}
    canvas = this.getDOMNode();
    width = canvas.width;
    height = canvas.height;
    translate = this.center;
    scale = [(width / 2) * this.pixelSize, (height / 2) * this.pixelSize];
    return this._glod.begin("program").pack("quad", "gg_vertexPosition").valuev("gg_translate", translate).valuev("gg_scale", scale).ready().triangles().drawArrays(0, 6).end();
  }
});


},{"./Glod":6}]},{},[3])