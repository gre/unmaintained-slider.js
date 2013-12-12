/*!
Copyright 2010-2012 Gaetan Renaudeau
http://sliderjs.org/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
window.sliderjs = {};

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();



(function (ns) {

	// Matches dashed string for camelizing
	var rdashAlpha = /-([a-z]|[0-9])/ig,
      rmsPrefix = /^-ms-/,
      stringToListSplit = /[, ]+/,

      fcamelCase = function( all, letter ) {
        return ( letter + "" ).toUpperCase();
      };

/*
 * util functions.
 * This internal implementation is light and native but can fail on some old browser.
 * Hence, you could override them with a plugin (jQuery, Prototype, ...)
 */
var $ = ns.util = {
  version: 'native',

  /// DOM ///

  html: function (element, html) { 
    if(element) element.innerHTML = html;
  },
  // add only the first node of html in element and return this node.
  append: function (element, html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return element.appendChild(div.firstChild);
  },
  find: function (element, css) {
    return element.querySelectorAll(css);
  },
  addClass: function (element, c) {
    element.classList.add(c);
  },
  removeClass: function (element, c) {
    element.classList.remove(c);
  },
  camelCase: function (string) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
  },
  css: function (element, prop, value) {
    prop = $.camelCase(prop);
    if(arguments.length==1) return element.style[prop];
    element.style[prop] = value;
  },
  show: function (element) {
    element.style.display = "block";
  },
  hide: function (element) {
    element.style.display = "none";
  },
  width: function (element, w) {
    if (arguments.length==1) return element.style.width;
    element.style.width = w;
  },
  height: function (element, h) {
    if (arguments.length==1) return element.style.height;
    element.style.height = h;
  },
  on: function (element, eventName, fun) {
    element.addEventListener(eventName, fun);
  },
  off: function (element, eventName, fun) {
    element.removeEventListener(eventName, fun);
  },

  /// Utils ///
  
  indexOf: function (t, a) {
    if (t.indexOf) return t.indexOf(a);
    for(var i=0; i<t.length; i++)
      if(t[i]==a)  
        return i;  
    return -1;
  },
  // Make a pub/sub event system (https://gist.github.com/1000193)
  makeEvent: function (_){return {
    pub:function (a,b,c,d){for(d=-1,c=[].concat(_[a]);c[++d];)c[d](b)},
    sub:function (a,b){(_[a]||(_[a]=[])).push(b)},
    del:function (a,b){if(_[a]){var i = $.indexOf(_[a], b);i>=0 && _[a].splice(i, 1);}}
  }},

  each: function (a,f){
    if(a.forEach) a.forEach(f); else for(var i=0; i<a.length; ++i) f(a[i], i, a);
  },
  map: function (a,f){
    var t=[]; $.each(a, function (v,i,l){ t[i]=f(v,i,l); }); return t;
  },
  extend: function (obj) {
    for(var a=1; a<arguments.length; ++a) {
      var source = arguments[a];
      for (var prop in source)
        if (source[prop] !== void 0) obj[prop] = source[prop];
    }
    return obj;
  },
  // difference between two arrays (a - b)
  dif: function (a, b) {
    var t = [];
    for (var i = 0; i<a.length; ++i)
      if ($.indexOf(b, a[i]) < 0)
        t.push(a[i]);
    return t;
  },
  nop: function () {},
  now: function (){ return +new Date() },
  uuid: function (n){ return function (){ return ++n; } }(0),

  // Simplified version of "Simple JavaScript Templating" by John Resig - http://ejohn.org/ - MIT Licensed
  tmpl: function (str){
    return new Function("obj","var p=[];with(obj||{}){p.push('"+
       str.replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      +"');}return p.join('');");
  },
  getList: function (o) { 
    return typeof(o)=="string" ? o.split(stringToListSplit) : (o instanceof Array ? o : []) 
  },
  createRegistrable: function() {
    var keys = [], hashmap = {};
    return function(name, o){ switch (arguments.length) { 
      case 0: return keys;
      case 1: return hashmap[name];
      case 2: keys.push(name); hashmap[name]=o;
    }};
  },
  parseTime: function(time) {
    var typ = typeof time;
    if (typ == "number") return time;
    if (typ == "string") {
      var i = time.indexOf("ms");
      if (i>0) return parseFloat(time.substring(0, i));
      i = time.indexOf("s");
      if (i>0) return 1000*parseFloat(time.substring(0, i));
    }
    return NaN;
  }
}

}(window.sliderjs));



(function (ns) {

/**
 * slider.Slider(nodeContainer, { ... })
 */
ns.Slider = function (container, options) {
  return new Slider(container, options);
}

/**
 * Slider Constructor
 */
var Slider = function (container, options) {
  var self = this, 
      $ = ns.util,
      T, // selector templating
      E, // pub/sub event system
      modules = {}; // store modules

  if(!container) throw "container node required in first argument";
  if(!options) options = {};

  // Init events
  E = $.makeEvent({});
  self.trigger = function (event, data) {
    E.pub(event, data); return self;
  }
  self.on = function (event, callback) {
    E.sub(event, callback); return self;
  }
  self.off = function (event, callback) {
    E.del(event, callback); return self;
  }
  self.once = function (event, callback) {
    var removeCallback = function () {
      self.off(event, removeCallback).off(event, callback);
    }
    return self.on(event, callback).on(event, removeCallback);
  }

  // Init templating
  self.T = T = new SelectorTemplating(container, function () {
    self.trigger("templated", container);
  });

  // opt method
  self.opt = function (optname, newValue) {
    var value = options[optname];
    if(arguments.length==1) return value;
    if (modules[optname])
      newValue = modules[optname].m.accept(newValue, value);
    options[optname] = newValue;

    var message = { key: optname, old: value, value: newValue };
    self.trigger(optname+"Changed", message);
    return self;
  }

  // Get a module
  self.module = function (name) {
    var module = modules[name];
    return module && module.m;
  }

  // Init modules 
  self.modules = (function () {
    var list = function (name) {
      var t = [];
      for (var name in modules)
        t.push(name);
      return t;
    }
    list.start = function (names) {
      $.each($.getList(names), function (name) {
        var moduleFunction = ns.modules(name), onChanged, module;
        if (!moduleFunction) throw "module "+name+" not found.";
        modules[name] && this.stop(name);

        // Create module
        module = $.extend({ //extend the module with module defaults
          init: $.nop,
          change: $.nop,
          destroy: $.nop,
          accept: function (value) { return value },
          fn: function (val) {
            var args = [name]; 
            arguments.length && args.push(val);
            return self.opt.apply(self, args);
          }
        }, moduleFunction(new ns.Sandbox(self, name), $));

        // Create module function
        self[name] = module.fn;
        
        // Set default
        options[name] = module.accept(name in options ? options[name] : module.def);
        
        // Bind change
        self.on(name+"Changed", onChanged = function (o) { module.change(o.value, o.old) });

        // Init module
        module.init();
        modules[name] = { m: module, c: onChanged };
        self.trigger(name+"Started");
      });
      T.compile();
      return self;
    }
    list.stop = function (names) {
      $.each($.getList(names), function (name) {
        var data = modules[name];
        if (data) {
          data.m.destroy();
          self.off(name+"Changed", data.c);
          delete options[name];
          delete self[name];
          delete modules[name];
          self.trigger(name+"Stopped");
        }
      });
      T.compile();
      return self;
    }
    return list;
  }());

  // start all modules
  var modulesList = ns.modules();
  var all = options.modules ? $.getList(options.modules) : modulesList;
  for (var o in options) { // add all options given in arguments
    if ($.indexOf(all, o) <= 0 && $.indexOf(modulesList, o) >= 0)
      all.push(o);
  }
  all = $.dif(all, $.getList(options.exceptModules));
  self.modules.start(all);
}

/**
 * Static module creation
 * a sliderjs module define the behaviour of an option.
 * the name of a module MUST be the same as the related option name.
 */
ns.modules = sliderjs.util.createRegistrable();

/**
 * The sandbox given to the module.
 * This is the interface between a module and a slider instance.
 */
ns.Sandbox = function (slider, modulename) {
  var self = this;
  self.template = slider.T;
  // some proxified methods
  self.on = function () { slider.on.apply(slider, arguments); return self }
  self.once = function () { slider.once.apply(slider, arguments); return self }
  self.off = function () { slider.off.apply(slider, arguments); return self }
  self.trigger = function () { slider.trigger.apply(slider, arguments); return self }
  self.opt = function (key, value) {
    if(arguments.length==1) return slider.opt(key);
    slider.opt(key, value); return self;
  }
  // .value([v]) is a shortcut to .opt(modulename, [v])
  self.value = function (value) { 
    var args = [ modulename ]; arguments.length && args.push(value);
    return self.opt.apply(self, args);
  }
  // Request a module function
  self.ask = function (modulename, funname) {
    var module = slider.module(modulename);
    if(module) return module[funname];
  }
}

}(window.sliderjs));


