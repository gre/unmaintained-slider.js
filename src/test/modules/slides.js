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

