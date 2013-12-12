/*~~~ slide~~~ handle the current slide number
 * 
 * GET: get an integer of the current slide from 0 to N (where N+1 is the number of slides)
 * SET: 
 * - an integer: the slide index to move to
 * - "next": move to the next slide (in a circular way)
 * - "prev": move to the previous slide (in a circular way)
 * 
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("slide", function (sandbox, $) {
  function circular(num, max) { return num-max*Math.floor(num/max) }

  function onSlidesChanged (o) {
    sandbox.value(0);
  }

  return {
    def: 0,
    init: function () {
      sandbox.on("slidesChanged", onSlidesChanged);
    },
    destroy: function () {
      sandbox.off("slidesChanged", onSlidesChanged);
    },
    accept: function (value, old) {
      switch (typeof(value)) {
        case "number": return value;
        case "string":
          var slides = sandbox.opt("slides");
          if (slides && slides.length) {
            if (value=="next") return circular(old+1, slides.length);
            if (value=="prev") return circular(old-1, slides.length);
          }
      }
      return 0;
    }
  }
});