(function ($) {
/**
 * SelectorTemplating.js
 * License: GPL v3
 * Author: gaetanrenaudeau.fr  - 2012
 * Link: https://gist.github.com/gists/1731611
 */
this.SelectorTemplating = function (container, onTemplated) {  
  var self = this,
      rootTemplate, // type of Arguments
      fragments = []; // Array of { selector: ".container", tmpl: function(i){ return "html"; } }

  self.add = function (containerSelector, template, callback, priority) {
    fragments.push({ 
      tmpl: template, 
      cb: callback,
      selector: containerSelector, 
      priority: priority || 0
    });
    return self;
  }

  self.remove = function (template) {
    var i = $.indexOf($.map(fragments, function (t) { return t.tmpl }), template);
    if (i >= 0) fragments.splice(i, 1);
    return self;
  }

  self.refresh = function (template) {
    self.compile();
  }

  // Template the whole thing
  self.compile = function () {
    var cbs = [], 
        i = 0, 
        waitList, el, nodes, created,
        somethingChangedThisLoop;

    // empty the container 
    self.destroy();

    // all fragments goes to a waitlist, we need to append them all.
    // When a selector matches nodes, we append the template in nodes and remove from the waitlist.
    waitList = [].concat(fragments);
    waitList.sort(function (a, b) {
      return (a.priority != b.priority) ? 
      (b.priority - a.priority) : // higher priority first
      (a.selector < b.selector ? -1 : 1); // try to put root selector first (guess)
    });

    while (waitList.length) {
      el = waitList[i];
      // Try to find the container
      nodes = !el.selector ? [container] : $.find(container, el.selector);
      if (nodes.length) {
        somethingChangedThisLoop = true;
        // template into each containers.
        created = $.map(nodes, function(node, i) {
          return $.append(node, el.tmpl(i));
        });
        el.nodes = created;
        // remove from the waitlist
        waitList.splice(i, 1);
        i = 0;
      }
      else {
        // continue the loop if we have waitList and something has changed the last loop.
        if (++i >= waitList.length) {
          i = 0;
          if(!somethingChangedThisLoop) break;
          somethingChangedThisLoop = false;
        }
      }
    }

    $.each(fragments, function (template) {
      template.cb && template.cb(template.nodes, container);
    });

    onTemplated && onTemplated();
    return self;
  }
  
  // Clean the template
  self.destroy = function () {
    $.html(container, '');
    $.each(fragments, function (template) {
      template.nodes = [];
    });
    return self;
  }
}

}(sliderjs.util));


//~~~ canvas transition
sliderjs.modules("canvasTransition", function (sandbox, $) {
  var mode,
      container,
      canvas, ctx,
      images = [],
      renderId,
      drawing = false,
      slide,
      supported = function () {
        if (navigator && navigator.userAgent) {
          var m = navigator.userAgent.match(/Android ([0-9\.]+)/);
          if (m && parseFloat(m[1])<2.2) return false; // Old android versions suck with Canvas
        }
        var c = document.createElement("canvas");
        return !!(c.getContext && c.getContext("2d"));
      }(),
      canvasTransitionSandbox,
      defaultValue = {
        commutative: true,
        params: {}
      },
      template = $.tmpl('<canvas class="slides"></canvas>');

  var CanvasRenderHelper = {
    clippedTransition: function (clipFunction) {
      return function (o, params) {
        var self = this;
        var c = self.ctx;
        self.drawImage(o.from);
        c.save();
        c.beginPath();
        clipFunction.call(self, o, c, params);
        c.clip();
        self.drawImage(o.to);
        c.restore();
      }
    }
  };

  function findHelper (t) {
    for(var k in CanvasRenderHelper)
      if(t[k])
        return CanvasRenderHelper[k](t[k]);
  }

  function syncHeight (h) {
    canvas.height = h;
    !drawing && drawCurrentImage();
  }
  function syncWidth (w) {
    canvas.width = w;
    !drawing && drawCurrentImage();
  }
  function onHeightChanged (o) { canvas && syncHeight(o.value); }
  function onWidthChanged  (o) { canvas && syncWidth(o.value);  }

  function drawCurrentImage () {
    var image = images[slide ? slide.value : sandbox.opt("slide")];
    image && drawImage(image);
  }

  function drawImage (img) {
    var w = canvas.width;
    ctx.drawImage(img, 0, 0, w, w*img.height/img.width);
  }

  function clean () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function CanvasTransitionSandbox() {
    var self = this;
    self.sandbox = sandbox;
    self.$ = $;
    self.canvas = canvas;
    self.ctx = ctx;
    self.drawImage = drawImage;
    self.clean = clean;
  }

  function onTemplated (nodes, container) {
    canvas = nodes[0];
    if (!canvas || !canvas.getContext)
      return;
    syncWidth(sandbox.opt("width"));
    syncHeight(sandbox.opt("height"));
    ctx = canvas.getContext("2d");
    updateDOM();
    canvasTransitionSandbox = new CanvasTransitionSandbox();
  }

  function updateDOM () {
    if (!canvas) return;
    if (mode=="canvas") {
      $.show(canvas);
      drawCurrentImage();
    }
    else {
      $.hide(canvas);
    }
  }

  function startRender (fromSlide, toSlide, transition) {
    var transitionStart = $.now(),
        transitionDuration = sandbox.opt('duration') || 0,
        transitionFunction = transition.render,
        transitionEasing = sandbox.opt('easing'),
        data = transition.init && transition.init.call(canvasTransitionSandbox, fromSlide, toSlide),
        from = images[fromSlide],
        to = images[toSlide],
        reverse = transition.commutative && fromSlide > toSlide;

    transitionEasing = transitionEasing && transitionEasing.get || function (t) { return t };

    if (!from || !to) return;
    if (reverse) {
      var tmp = to;
      to = from;
      from = tmp;
    }
    drawing = true;
    (function render (id) {
      var now = $.now();
      if(id != renderId || now < transitionStart) return;
      var p = (now-transitionStart)/transitionDuration;
      if (p < 1) {
        requestAnimFrame(function () { render(id) }, canvas);
        p = transitionEasing(p);
        transitionFunction.call(canvasTransitionSandbox, {
          from: from, 
          to: to, 
          progress: reverse ? 1-p : p, 
          data: data
        }, transition.params);
      }
      else {
        drawing = false;
        clean();
        drawImage(reverse ? from : to);
        sandbox.trigger("transitionEnd", { mode: "canvas" });
      }
    } (renderId = $.uuid()));
  }

  function onSlideChanged (o) {
    slide = o;
    if (mode=="canvas")
      ctx && startRender(o.old, o.value, sandbox.value());
  }


  function onImagesLoaded (o) {
    images = o.images;
    updateDOM();
  }
  
  function onTransitionMode (m) {
    if (m == mode) return; // still the same mode
    mode = m;
    updateDOM();
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs div.slides", template, onTemplated);
      sandbox.
        on("slideChanged", onSlideChanged).
        on("heightChanged", onHeightChanged).
        on("widthChanged", onWidthChanged).
        on("imagesLoaded", onImagesLoaded).
        on("transitionMode", onTransitionMode);
      this.change(sandbox.value());
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("slideChanged", onSlideChanged).
        off("heightChanged", onHeightChanged).
        off("widthChanged", onWidthChanged).
        off("imagesLoaded", onImagesLoaded).
        off("transitionMode", onTransitionMode);
    },
    accept: function (value, old) {
      if (!value) return value;
      if(typeof(value)=="string") 
        value = { name: value };
      var t = sliderjs.canvasTransitions(value.name);
      if (!t) t = value;
      // Check if a canvas render helper is used
      if (!t.render) t.render = findHelper(t);
      value = $.extend(defaultValue, value, t, value);
      if(!value.render) throw new Error("no canvas transition was found.");
      return value;
    },
    change: function (value) {
      if (value===undefined) return;
      updateDOM();
      sandbox.trigger("transitionMode", "canvas");
    }
  }
});

