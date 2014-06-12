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
require("./view/R");

require("./bootstrap");


},{"./bootstrap":1,"./view/R":5}],3:[function(require,module,exports){
var initialSrc, model;

initialSrc = "float draw(float x) {\n  return sin(x);\n}";

model = {
  src: initialSrc
};

R.create("AppRootView", {
  render: function() {
    return R.div({
      className: "Code"
    }, R.CodeMirrorView({
      value: model.src,
      onChange: this._codeChange
    }));
  },
  _codeChange: function(newValue) {
    model.src = newValue;
    return refresh();
  }
});


},{}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{"./AppRootView":3,"./CodeMirrorView":4}]},{},[2])