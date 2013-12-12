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

