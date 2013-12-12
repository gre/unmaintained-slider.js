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

