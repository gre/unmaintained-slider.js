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
