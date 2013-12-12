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

