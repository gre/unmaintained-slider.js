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

