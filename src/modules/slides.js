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