/**
 * define a new canvas transition
 */
sliderjs.canvasTransitions = sliderjs.util.createRegistrable();


/*~~~cssTransition~~~ Handle CSS transitions
 *
 * GET: get the current CSS transition.
 * SET: change the current transition to the given CSS transition
 * - string: the name of the transition. It is defined in the transitions/css/{name}.* file and is related to the ("tr-"+name) CSS class.
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("cssTransition", function (sandbox, $) {
  var node, 
      mode, 
      prefix = "tr-", 
      imageNodes, 
      slideNodes,
      vendors = ["-webkit-", "-moz-", "-ms-", "-o-", ""];

  function syncTransition () {
    var duration = sandbox.opt("duration") || 0;
    var ease = sandbox.opt("easing");
    if (ease) 
      ease = ease.bezier;
    slideNodes && $.each(slideNodes, function (node) {
      $.each(vendors, function (vendor) {
        $.css(node, vendor+"transition-duration", duration+"ms");
        ease && $.css(node, vendor+"transition-timing-function", "cubic-bezier("+ease+")");
      });
    });
  }

  function syncClass (value, old) {
    if (!node) return;
    $.removeClass(node, prefix+"clear")
    old && $.removeClass(node, prefix+old);
    value && $.addClass(node, prefix+value);
  }

  function onDurationChanged (o) {
    syncTransition();
  }
  function onEasingChanged (o) {
    syncTransition();
  }

  function onTransitionMode (m) {
    if (m == mode) return; // still the same mode
    if ((mode=m) != "css") syncClass("clear", sandbox.value());
    updateDOM();
  }

  var browser = (function(ua){
    if (ua.match(/.*(Chrome|Safari).*/)) return "webkit";
    if (ua.match(/.*Firefox.*/)) return "firefox";
    if (navigator.appName === "Opera") return "opera";
    return "webkit";
  }(navigator.userAgent||""));
  var transitionend = { webkit: "webkitTransitionEnd", opera: "oTransitionEnd", firefox: "transitionend" }[browser];

  function bindTransitionEnd(n) {
    $.on(n, transitionend, function(e) {
      var c = e.target.className;
      if (c.indexOf("slide")!=-1 && c.indexOf("current")!=-1 && e.propertyName=="z-index") {
        sandbox.trigger("transitionEnd", { mode: "css" });
      }
    });
  }

  function updateDOM () {
    syncTransition ();
    if (mode=="css")
      $.each(imageNodes||[], $.show);
    else
      $.each(imageNodes||[], $.hide);
  }
  
  function onTemplated (container) {
    node = $.find(container, ".sliderjs")[0];
    slideNodes = $.find(container, ".slide");
    imageNodes = $.find(container, ".slide img");
    syncClass(mode=="css" ? sandbox.value() : "clear");
    updateDOM();
    bindTransitionEnd(node);
  }

  return {
    accept: function (value) {
      return value && typeof(value)=="object" ? value.name : value;
    },
    init: function () {
      sandbox.
        on("templated", onTemplated).
        on("durationChanged", onDurationChanged).
        on("easingChanged", onEasingChanged).
        on("transitionMode", onTransitionMode);

      this.change(sandbox.value());
    },
    destroy: function () {
      sandbox.
        off("templated", onTemplated).
        off("durationChanged", onDurationChanged).
        off("easingChanged", onEasingChanged).
        off("transitionMode", onTransitionMode);
    },
    change: function (value, old) {
      if (value===undefined) return;
      syncClass(value, old);
      sandbox.trigger("transitionMode", "css");
    }
  }
});

sliderjs.cssTransitions = sliderjs.util.createRegistrable();

/**~~~duration~~~ handle the transition duration - the animation between 2 slides.
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("duration", function(sandbox, $) {
  return {
    def: 1000,
    accept: $.parseTime
  }
});

/**~~~easing~~~ define the transition easing function
 * 
 * GET an object with a .get(x) method and a .bezier array field.
 * .get is the CSS transition timing function 
 * .bezier the bezier curve representing this easing function
 *
 * SET can be:
 * - a predefined easing (linear, ease-in, ease-out, ...)
 * - a JS function
 * - a [ X1, Y1, X2, Y2 ] array representing the bezier curve transition easing function
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */

