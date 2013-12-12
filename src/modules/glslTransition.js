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
