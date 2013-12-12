sliderjs.canvasTransitions("circle", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    ctx.arc(w/2, h/2, 0.6*p*Math.max(w, h), 0, Math.PI*2, false);
  }
});


