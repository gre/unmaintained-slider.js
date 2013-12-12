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

