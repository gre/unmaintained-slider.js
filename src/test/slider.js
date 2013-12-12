module("SliderJS Core");

test("instanciation works", function () {
  var slider = newSlider();
  ok(slider instanceof sliderjs.Slider, "first instanciation");
  slider = newSlider();
  ok(slider instanceof sliderjs.Slider, "second instanciation");
})

test("modules are loosely coupled", function () {
  var slider = newSlider({ modules: ["template", "height"] });
  ok(!slider.width, "width is not loaded if not mentionned in modules.");
  var slider = newSlider({ modules: "template, height" });
  ok(!slider.width, "width is not loaded if not mentionned in modules.");
  slider = newSlider({ exceptModules: "width" });
  ok(!slider.width, "width is not loaded with exceptModules.");
  $.each(sliderjs.modules(), function (i, module) {
    var slider = newSlider({ modules: module });
    ok(slider instanceof sliderjs.Slider, "Slider works with only "+module);
  }); 
  $.each(sliderjs.modules(), function (i, module) {
    var slider = newSlider({ exceptModules: module });
    ok(slider instanceof sliderjs.Slider, "Slider works without "+module);
  });
})


test("modules start / stop", function () {
  var slider = newSlider({ modules: [] });
  $.each(sliderjs.modules(), function (i, module) {
    slider.modules.start(module);
  });
  ok(slider.modules().length > 0, "more than 0 modules are loaded");
  $.each(sliderjs.modules(), function (i, module) {
    slider.modules.stop(module);
  });
  ok(slider.modules().length == 0, "0 modules are loaded");
});



test("Basic modules API", function () {
  var slider = newSlider();
  $.each(sliderjs.modules(), function (i, module) {
    var singleton = newSlider({ modules: module });
    slider[module](slider[module]());
    singleton.opt(module, undefined);
    singleton.opt(module, singleton.opt(module));
  });
});

test("events are working", function () {
  expect(13);
  var slider = newSlider();
  var cb1 = function(o) { ok(o > 0, "cb1, event "+o) }
  var cb2 = function(o) { ok(o > 0, "cb2, event "+o);
  }
  slider.
    on("testevent", cb1).
      trigger("testevent", 1).
      trigger("testevent", 2).
      on("testevent", cb2).
        trigger("testevent", 3).
        trigger("testevent", 4).
        trigger("testevent", 5).
        trigger("testevent", 6).
        trigger("testevent", 7).
      off("testevent", cb1).
      trigger("testevent", 8).
      off("testevent", cb1).
      off("testevent", cb1).
    off("testevent", cb2).
    trigger("testevent", 9);
})

/*
 * TODO test the module.register, etc..
 *
test("sliderjs.feature", 20, function () {
  var feature = "testFirst";
  var value = "defaultValue";
  var _init = function() {
    ok(this instanceof sliderjs.Slider, "init: this is instance of Slider");
  }
  var _update = function() {
    ok(this instanceof sliderjs.Slider, "update: this is instance of Slider");
  }
  sliderjs.feature(feature, {
    touchOnLoad: true,
    def: "defaultValue",
    init: function() {
      _init && _init.apply(this, arguments);
    },
    update: function(o) {
      _update && _update.apply(this, arguments);
    },
    answer: 42,
    something: true
  });

  var slider = newSlider();
  equals(slider.opt(feature), value, "feature default set");

  slider.opt(feature, value = "foo");
  equals(slider.opt(feature), value, "opt works");

  slider[feature](value = "bar");
  equals(slider[feature](), value, "direct function feature() works");
  
  ok(slider[feature+'_answer'] == 42 && slider[feature+'_something'], "private objects are accessible");

  slider[feature+'_something'] = false;
  var slider2 = newSlider();
  ok(slider2[feature+'_something'] && !slider[feature+'_something'], "private objects are instancied and not globals.");

  var o = {};
  o[feature] = "hello";
  slider = newSlider(o);
  equals(slider[feature](), "hello", "Setting an option in the constructor");

  slider.touchopt(feature).touchopt(feature);
  slider.touchopt(feature);
  slider.touchopt(feature);
  slider.touchopt(feature);
  slider.touchopt(feature);

  _update = null;
  _init = null;
})
*/

test("Easing Functions seems correct", function() {
  for(var k in sliderjs.Easing) {
    var f = sliderjs.Easing[k];
    ok(0==f(0), k+"(0) = 0");
    ok(0<=f(0.5) && f(0.5)<=1, k+"(0.5) in [0, 1]");
    ok(1==f(1), k+"(1) = 1");
  }
});
