(function (ns) {

/**
 * slider.Slider(nodeContainer, { ... })
 */
ns.Slider = function (container, options) {
  return new Slider(container, options);
}

/**
 * Slider Constructor
 */
var Slider = function (container, options) {
  var self = this, 
      $ = ns.util,
      T, // selector templating
      E, // pub/sub event system
      modules = {}; // store modules

  if(!container) throw "container node required in first argument";
  if(!options) options = {};

  // Init events
  E = $.makeEvent({});
  self.trigger = function (event, data) {
    E.pub(event, data); return self;
  }
  self.on = function (event, callback) {
    E.sub(event, callback); return self;
  }
  self.off = function (event, callback) {
    E.del(event, callback); return self;
  }
  self.once = function (event, callback) {
    var removeCallback = function () {
      self.off(event, removeCallback).off(event, callback);
    }
    return self.on(event, callback).on(event, removeCallback);
  }

  // Init templating
  self.T = T = new SelectorTemplating(container, function () {
    self.trigger("templated", container);
  });

  // opt method
  self.opt = function (optname, newValue) {
    var value = options[optname];
    if(arguments.length==1) return value;
    if (modules[optname])
      newValue = modules[optname].m.accept(newValue, value);
    options[optname] = newValue;

    var message = { key: optname, old: value, value: newValue };
    self.trigger(optname+"Changed", message);
    return self;
  }

  // Get a module
  self.module = function (name) {
    var module = modules[name];
    return module && module.m;
  }

  // Init modules 
  self.modules = (function () {
    var list = function (name) {
      var t = [];
      for (var name in modules)
        t.push(name);
      return t;
    }
    list.start = function (names) {
      $.each($.getList(names), function (name) {
        var moduleFunction = ns.modules(name), onChanged, module;
        if (!moduleFunction) throw "module "+name+" not found.";
        modules[name] && this.stop(name);

        // Create module
        module = $.extend({ //extend the module with module defaults
          init: $.nop,
          change: $.nop,
          destroy: $.nop,
          accept: function (value) { return value },
          fn: function (val) {
            var args = [name]; 
            arguments.length && args.push(val);
            return self.opt.apply(self, args);
          }
        }, moduleFunction(new ns.Sandbox(self, name), $));

        // Create module function
        self[name] = module.fn;
        
        // Set default
        options[name] = module.accept(name in options ? options[name] : module.def);
        
        // Bind change
        self.on(name+"Changed", onChanged = function (o) { module.change(o.value, o.old) });

        // Init module
        module.init();
        modules[name] = { m: module, c: onChanged };
        self.trigger(name+"Started");
      });
      T.compile();
      return self;
    }
    list.stop = function (names) {
      $.each($.getList(names), function (name) {
        var data = modules[name];
        if (data) {
          data.m.destroy();
          self.off(name+"Changed", data.c);
          delete options[name];
          delete self[name];
          delete modules[name];
          self.trigger(name+"Stopped");
        }
      });
      T.compile();
      return self;
    }
    return list;
  }());

  // start all modules
  var modulesList = ns.modules();
  var all = options.modules ? $.getList(options.modules) : modulesList;
  for (var o in options) { // add all options given in arguments
    if ($.indexOf(all, o) <= 0 && $.indexOf(modulesList, o) >= 0)
      all.push(o);
  }
  all = $.dif(all, $.getList(options.exceptModules));
  self.modules.start(all);
}

/**
 * Static module creation
 * a sliderjs module define the behaviour of an option.
 * the name of a module MUST be the same as the related option name.
 */
ns.modules = sliderjs.util.createRegistrable();

/**
 * The sandbox given to the module.
 * This is the interface between a module and a slider instance.
 */
ns.Sandbox = function (slider, modulename) {
  var self = this;
  self.template = slider.T;
  // some proxified methods
  self.on = function () { slider.on.apply(slider, arguments); return self }
  self.once = function () { slider.once.apply(slider, arguments); return self }
  self.off = function () { slider.off.apply(slider, arguments); return self }
  self.trigger = function () { slider.trigger.apply(slider, arguments); return self }
  self.opt = function (key, value) {
    if(arguments.length==1) return slider.opt(key);
    slider.opt(key, value); return self;
  }
  // .value([v]) is a shortcut to .opt(modulename, [v])
  self.value = function (value) { 
    var args = [ modulename ]; arguments.length && args.push(value);
    return self.opt.apply(self, args);
  }
  // Request a module function
  self.ask = function (modulename, funname) {
    var module = slider.module(modulename);
    if(module) return module[funname];
  }
}

}(window.sliderjs));

