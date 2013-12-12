sliderjs.canvasTransitions("horizontalOpen", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    ctx.rect(0, (1 - p) * h / 2, w, h * p);
  }
});

