/**~~~duration~~~ handle the transition duration - the animation between 2 slides.
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("duration", function(sandbox, $) {
  return {
    def: 1000,
    accept: $.parseTime
  }
});
