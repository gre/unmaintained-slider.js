sliderjs.canvasTransitions("clock", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.moveTo(w/2, h/2);
    ctx.arc(w/2, h/2, Math.max(w, h), 0, Math.PI*2*o.progress, false);
  }
});


