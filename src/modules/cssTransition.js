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