(function () {

  var Easing = {
    "ease":        [0.25, 0.1, 0.25, 1.0], 
    "linear":      [0.00, 0.0, 1.00, 1.0],
    "ease-in":     [0.42, 0.0, 1.00, 1.0],
    "ease-out":    [0.00, 0.0, 0.58, 1.0],
    "ease-in-out": [0.42, 0.0, 0.58, 1.0]
  }

sliderjs.modules("easing", function (sandbox, $) {
  return {
    def: "ease",
    accept: function (value) {
      if (typeof(value) == "function")
        return { get: value };
      if (typeof(value) == "string")
        value = { bezier: Easing[value] };
      else if (value instanceof Array)
        value = { bezier: value };
      if (value && value.bezier && !value.get) {
        var b = value.bezier;
        value.get = new KeySpline(b[0], b[1], b[2], b[3]).get;
      }
      return value;
    }
  }
});

/**
* KeySpline - use bezier curve for transition easing function
* is inspired from Firefox's nsSMILKeySpline.cpp
* Usage:
* var spline = new KeySpline(0.25, 0.1, 0.25, 1.0)
* spline.get(x) => returns the easing value | x must be in [0, 1] range
*/
function KeySpline (mX1, mY1, mX2, mY2) {

  this.get = function(aX) {
    if (mX1 == mY1 && mX2 == mY2) return aX; // linear
    return CalcBezier(GetTForX(aX), mY1, mY2);
  }

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C(aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function CalcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
  }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function GetSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  function GetTForX(aX) {
    // Newton raphson iteration
    var aGuessT = aX;
    for (var i = 0; i < 4; ++i) {
      var currentSlope = GetSlope(aGuessT, mX1, mX2);
      if (currentSlope == 0.0) return aGuessT;
      var currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }
}


}());

/*~~~fullscreen~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("fullscreen", function (sandbox, $) {
  var cl = "fullscreen";
  var oldW, oldH;
  var node;

  var nativeFullScreenSupported = isFullscreen() !== undefined;

  function requestFullScreen (node) {
    if (node.requestFullScreen)
      return node.requestFullScreen();
    if (node.webkitRequestFullScreen)
      return node.webkitRequestFullScreen();
    if (node.mozRequestFullScreen)
      return node.mozRequestFullScreen();
  }
  function cancelFullScreen () {
    if (document.cancelFullScreen)
      return document.cancelFullScreen();
    if (document.webkitCancelFullScreen)
      return document.webkitCancelFullScreen();
    if (document.mozCancelFullScreen)
      return document.mozCancelFullScreen();
  }
  function isFullscreen () {
    return (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen);
  }

  function onWindowResize () {
    var w = window.innerWidth, h = window.innerHeight;
    sandbox.opt("width", w).opt("height", h);
  }

  function setFullScreen (on) {
    if(on) {
      oldW = sandbox.opt("width");
      oldH = sandbox.opt("height");
      $.addClass(node, cl);
      onWindowResize();
      $.off(window, "resize", onWindowResize);
      $.on(window, "resize", onWindowResize);
    }
    else {
      oldW && sandbox.opt("width", oldW);
      oldH && sandbox.opt("height", oldH);
      $.removeClass(node, cl);
      $.off(window, "resize", onWindowResize);
    }
  }

  function get () {
    if (nativeFullScreenSupported)
      return isFullscreen();
    return sandbox.opt();
  }

  function set (value) {
    if (!node) return;
    if ( get() == value ) return;
    if (nativeFullScreenSupported) {
      if (value) {
        requestFullScreen(node);
      }
      else {
        cancelFullScreen();
      }
    }
    else {
      setFullScreen(value);
    }
  }
  
  function onTemplated (container) {
    node = $.find(container, ".sliderjs")[0];
    set(sandbox.value());
    $.on(node, "webkitfullscreenchange", onFullScreenEventChange);
    $.on(node, "mozfullscreenchange", onFullScreenEventChange);
    $.on(node, "fullscreenchange", onFullScreenEventChange);
  }

  function onFullScreenEventChange (e) {
    if (isFullscreen()) {
      setFullScreen(true);
    }
    else {
      setFullScreen(false);
    }
  }

  function onKeydown (e) {
    if (e.keyCode == 13) {
      setFullScreen(false);
    }
  }

  return {
    def: false,
    init: function () {
      sandbox.on("templated", onTemplated);
      $.on(window, "keydown", onKeydown);
    },
    destroy: function () {
      sandbox.off("templated", onTemplated);
      $.off(window, "keydown", onKeydown);
    },
    change: function (value) {
      set(value);
    }
  }
});


/*~~~fullscreenControl~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("fullscreenControl", function (sandbox, $) {
  
  var defaultValue = {
    tmpl: $.tmpl('<a class="fullscreenButton icon" href="javascript:;"></a>')
  };
    
  function template () {
    var v = sandbox.value();
    return v.tmpl($.extend({}, v, defaultValue));
  }
    
  function onTemplated (nodes, container) {
    var node = nodes[0];
    if (!node) return;
    $.on(node, "click", function (e) {
      e.preventDefault();
      sandbox.opt("fullscreen", !sandbox.opt("fullscreen"));
    });
  }

  function onKeyDown (e) {
    if (e.keyCode == 27 && sandbox.opt("fullscreen")) {
      sandbox.opt("fullscreen", false);
    }
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs div.left", template, onTemplated, 9);
      $.on(window, "keydown", onKeyDown);
    },
    accept: function (value) {
      return $.extend({}, defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    },
    destroy: function () {
      sandbox.template.remove(template);
      $.off(window, "keydown", onKeyDown);
    }
  }
});


//~~~ glsl transition
sliderjs.modules("glslTransition", function (sandbox, $) {
  var mode,
      container,
      drawing = false,
      canvas, gl,
      program, 
      supported = function () {
        var c = document.createElement("canvas");
        return !!getWebGLContext(c);
      }(),
      locations = {}, // cache for locations
      slide,
      images = [],
      defaultValue = {
        commutative: true,
        params: {}
      };

  var template = $.tmpl('<canvas class="slides"></canvas>');

  function syncHeight (h) {
    canvas.height = h;
    gl && syncViewport();
    !drawing && drawCurrentImage();
  }
  function syncWidth (w) {
    canvas.width = w;
    gl && syncViewport();
    !drawing && drawCurrentImage();
  }

  function onHeightChanged (o) {
    canvas && syncHeight(o.value);
  }
  function onWidthChanged  (o) {
    canvas && syncWidth(o.value);
  }

  function onSlideChanged (o) {
    slide = o;
    mode=="glsl" && gl && 
      startRender(o.old, o.value, sandbox.value());
  }

  function onImagesLoaded (o) {
    images = o.images;
    updateDOM();
  }
  
  function onTransitionMode (m) {
    if (m == mode) return; // still the same mode
    mode = m;
    updateDOM();
  }
 
  function onTemplated (nodes, container) {
    canvas = nodes[0];
    if (!canvas || !canvas.getContext) return;
    $.on(canvas, "webglcontextlost", function (evt) {
      console.log("webglcontextlost");
      gl = null;
      evt.preventDefault();
    });
    $.on(canvas, "webglcontextrestored", function (evt) {
      console.log("webglcontextrestored");
      gl = getWebGLContext(canvas);
      loadTransition(sandbox.value());
    });

    syncWidth(sandbox.opt("width"));
    syncHeight(sandbox.opt("height"));
    updateDOM();
    gl = getWebGLContext(canvas);
    if (!gl) {
      window["console"] && console.log("Unable to get a WebGL context.");
    }
    else {
      loadTransition(sandbox.value());
    }
  }

  function updateDOM () {
    if (!canvas) return;
    if (mode=="glsl") {
      $.show(canvas);
      drawCurrentImage();
    }
    else {
      $.hide(canvas);
    }
  }

  function setRectangle (x, y, width, height) {
    var x1 = x, x2 = x + width, y1 = y, y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2]), gl.STATIC_DRAW);
  }

  function loadTransition (transition) {
    if(!transition) return;
    var w = canvas.width, h = canvas.height;
    
    // Clean old program
    if (program) {
      gl.deleteProgram(program);
      program = null;
      locations = {};
    }

    // Create new program
    program = loadProgram([
        loadShader('attribute vec2 position;attribute vec2 texCoord_in;uniform vec2 resolution;varying vec2 texCoord;void main() {vec2 zeroToOne = position / resolution;vec2 zeroToTwo = zeroToOne * 2.0;vec2 clipSpace = zeroToTwo - 1.0;gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);texCoord = texCoord_in;}', gl.VERTEX_SHADER), 
        loadShader(transition.shader, gl.FRAGMENT_SHADER)
    ]);
    gl.useProgram(program);

    // bind custom params
    bindParams(transition.params);

    // buffer
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);

    // texCoord
    var texCoordLocation = gl.getAttribLocation(program, "texCoord_in");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


    // position
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    syncViewport();

    drawCurrentImage();
  }

  function syncViewport () {
    var w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h);
    var resolutionLocation = gl.getUniformLocation(program, "resolution");
    gl.uniform2f(resolutionLocation, w, h);
    var img = images[sandbox.opt("slide")];
    if (img) h = Math.floor(w * img.height / img.width);
    setRectangle(0, 0, w, h);
  }

  // custom params: only handle types: vecN[float], float
  function bindParams (params) {
    for (var k in params) {
      var value = params[k];
      var loc = gl.getUniformLocation(program, k);
      if (value instanceof Array) {
        if (typeof(value[0])=="number") {
          var fname = "uniform"+value.length+"f";
          gl[fname] && gl[fname].apply(this, [loc].concat(value));
        }
      }
      else if (typeof(value)=="number") {
        gl.uniform1f(loc, value);
      }
    }
  }

  function loadShader (shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      lastError = gl.getShaderInfoLog(shader);
      throw shader + "':" + lastError;
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
    
  function loadProgram (shaders) {
    var program = gl.createProgram();
    $.each(shaders, function (shader) {
      gl.attachShader(program, shader);
    });
    gl.linkProgram(program);

    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw "Linking error:" + gl.getProgramInfoLog (program);
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function createTexture (image) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // FIXME: the following line throw an error for cross domain images...
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  function setImages (from, to) {
    if (!from) return false;
    if (!to) return false;

    var fromTexture = createTexture(from),
        toTexture = createTexture(to);
    if(!locations.from) locations.from = gl.getUniformLocation(program, "from");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fromTexture);
    gl.uniform1i(locations.from, 0);

    if(!locations.to) locations.to = gl.getUniformLocation(program, "to");
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, toTexture);
    gl.uniform1i(locations.to, 1);

    syncViewport();
    return true;
  }

  function setProgress (p) {
    if(!locations.progress) locations.progress = gl.getUniformLocation(program, "progress");
    gl.uniform1f(locations.progress, p);
  }
  
  function drawImage (image) {
    setProgress(0);
    setImages(image, image) && draw();
  }

  function drawCurrentImage () {
    var image = images[slide ? slide.value : sandbox.opt("slide")];
    image && gl && drawImage(image);
  }

  function draw () {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  function getWebGLContext (canvas) {
    if (!canvas.getContext) return;
    var names = ["webgl", "experimental-webgl"];
    for (var i = 0; i < names.length; ++i) {
      try {
        var ctx = canvas.getContext(names[i]);
        if (ctx) return ctx;
      } catch(e) {
      }
    }
  }

  function startRender (fromSlide, toSlide, transition) {
    var renderId = $.uuid(),
        transitionStart = $.now(),
        transitionDuration = sandbox.opt('duration') || 0,
        transitionEasing = sandbox.opt('easing'),
        reverse = transition.commutative && fromSlide > toSlide;

    transitionEasing = transitionEasing && transitionEasing.get || function (t) { return t };

    if (!setImages(images[reverse ? toSlide : fromSlide], images[reverse ? fromSlide : toSlide]))
      return;

    drawing = true;
    (function render (id) {
      var now = $.now();
      if(id != renderId || now < transitionStart) return;
      var p = (now-transitionStart)/transitionDuration;
      if (p<1) {
        requestAnimFrame(function () { render(id) }, canvas);
        p = transitionEasing(p);
        setProgress(reverse ? 1-p : p);
        draw();
      }
      else {
        drawing = false;
        drawCurrentImage();
        sandbox.trigger("transitionEnd", { mode: "glsl" });
      }
    } (renderId));
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs div.slides", template, onTemplated);
      sandbox.
        on("slideChanged", onSlideChanged).
        on("heightChanged", onHeightChanged).
        on("widthChanged", onWidthChanged).
        on("imagesLoaded", onImagesLoaded).
        on("transitionMode", onTransitionMode);
      this.change(sandbox.value());
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("slideChanged", onSlideChanged).
        off("heightChanged", onHeightChanged).
        off("widthChanged", onWidthChanged).
        off("imagesLoaded", onImagesLoaded).
        off("transitionMode", onTransitionMode);
    },
    accept: function (value, old) {
      if (!value) return value;
      if (typeof(value) == "string") value = { name: value };
      value = $.extend({}, defaultValue, value, sliderjs.glslTransitions(value.name), value);
      if(!value.shader) throw new Error("no shader was found.");
      return value;
    },
    change: function (value) {
      if (value===undefined) return;
      updateDOM();
      gl && loadTransition(sandbox.value());
      sandbox.trigger("transitionMode", "glsl");
    },
    supported: function () { return supported }
  }
});

/**
 * define a new fragment shader
 */
sliderjs.glslTransitions = sliderjs.util.createRegistrable();

/*~~~height~~~ handle the height of the slider
 * 
 * GET: the current height (integer)
 * SET: a new height (integer)
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("height", function (sandbox, $) {
  return {
    def: 430
  }
});


/*~~~loader~~~ handle loading display
 *
 * GET: a templating object
 * SET: 
 * - a string describing the strategy of the loader : "waitingAll", "waitingFirst", "waitingCurrent"
 * - a templating object to patch. (if you want to modify the loader template)
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
// passing a string will have different kind of loader (percent, image, ...)
sliderjs.modules("loader", function (sandbox, $) {
  var node, sliderjs, event, state, 
      id = -1, loading = true;

  var defaultValue = {
    tmpl: $.tmpl('<div class="loader"><p><span class="spinner"></span> <span class="percent"><%= percent %></span> %</p></div>'),
    percent: 0,
    onLoading: function (state, node) {
      $.html($.find(node, ".percent")[0], ""+Math.floor(100*state.sum/state.total));
    },
    mode: "waitingAll"
  }

  function template () {
    var v = sandbox.value();
    return v.tmpl(v);
  }

  function syncHeight (h) {
    if (!node) return;
    var hpx = h ? h+"px" : "";
    $.height(node, hpx);
  }

  function onHeightChanged (o) {
    syncHeight(o.value);
  }

  function onTemplated (nodes, container) {
    node = nodes[0];
    sliderjs = $.find(container, ".sliderjs")[0];
    syncHeight(sandbox.opt("height"));
    loading && startLoading();
  }

  function eventForStrategy (s) {
    if(s=="waitingFirst") return "firstSlideLoaded";
    if(s=="waitingCurrent") return "currentSlideLoaded";
    if(s=="waitingAll") return "imagesLoaded";
    return null;
  }

  function loadingForStrategy (s) {
    switch (s) {
      case "waitingFirst":
      case "waitingCurrent":
      case "waitingAll":
        return true;
    }
    return false;
  }

  function endLoading () {
    sliderjs && $.removeClass(sliderjs, "loading");
    sandbox.trigger("loaderLoaded");
    state = null;
  }

  function startLoading () {
    sliderjs && $.addClass(sliderjs, "loading");
    sandbox.trigger("loaderLoading");
  }

  function syncLoader (o) {
    if (!sliderjs) return;
    if (state && (state.sum == state.total)) {
      endLoading();
    }
    else {
      var onLoading = sandbox.value().onLoading;
      state && onLoading && onLoading(state, sliderjs);
      if(o.id !== id) {
        startLoading();
        id = o.id;
      }
    }
  }

  function onImagesLoading (o) {
    if (o) state = o.state;
    loading && syncLoader(o);
  }

  function onImagesLoaded (o) {
    if (o) state = o.state;
    loading && syncLoader(o);
  }

  function handler (o) {
    endLoading();
  }

  function syncMode (mode) {
    loading = loadingForStrategy(mode);
    event = eventForStrategy(mode);
    sandbox.off(event, handler).once(event, handler);
  }

  return {
    def: defaultValue,
    init: function () {
      sandbox.template.add(".sliderjs", template, onTemplated, 10);
      sandbox.
        on("heightChanged", onHeightChanged).
        on("imagesLoading", onImagesLoading).
        on("imagesLoaded", onImagesLoaded);
      var value = sandbox.value();
      value.mode && syncMode(value.mode);
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("heightChanged", onHeightChanged).
        off("imagesLoading", onImagesLoading).
        off("imagesLoaded", onImagesLoaded);
    },
    accept: function (value) {
      if (typeof(value) == "string") value = { mode: value };
      return $.extend(defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
      value.mode && syncMode(value.mode);
    }
  }
});


/*~~~loop~~~ start / stop the auto slide mode with a specific duration
 *
 * GET: the millisecond time for the current loop (0 is the loop is stopped)
 * SET:
 *  - an integer: set the duration  between each slides (in ms) and start the loop
 *  - "start": start the loop with the latest set duration (or the default)
 *  - "stop": stop the loop if running
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("loop", function (sandbox, $) {
  var defaultValue = 5000, lastHumanNav = 0, timeout;

  function onPagesClicked () {
    lastHumanNav = $.now();
  }

  function loop () {
    if($.now()-lastHumanNav > 2000) sandbox.opt("slide", "next");
    iterateLoop();
  }

  function iterateLoop () {
    timeout = setTimeout(loop, sandbox.value());
  }

  function stop () {
    timeout && clearTimeout(timeout);
    timeout = null;
  }
  
  function start () {
    lastHumanNav = 0;
    stop();
    iterateLoop();
  }

  return {
    def: "start",
    init: function () {
      sandbox.on("pagesClicked", onPagesClicked);
      this.change(sandbox.value());
    },
    destroy: function () {
      stop();
      sandbox.off("pagesClicked", onPagesClicked);
    },
    accept: function (value, old) {
      if(value == "start") return defaultValue;
      if(value == "stop") return 0;
      value = $.parseTime(value);
      if (!isNaN(value) && value > 0)
        return defaultValue = value;
      return 0;
    },
    change: function (value, old) {
      if(value) start();
      else stop();
    }
  }
});


/*~~~loopBar~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("loopBar", function (sandbox, $) {

  var interval,
      lastSlide = $.now(),
      oldP,
      node, inner, 
      loop = sandbox.opt("loop"),
      defaultValue = {
        width: 100,
        tmpl: $.tmpl('<span class="loopBar" style="width: <%= width %>px;"><span class="loopBar-inner"></span></span>')
      };

  function template () {
    var v = sandbox.value();
    return v.tmpl(v);
  }

  function onTemplated (nodes, container) {
    node = nodes[0];
    if (!node) return;
    inner = $.find(node, ".loopBar-inner")[0];
    render();
  }

  function onLoopChanged (o) {
    loop = o.value;
    lastSlide = $.now();
    inner && updateProgress();
  }

  function onSlideChanged (o) {
    lastSlide = $.now();
    inner && updateProgress();
  }

  function updateProgress () {
    var p = loop ? (Math.max(0, Math.min(1, ($.now()-lastSlide)/loop))) : 0;
    (p !== oldP) && $.width(inner, Math.round((oldP=p)*10000)/100+"%");
  }

  function render () {
    if (inner) {
      requestAnimFrame(render, inner);
      updateProgress();
    }
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs .header", template, onTemplated, -6);
      sandbox.
        on("loopChanged", onLoopChanged).
        on("slideChanged", onSlideChanged);
      render();
    },
    accept: function (value) {
      return $.extend({}, defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("loopChanged", onLoopChanged).
        off("slideChanged", onSlideChanged);
    }
  }
});


/*~~~nextControl~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("nextControl", function (sandbox, $) {

  var defaultValue = {
    text: "→",
    tmpl: $.tmpl('<a class="nextSlide" href="javascript:;"><%= text %></a>')
  };

  function template () {
    var v = sandbox.value();
    return v.tmpl(v);
  }

  function onTemplated (nodes, container) {
    var node = nodes[0];
    if (!node) return;
    $.on(node, "click", function (e) {
      e.preventDefault();
      sandbox.opt("slide", "next").trigger("pagesClicked");
    });
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs .footer", template, onTemplated, -9);
    },
    accept: function (value) {
      return $.extend({}, defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    },
    destroy: function () {
      sandbox.template.remove(template);
    }
  }
});


/*~~~pages~~~ handle navigation
 *
 * GET: a templating object
 * SET: a templating object
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("pages", function (sandbox, $) {
  var node, pages,
  defaultValue = {
    tmpl: $.tmpl('<span class="pages"> <% if(obj.slides){for(var i=0;i<slides.length;++i){var s=slides[i]; %> <a href="<%= s.image %>" class="page"><%= i+1 %></a> <% }} %> </span>')
  };

  function template () {
    var v = sandbox.value();
    return v.tmpl($.extend({}, v, {
      slides: sandbox.opt("slides") 
    }));
  }

  function onTemplated (nodes) {
    node = nodes[0];
    if (!node) return;
    pages = $.find(node, ".page");
    $.each(pages, function (n, i) {
      var slide = i;
      $.on(n, "click", function (e) {
        e.preventDefault();
        sandbox.opt("slide", slide).trigger("pagesClicked");
      });
    });
    var current = pages[sandbox.opt("slide")];
    current && $.addClass(current, "current");
  }

  function onSlidesChanged (o) {
    sandbox.template.refresh(template);
  }

  function onSlideChanged (o) {
    if(!pages) return;
    var old = pages[o.old];
    var value = pages[o.value];
    old && $.removeClass(old, "current");
    value && $.addClass(value, "current");
  }
  
  return { 
    def: defaultValue,
    init: function () {
      sandbox.template.add(".sliderjs .footer", template, onTemplated, -9);
      sandbox.
        on("slidesChanged", onSlidesChanged).
        on("slideChanged", onSlideChanged);
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("slidesChanged", onSlidesChanged).
        off("slideChanged", onSlideChanged);
    },
    accept: function (value) {
      return $.extend(defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    }
  }
});


/*~~~playPauseControl~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("playPauseControl", function (sandbox, $) {
  
  var node, defaultValue = {
    tmpl: $.tmpl('<a class="playPauseControl icon" href="javascript:;"></a>')
  };
    
  function template () {
    var v = sandbox.value();
    return v.tmpl($.extend({}, v, defaultValue));
  }

  function running () {
    return sandbox.opt("loop")>0;
  }

  function syncButton () {
    if (!node) return;
    if (running()) {
      $.addClass(node, "pause");
      $.removeClass(node, "play");
    }
    else {
      $.addClass(node, "play");
      $.removeClass(node, "pause");
    }
  }
    
  function onTemplated (nodes, container) {
    node = nodes[0];
    if (!node) return;
    syncButton();
    $.on(node, "click", function (e) {
      e.preventDefault();
      sandbox.opt("loop", !running() ? "start" : "stop");
      syncButton();
    });
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs div.left", template, onTemplated, 7);
    },
    accept: function (value) {
      return $.extend({}, defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    },
    destroy: function () {
      sandbox.template.remove(template);
    }
  }
});


/*~~~prevControl~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("prevControl", function (sandbox, $) {

  var defaultValue = {
    text: "←",
    tmpl: $.tmpl('<a class="prevSlide" href="javascript:;"><%= text %></a>')
  };

  function template () {
    var v = sandbox.value();
    return v.tmpl(v);
  }

  function onTemplated (nodes, container) {
    var node = nodes[0];
    if (!node) return;
    $.on(node, "click", function (e) {
      e.preventDefault();
      sandbox.opt("slide", "prev").trigger("pagesClicked");
    });
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs .footer", template, onTemplated, 9);
    },
    accept: function (value) {
      return $.extend({}, defaultValue, value);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
    },
    destroy: function () {
      sandbox.template.remove(template);
    }
  }
});


/*~~~ slide~~~ handle the current slide number
 * 
 * GET: get an integer of the current slide from 0 to N (where N+1 is the number of slides)
 * SET: 
 * - an integer: the slide index to move to
 * - "next": move to the next slide (in a circular way)
 * - "prev": move to the previous slide (in a circular way)
 * 
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("slide", function (sandbox, $) {
  function circular(num, max) { return num-max*Math.floor(num/max) }

  function onSlidesChanged (o) {
    sandbox.value(0);
  }

  return {
    def: 0,
    init: function () {
      sandbox.on("slidesChanged", onSlidesChanged);
    },
    destroy: function () {
      sandbox.off("slidesChanged", onSlidesChanged);
    },
    accept: function (value, old) {
      switch (typeof(value)) {
        case "number": return value;
        case "string":
          var slides = sandbox.opt("slides");
          if (slides && slides.length) {
            if (value=="next") return circular(old+1, slides.length);
            if (value=="prev") return circular(old-1, slides.length);
          }
      }
      return 0;
    }
  }
});


//~~~ Slides
sliderjs.modules("slides", function (sandbox, $) {
  var node, nodes, images,
      loading,
      tmpl = $.tmpl('<div class="slides"><% if(obj.slides){for(var i=0;i<slides.length;++i){var s=slides[i]; %> <div class="slide"> <% if(s.link){ %><a target="_blank" href="<%= s.link %>"><% } %> <img src="<%= s.image %>"><% if(s.legend){ %><span class="caption"><%= s.legend %></span> <% } if(s.link){ %></a><% } %> </div> <% }} %> </div>');

  function template () {
    return tmpl({ slides: sandbox.value() });
  }

  function syncHeight (h) {
    var hpx = h ? h+"px" : "";
    node && $.height(node, hpx);
  }

  function onHeightChanged (o) {
    syncHeight(o.value);
  }

  function syncWidth (w) {
    var wpx = w ? w+"px" : "";
    nodes && $.each(nodes, function (node) {
      $.width(node, wpx);
    });
  }

  function onWidthChanged (o) {
    syncWidth(o.value);
  }

  function syncSlide (value, old) {
    if(!nodes) return;
    var oldN = nodes[old], valueN = nodes[value];
    oldN && $.removeClass(oldN, "current");
    valueN && $.addClass(valueN, "current");
  }

  function onTemplated (n) {
    node = n[0];
    if (!node) return;
    nodes = $.find(node, ".slide");
    syncSlide (sandbox.opt("slide"));
    syncHeight (sandbox.opt("height"));
    syncWidth (sandbox.opt("width"));
    load(sandbox.value());
  }

  function onSlideChanged (o) {
    syncSlide(o.value, o.old);
  }

  function load (slides) {
    if (!slides) return;
    var state = { success: 0, error: 0, abort: 0, total: slides.length, sum: null };
    var handle = function (e, i, img, id) {
      if(id !== loading) return; // if slides has changed since, don't trigger events anymore
      state = $.extend({ sum: state.success + state.error + state.abort }, state)
      if(e) { 
        ++state[e];
        ++state.sum;
      }
      if(i==sandbox.opt("slide")) sandbox.trigger("currentSlideLoaded", { id: id, img: img, state: state });
      if(state.success==1) sandbox.trigger("firstSlideLoaded", { id: id, i: i, img: img, state: state });
      if(state.sum==slides.length) {
        sandbox.trigger("imagesLoaded", { state: state, id: id, images: images });
        loading = false;
      }
      else
        sandbox.trigger("imagesLoading", { state: state, id: id });
    }
    var id = loading = $.uuid();
    images = $.map(slides, function (slide, i){
      var img = new Image();
      $.on(img, "load",  function () { handle("success", i, img, id) });
      $.on(img, "error", function () { handle("error", i, img, id) });
      $.on(img, "abort", function () { handle("abort", i, img, id) });
      img.src = slide.image;
      return img;
    });
  }

  return {
    def: [],
    init: function () {
      sandbox.template.add(".sliderjs", template, onTemplated, 10);
      sandbox.
        on("heightChanged", onHeightChanged).
        on("widthChanged", onWidthChanged).
        on("slideChanged", onSlideChanged);
    },
    destroy: function () {
      sandbox.template.remove(template);
      sandbox.
        off("heightChanged", onHeightChanged).
        off("widthChanged", onWidthChanged).
        off("slideChanged", onSlideChanged);
    },
    change: function (value, old) {
      sandbox.template.refresh(template);
      load(value);
    }
  }
});


/*~~~template~~~ The main sliderjs template
 *
 * GET: the node of the slider
 * SET: none
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("template", function (sandbox, $) {
  var node, 
      root = $.tmpl('<div class="sliderjs"></div>'), 
      header = $.tmpl('<div class="header"></div>'),
      footer = $.tmpl('<div class="footer"></div>'),
      left = $.tmpl('<div class="left"></div>'),
      right = $.tmpl('<div class="right"></div>');
  
 function syncWidth (w) {
    if (!node) return;
    var wpx = w ? w+"px" : "";
    $.width(node, wpx);
  }

  function onWidthChanged (o) {
    syncWidth(o.value);
  }

  return {
    fn: function () {
      return node;
    },
    init: function () {
      sandbox.template.
        add(null, root, function (nodes) { 
          node = nodes[0];
          syncWidth (sandbox.opt("width"));
        }).
        add(".sliderjs", header, null, 99).
        add(".sliderjs", left, null, 50).
        add(".sliderjs", right, null, -50).
        add(".sliderjs", footer, null, -99);
      sandbox.on("widthChanged", onWidthChanged);
    },
    destroy: function () {
      sandbox.template.
        remove(header).
        remove(footer).
        remove(left).
        remove(right).
        remove(root);
      sandbox.off("widthChanged", onWidthChanged);
    }
  }
});


/*~~~theme~~~ Define the current themes for the display (color / layout).
 * 
 * GET: an array of themes
 * SET: a list of themes to set. Each theme is defined in the themes/{name}.* file. It is linked to the ("th-"+name) CSS class.
 * - an array of themes or a string with themes splits by commas or spaces.
 * - an object with a "add" | "remove" | "only" arrays/strings to add some themes | remove some themes | replace themes (like passing a direct array)
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("theme", function (sandbox, $) {
  var node;
  var prefix = "th-", 
      defaultValue = $.getList("black black-icon black-caption black-blue-controls shadow hide-header-hover embed dots pages-border pages-bottom pages-shadow");

  function syncTheme(value, old) {
    if (!node) return;
    old && $.each(old, function (t) {
      $.removeClass(node, prefix+t);
    });
    $.each(value, function (t) {
      $.addClass(node, prefix+t);
    });
  }

  function onTemplated (container) {
    node = $.find(container, ".sliderjs")[0];
    syncTheme(sandbox.value());
  }

  return {
    def: defaultValue,
    init: function () {
      sandbox.on("templated", onTemplated);
    },
    destroy: function () {
      sandbox.off("templated", onTemplated);
    },
    accept: function (value, old) {
      if (typeof(value) == "object" && !(value instanceof Array)) {
        var toReplace = value.only!==undefined ? $.getList(value.only) : (old||defaultValue),
            toAdd = $.getList(value.add),
            toRemove = $.getList(value.remove);
        return $.dif(toReplace.concat(toAdd), toRemove);
      }
      else {
        return $.getList(value); 
      }
    },
    change: function (value, old) {
      syncTheme(value, old);
    }
  }
});

sliderjs.themes = sliderjs.util.createRegistrable();

/*~~~transition~~~ Shortcut for the different kind of transitions (css, canvas, ...)
 *
 * GET: the last current transition (except if you used a specific transition module like cssTransition)
 * SET: a new transition:
 *  - { mode: string, name: string } : will trigger the transition of the related module.
 *  the mode must be valid : (mode+"Transition") should be a valid module. ex: mode="css"
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("transition", function (sandbox, $) {
  var suffix = "Transition",
      fallback = { mode: "css", name: "simple" };

  function transitionSupported (t) {
    if (!t || !t.mode) return false;
    var supported = sandbox.ask(t.mode+suffix, "supported");
    return !supported || supported();
  }

  return {
    def: fallback,
    init: function () {
      this.change(sandbox.value());
    },
    destroy: function () {
    },
    accept: function (value, old) {
      if (!value) return value;
      if (value instanceof Array) {
        for (var i=0; i<value.length; ++i)
          if(transitionSupported(value[i])) 
            return value[i];
      }
      else {
        if (transitionSupported(value)) return value;
      }
      return fallback;
    },
    change: function (value, old) {
      if (!value) return;
      sandbox.opt(value.mode+suffix, value);
    }
  }
});


/*~~~transitions~~~ Handling multiple transition to change frequently
 *
 * GET:
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("transitions", function (sandbox, $) {
  
  var defaultValue = {
    transitions: [],
    everySlides: 3,
    change: "random"
  };

  var current = 0;

  function syncCurrentTransition (v) {
    var t = v.transitions[current];
    t && sandbox.opt("transition", v.transitions[current]);
  }

  function nextCurrent (v) {
    switch (v.change) {
      case "random": return Math.floor(Math.random()*v.transitions.length);
      case "circular": return current+1<v.transitions.length ? current+1 : 0;
    }
    return 0;
  }

  function next (v) {
    if (!v || v.transitions.length <= 0) return;
    current = nextCurrent(v);
    syncCurrentTransition(v);
  }

  var skipped = 0;
  function onTransitionEnd (o) {
    var v = sandbox.value();
    if (!v) return;
    if (++skipped >= v.everySlides) {
      next(v);
      skipped = 0;
    }
  }

  return {
    init: function () {
      sandbox.
        on("transitionEnd", onTransitionEnd);
      this.change(sandbox.value());
    },
    destroy: function () {
      sandbox.
        off("transitionEnd", onTransitionEnd);
    },
    accept: function (value, old) {
      if (!value) return;
      if (value instanceof Array) value = { transitions: value };
      return $.extend(defaultValue, value);
    },
    change: function (value, old) {
      value && syncCurrentTransition(value);
    }
  }
});


/*~~~width~~~ handle the width of the slider
 * 
 * GET: the current width (integer)
 * SET: a new width (integer)
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("width", function (sandbox, $) {
  return {
    def: 640
  }
});


sliderjs.canvasTransitions("circle", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    ctx.arc(w/2, h/2, 0.6*p*Math.max(w, h), 0, Math.PI*2, false);
  }
});



sliderjs.canvasTransitions("circles", {
  params: { split: 10 },
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var circleH, circleW, circlesX, circlesY, cx, cy, maxRad, maxWH, r, x, y;
    circlesX = params.split;
    circlesY = Math.floor(circlesX * h / w);
    circleW = w / circlesX;
    circleH = h / circlesY;
    maxWH = Math.max(w, h);
    maxRad = 0.7 * Math.max(circleW, circleH);
    for (x = 0; x <= circlesX; x++) {
      for (y = 0; y <= circlesY; y++) {
        cx = (x + 0.5) * circleW;
        cy = (y + 0.5) * circleH;
        r = Math.max(0, Math.min(2 * p - cx / w, 1)) * maxRad;
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
      }
    }
  }
});



sliderjs.canvasTransitions("clock", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.moveTo(w/2, h/2);
    ctx.arc(w/2, h/2, Math.max(w, h), 0, Math.PI*2*o.progress, false);
  }
});



sliderjs.canvasTransitions("diamond", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var w2 = w/2;
    var h2 = h/2;
    var dh = p*h;
    var dw = p*w;
    ctx.moveTo(w2,    h2-dh);
    ctx.lineTo(w2+dw, h2);
    ctx.lineTo(w2,    h2+dh);
    ctx.lineTo(w2-dw, h2);
  }
});


sliderjs.canvasTransitions("horizontalOpen", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    ctx.rect(0, (1 - p) * h / 2, w, h * p);
  }
});


sliderjs.canvasTransitions("horizontalSunblind", {
  easing: 'easeOutCubic',
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blind, blindHeight, blinds;
    blinds = params.split || 6;
    blindHeight = h / blinds;
    for (blind = 0; blind <= blinds; blind++)
      ctx.rect(0, blindHeight * blind, w, blindHeight * p);
  }
});


sliderjs.canvasTransitions("squares", {
  easing: 'easeOutCubic',
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blindHeight, blindWidth, blindsX, blindsY, prog, rh, rw, sx, sy, x, y;
    blindsX = params.split || 8;
    blindsY = Math.floor(blindsX * h / w);
    blindWidth = w / blindsX;
    blindHeight = h / blindsY;
    for (x = 0; x <= blindsX; x++) {
      for (y = 0; y <= blindsY; y++) {
        sx = blindWidth * x;
        sy = blindHeight * y;
        prog = Math.max(0, Math.min(3 * p - sx / w - sy / h, 1));
        rw = blindWidth * prog;
        rh = blindHeight * prog;
        ctx.rect(sx - rw / 2, sy - rh / 2, rw, rh);
      }
    }
  }
});


sliderjs.canvasTransitions("verticalOpen", {
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    var h1, h2, hi, nbSpike, pw, spikeh, spikel, spiker, spikew, xl, xr;
    nbSpike = params.split || 8;
    spikeh = h / (2 * nbSpike);
    spikew = spikeh;
    pw = o.progress * w / 2;
    xl = w / 2 - pw;
    xr = w / 2 + pw;
    spikel = xl - spikew;
    spiker = xr + spikew;
    ctx.moveTo(xl, 0);
    for (hi = 0; hi <= nbSpike; hi++) {
      h1 = (2 * hi) * spikeh;
      h2 = h1 + spikeh;
      ctx.lineTo(spikel, h1);
      ctx.lineTo(xl, h2);
    }
    ctx.lineTo(spiker, h);
    for (hi = nbSpike; hi >= 0; hi--) {
      h1 = (2 * hi) * spikeh;
      h2 = h1 - spikeh;
      ctx.lineTo(xr, h1);
      ctx.lineTo(spiker, h2);
    }
  }
});


sliderjs.canvasTransitions("verticalSunblind", {
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blind, blindWidth, blinds, prog;
    blinds = params.split || 10;
    blindWidth = w / blinds;
    for (blind = 0; blind <= blinds; blind++) {
      prog = Math.max(0, Math.min(2 * p - (blind + 1) / blinds, 1));
      ctx.rect(blindWidth * blind, 0, blindWidth * prog, h);
    }
  }
});

/*~~~_~~~ glsl transitions */
sliderjs.glslTransitions('_', sliderjs.util.extend({ params: { size: 0.3 } }, {
  shader: '//!{ params: { size: 0.3 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nvoid main() {\n  float p = smoothstep(texCoord.x-size, texCoord.x+size, progress*(1.+2.*size) - size);\n  vec4 texTo = texture2D(to, texCoord);\n  vec4 texFrom = texture2D(from, texCoord);\n  vec4 pTo = vec4(\n    smoothstep(0.00, 0.50, p), \n    smoothstep(0.25, 0.75, p),\n    smoothstep(0.50, 1.00, p),\n    p);\n  vec4 pFrom = vec4(1. - p);\n  gl_FragColor = texTo*pTo+texFrom*pFrom;\n}'
}));

/*~~~blur~~~ glsl transitions */
sliderjs.glslTransitions('blur', sliderjs.util.extend({ params: { size: 0.02 } }, {
  shader: '//!{ params: { size: 0.02 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nvec4 blur(sampler2D t, vec2 c, float b) {\n   vec4 sum = texture2D(t, c);\n   sum += texture2D(t, c+b*vec2(-0.326212, -0.405805));\n   sum += texture2D(t, c+b*vec2(-0.840144, -0.073580));\n   sum += texture2D(t, c+b*vec2(-0.695914,  0.457137));\n   sum += texture2D(t, c+b*vec2(-0.203345,  0.620716));\n   sum += texture2D(t, c+b*vec2( 0.962340, -0.194983));\n   sum += texture2D(t, c+b*vec2( 0.473434, -0.480026));\n   sum += texture2D(t, c+b*vec2( 0.519456,  0.767022));\n   sum += texture2D(t, c+b*vec2( 0.185461, -0.893124));\n   sum += texture2D(t, c+b*vec2( 0.507431,  0.064425));\n   sum += texture2D(t, c+b*vec2( 0.896420,  0.412458));\n   sum += texture2D(t, c+b*vec2(-0.321940, -0.932615));\n   sum += texture2D(t, c+b*vec2(-0.791559, -0.597705));\n   return sum / 13.0;\n}\n\nvoid main()\n{\n  float pinv = 1.-progress;\n  gl_FragColor = pinv*blur(from, texCoord, progress*size) + progress*blur(to, texCoord, pinv*size);\n}'
}));

/*~~~deformation~~~ glsl transitions */
sliderjs.glslTransitions('deformation', sliderjs.util.extend({ params: { size: 0.05, zoom: 20.0 } }, {
  shader: '//!{ params: { size: 0.05, zoom: 20.0 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\nuniform float zoom;\n\nvoid main() {\n  float pinv = 1. - progress;\n  vec2 disp = size*vec2(cos(zoom*texCoord.x), sin(zoom*texCoord.y));\n  vec4 texTo = texture2D(to, texCoord + pinv*disp);\n  vec4 texFrom = texture2D(from, texCoord + progress*disp);\n  gl_FragColor = texTo*progress + texFrom*pinv;\n}'
}));

/*~~~diag~~~ glsl transitions */
sliderjs.glslTransitions('diag', sliderjs.util.extend({}, {
  shader: '#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nvoid main() {\n  float effectsize = (size > 0.0) ? size : 0.2;\n  float pTo = 2.*(progress+effectsize*(2.*progress-1.));\n  float pos = texCoord.x+texCoord.y;\n  pTo = smoothstep(pos-effectsize, pos+effectsize, pTo);\n  float pFrom = 1.0 - pTo;\n  gl_FragColor = pTo*texture2D(to,texCoord) + pFrom*texture2D(from,texCoord);\n}'
}));

/*~~~dislocation~~~ glsl transitions */
sliderjs.glslTransitions('dislocation', sliderjs.util.extend({}, {
  shader: '#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float displacement;\n\nvoid main() {\n  float disp = displacement>0.0 ? displacement : 0.2;\n  float p = progress;\n  float pTo = p;\n  float pFrom = 1.-p;\n  float d = disp*progress;\n  gl_FragColor = texture2D(to, texCoord)*pTo;\n  if (pFrom > 0.99) {\n    gl_FragColor += pFrom*texture2D(from, texCoord);\n  }\n  else {\n    gl_FragColor += pFrom*0.2*texture2D(from, texCoord);\n    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(d, d));\n    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(-d, d));\n    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(-d, -d));\n    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(d, -d));\n  }\n}'
}));

/*~~~flash~~~ glsl transitions */
sliderjs.glslTransitions('flash', sliderjs.util.extend({ params: { insolation: 4.0 }, easing: 'easeOutCubic' }, {
  shader: '//!{ params: { insolation: 4.0 }, easing: \'easeOutCubic\' }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float insolation;\n\nvoid main() {\n  gl_FragColor = progress*texture2D(to, texCoord) + (1.-progress)*texture2D(from, texCoord);\n  gl_FragColor *= (1.+insolation*max(0., .5-abs(progress-.5)));\n}'
}));

/*~~~rainbow~~~ glsl transitions */
sliderjs.glslTransitions('rainbow', sliderjs.util.extend({ params: { size: 0.3 } }, {
  shader: '//!{ params: { size: 0.3 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nvoid main() {\n  float p = smoothstep(texCoord.x-size, texCoord.x+size, progress*(1.+2.*size) - size);\n  vec4 texTo = texture2D(to, texCoord);\n  vec4 texFrom = texture2D(from, texCoord);\n  vec4 pTo = vec4(\n    smoothstep(0.00, 0.50, p), \n    smoothstep(0.25, 0.75, p),\n    smoothstep(0.50, 1.00, p),\n    p);\n  vec4 pFrom = vec4(1. - p);\n  gl_FragColor = texTo*pTo+texFrom*pFrom;\n}'
}));

/*~~~simple~~~ glsl transitions */
sliderjs.glslTransitions('simple', sliderjs.util.extend({}, {
  shader: '#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\nvoid main() {\n  gl_FragColor = progress*texture2D(to,texCoord) + (1.0-progress)*texture2D(from,texCoord);\n}'
}));

/*~~~smoothl~~~ glsl transitions */
sliderjs.glslTransitions('smoothl', sliderjs.util.extend({ params: { size: 0.3 } }, {
  shader: '//!{ params: { size: 0.3 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nvoid main() {\n  float p = smoothstep(texCoord.x-size, texCoord.x+size, progress*(1.+2.*size) - size);\n  float pinv = 1.-p;\n  vec4 texTo = texture2D(to, texCoord);\n  vec4 texFrom = texture2D(from, texCoord);\n  gl_FragColor = texTo*p+texFrom*pinv;\n}'
}));

/*~~~wind~~~ glsl transitions */
sliderjs.glslTransitions('wind', sliderjs.util.extend({ params: { size: 0.2 } }, {
  shader: '//!{ params: { size: 0.2 } }\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nvarying vec2 texCoord;\nuniform vec2 resolution;\n\n// Custom parameters\nuniform float size;\n\nfloat rand(vec2 co){\n  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvoid main() {\n  float pTo = progress*(1.0+2.0*size) - size;\n  float r = size * rand(vec2(0, texCoord.y));\n  pTo = clamp(1.-(texCoord.x-pTo-r)/size, 0., 1.);\n  float pFrom = 1.0 - pTo;\n  gl_FragColor = pTo*texture2D(to,texCoord) + pFrom*texture2D(from,texCoord);\n}'
}));
