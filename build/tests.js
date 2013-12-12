$(document).ready(function () {
  fixture = $('#qunit-fixture'), i = 0;
window.SLIDES = [
  { "image" : "images/bbb-splash.png", "legend": "Big Buck Bunny - splash", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/bird1.jpg", "legend": "Big Buck Bunny - bird", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/evil-frank.png", "legend": "Big Buck Bunny - evil frank", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/s1_proog.jpg", "legend": "Elephant Dreams - proog", "link": "http://orange.blender.org/" },
  { "image" : "images/s6_both.jpg", "legend": "Elephant Dreams - proog & emo", "link": "http://orange.blender.org/" },
  { "image" : "images/s8_emocu.jpg", "legend": "Elephant Dreams - emo", "link": "http://orange.blender.org/" }
];
window.newContainer = function () { return fixture.append('<div id="slider_'+(++i)+'"></div>'); }
window.newSlider = (sliderjs.util.version == 'native') ?
  function (o) { return sliderjs.Slider(newContainer()[0], o) } :
  function (o) { return $(newContainer()).sliderjs(o) };

});

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



module("height feature");

function getHeight(slider) {
  return $(slider.template()).find(".slides").first().height();
}

test("Basic usage", function () {
  var slider = newSlider();
  ok(slider.height()>0, "height init");

  slider = newSlider({
    height: 500 
  });
  equals(slider.height(), 500, "height is set");
  equals(getHeight(slider), 500, "DOM height is correct");

  slider.height(987);
  equals(getHeight(slider), 987, "DOM height is correct after change");
});

test("Updated when template change", 2, function () {
  var slider = newSlider({ height: 1234 });
  equals(getHeight(slider), 1234, "DOM height set");
  slider.on("templated", function () {
    equals(getHeight(slider), 1234, "DOM height properly updated after templated");
  });
  slider.T.compile();
});


module("loop feature");

asyncTest("loop works", function () {
  var slider = newSlider({
    slides: SLIDES,
    slide: 0,
    loop: 500
  });
  slider.loop("start");
  slider.loop("stop");
  slider.loop(3); // loop is stop, slide should not change
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop(500);
  slider.loop("start");
  slider.loop("stop");
  slider.opt('loop', 2);
  slider.loop(500);
  slider.loop("stop");
  slider.loop("start");
  slider.loop("start");
  slider.loop("stop");
  slider.loop("start");
  slider.loop("start");
  slider.loop("stop");
  slider.loop("stop");
  slider.loop("start");
  slider.loop("stop");
  slider.loop("start");
  slider.loop("stop");
  slider.loop("start");
  slider.loop("stop");
  slider.loop("start");
  slider.loop("start");
  slider.loop("start");
  setTimeout(function(){
    equals(slider.slide(), 3, "Slider slide is 3 after 3.8s of (loop: 1000).");
    start();
  }, 1900);
});

asyncTest("stop works", function () {
  var slider = newSlider({
    slides: SLIDES,
    slide: 0,
    loop: 300,
    loop: null
  });
  slider.loop("start");
  slider.loop("start");
  slider.loop("start");
  slider.loop("stop");
  setTimeout(function(){
    equals(slider.slide(), 0, "Slider is still on slide 0.");
    start();
  }, 950);
});

asyncTest("setting the loop don't start the slider.", function () {
  var slider = newSlider({
    slides: SLIDES,
    slide: 0,
    loop: 3000,
    loop: null
  });
  setTimeout(function(){
    slider.loop(500);
    equals(slider.slide(), 0, "Slider is still on the slide 0.");
    start();
  }, 1500);
});




module("slides feature");

test("Basic usage", function () {
  var slider = newSlider();
  equals(slider.slides().length, 0, "not yet slides");
  slider = newSlider({ slides: SLIDES });
  equals(slider.slides().length, SLIDES.length, "right number");
  slider.slides(SLIDES).slides(SLIDES);
  slider.slides(SLIDES);
  slider.slides(SLIDES);
  equals(slider.slides().length, SLIDES.length, "right number");
});

asyncTest("events", function () {
  var slider = newSlider();
  var success = 0;
  var currentSlideLoaded = 0;
  var firstSlideLoaded = 0;
  var id;
  slider.
  on("imagesLoaded", function(o) {
    var s = o.state;
    equals(s.total, s.success, "all successful loaded");
    equals(s.total, s.sum, "total is sum");
    equals(s.error, 0, "no error");
    equals(s.abort, 0, "no abort");
    start();
  }).
  on("imagesLoading", function(o) {
    if (id===undefined) id = o.id;
    if (id != o.id) return;
    var s = o.state;
    equals(s.success, s.sum, "success is sum");
    equals(s.error, 0, "no error");
    equals(s.abort, 0, "no abort");
  }).
  on("currentSlideLoaded", function(o) {
    var s = o.state;
    equals(++currentSlideLoaded, 1, "currentSlideLoaded occurs once");
  }).
  on("firstSlideLoaded", function(o) {
    var s = o.state;
    equals(++firstSlideLoaded, 1, "firstSlideLoaded occurs once");
  });
  slider.slides(SLIDES);
});

asyncTest("avoid old images loading", function() {
  var slider = newSlider({ slides: SLIDES });
  var count = 0;
  slider.on("imagesLoading", function() {
    ++ count;
  });
  for(var i=0; i<=11; ++i)
    slider.slides(SLIDES);
  setTimeout(function() {
    ok(count < SLIDES.length*11, "some events has been escaped because slides was updated.");
    start();
  }, 1000);
});



module("theme feature");

test("Basic usage", function () {
  var slider = newSlider();
  ok(slider.theme(), "There is a default theme");
  slider.theme("foo");
  equals(slider.theme()+'', "foo", "Theme is set");
  ok($(slider.template()).hasClass("th-foo"), "has class foo");
  slider.theme("bar");
  equals(slider.theme()+'', "bar", "Theme is set");
  ok(!$(slider.template()).hasClass("th-foo"), "has not class foo anymore");
  ok($(slider.template()).hasClass("th-bar"), "has class bar");
  slider.theme("foo bar");
  ok($(slider.template()).hasClass("th-foo"), "has class foo");
  ok($(slider.template()).hasClass("th-bar"), "has class bar");
  slider.theme("foo,bar");
  ok($(slider.template()).hasClass("th-foo"), "has class foo");
  ok($(slider.template()).hasClass("th-bar"), "has class bar");
  /*
  slider.theme(["a", "b", "c"]);
  ok($(slider.template()).hasClass("th-a"), "has class a");
  ok($(slider.template()).hasClass("th-b"), "has class b");
  ok($(slider.template()).hasClass("th-c"), "has class c");
  ok(!$(slider.template()).hasClass("th-bar"), "has not class bar");
  */
  slider.theme([]);
  ok(!$(slider.template()).hasClass("th-a"), "has not class a");
  slider.theme('foo');
  var onThemeChanged = function(o) {
    equals(o.value+'', "a", "new value is a");
    equals(o.old+'', "foo", "old value is foo");
    slider.off("themeChanged", onThemeChanged);
  }
  slider.on("themeChanged", onThemeChanged);
  slider.theme('a');
  slider.theme('');
  ok(!$(slider.template()).hasClass("th-a"), "has not class a");
});

test("Updated when template change", 4, function () {
  var slider = newSlider({ theme: "foo bar" });
  ok($(slider.template()).hasClass("th-foo"), "has class foo");
  ok($(slider.template()).hasClass("th-bar"), "has class bar");
  slider.on("templated", function () {
    ok($(slider.template()).hasClass("th-foo"), "has class foo");
    ok($(slider.template()).hasClass("th-bar"), "has class bar");
  });
  slider.T.compile();
});


module("width feature");

function getWidth(slider) {
  return $(slider.template()).width();
}

test("Basic usage", function () {
  var slider = newSlider();
  ok(slider.width()>0, "width init");

  slider = newSlider({
    width: 500 
  });
  equals(slider.width(), 500, "width is set");
  equals(getWidth(slider), 500, "DOM width is correct");

  slider.width(987);
  equals(getWidth(slider), 987, "DOM width is correct after change");
});

test("Updated when template change", 2, function () {
  var slider = newSlider({ width: 1234 });
  equals(getWidth(slider), 1234, "DOM width set");
  slider.on("templated", function () {
    equals(getWidth(slider), 1234, "DOM width properly updated after templated");
  });
  slider.T.compile();
});
