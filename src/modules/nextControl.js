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

