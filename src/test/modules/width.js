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
