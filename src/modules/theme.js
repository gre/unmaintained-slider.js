/*~~~theme~~~ Define the current themes for the display (color / layout).
 * 
 * GET: an array of themes
 * SET: a list of themes to set. Each theme is defined in the themes/{name}.* file. It is linked to the ("th-"+name) CSS class.
 * - an array of themes or a string with themes splits by commas or spaces.
 * - an object with a "add" | "remove" | "only" arrays/strings to add some themes | remove some themes | replace themes (like passing a direct array)
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("theme", function (sandbox, $) {
  var node;
  var prefix = "th-", 
      defaultValue = $.getList("black black-icon black-caption black-blue-controls shadow hide-header-hover embed dots pages-border pages-bottom pages-shadow");

  function syncTheme(value, old) {
    if (!node) return;
    old && $.each(old, function (t) {
      $.removeClass(node, prefix+t);
    });
    $.each(value, function (t) {
      $.addClass(node, prefix+t);
    });
  }

  function onTemplated (container) {
    node = $.find(container, ".sliderjs")[0];
    syncTheme(sandbox.value());
  }

  return {
    def: defaultValue,
    init: function () {
      sandbox.on("templated", onTemplated);
    },
    destroy: function () {
      sandbox.off("templated", onTemplated);
    },
    accept: function (value, old) {
      if (typeof(value) == "object" && !(value instanceof Array)) {
        var toReplace = value.only!==undefined ? $.getList(value.only) : (old||defaultValue),
            toAdd = $.getList(value.add),
            toRemove = $.getList(value.remove);
        return $.dif(toReplace.concat(toAdd), toRemove);
      }
      else {
        return $.getList(value); 
      }
    },
    change: function (value, old) {
      syncTheme(value, old);
    }
  }
});

sliderjs.themes = sliderjs.util.createRegistrable();
