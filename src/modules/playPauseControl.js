/*~~~playPauseControl~~~ 
 *
 * GET: 
 * SET: 
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("playPauseControl", function (sandbox, $) {
  
  var node, defaultValue = {
    tmpl: $.tmpl('<a class="playPauseControl icon" href="javascript:;"></a>')
  };
    
  function template () {
    var v = sandbox.value();
    return v.tmpl($.extend({}, v, defaultValue));
  }

  function running () {
    return sandbox.opt("loop")>0;
  }

  function syncButton () {
    if (!node) return;
    if (running()) {
      $.addClass(node, "pause");
      $.removeClass(node, "play");
    }
    else {
      $.addClass(node, "play");
      $.removeClass(node, "pause");
    }
  }
    
  function onTemplated (nodes, container) {
    node = nodes[0];
    if (!node) return;
    syncButton();
    $.on(node, "click", function (e) {
      e.preventDefault();
      sandbox.opt("loop", !running() ? "start" : "stop");
      syncButton();
    });
  }

  return {
    init: function () {
      sandbox.template.add(".sliderjs div.left", template, onTemplated, 7);
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

