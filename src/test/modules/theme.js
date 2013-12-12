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
