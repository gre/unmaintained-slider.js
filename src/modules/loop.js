/*~~~loop~~~ start / stop the auto slide mode with a specific duration
 *
 * GET: the millisecond time for the current loop (0 is the loop is stopped)
 * SET:
 *  - an integer: set the duration  between each slides (in ms) and start the loop
 *  - "start": start the loop with the latest set duration (or the default)
 *  - "stop": stop the loop if running
 *
 * <renaudeau.gaetan@gmail.com> - 2012
 */
sliderjs.modules("loop", function (sandbox, $) {
  var defaultValue = 5000, lastHumanNav = 0, timeout;

  function onPagesClicked () {
    lastHumanNav = $.now();
  }

  function loop () {
    if($.now()-lastHumanNav > 2000) sandbox.opt("slide", "next");
    iterateLoop();
  }

  function iterateLoop () {
    timeout = setTimeout(loop, sandbox.value());
  }

  function stop () {
    timeout && clearTimeout(timeout);
    timeout = null;
  }
  
  function start () {
    lastHumanNav = 0;
    stop();
    iterateLoop();
  }

  return {
    def: "start",
    init: function () {
      sandbox.on("pagesClicked", onPagesClicked);
      this.change(sandbox.value());
    },
    destroy: function () {
      stop();
      sandbox.off("pagesClicked", onPagesClicked);
    },
    accept: function (value, old) {
      if(value == "start") return defaultValue;
      if(value == "stop") return 0;
      value = $.parseTime(value);
      if (!isNaN(value) && value > 0)
        return defaultValue = value;
      return 0;
    },
    change: function (value, old) {
      if(value) start();
      else stop();
    }
  }
});

