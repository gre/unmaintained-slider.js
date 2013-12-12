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

