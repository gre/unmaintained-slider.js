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


