sliderjs.canvasTransitions("verticalSunblind", {
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blind, blindWidth, blinds, prog;
    blinds = params.split || 10;
    blindWidth = w / blinds;
    for (blind = 0; blind <= blinds; blind++) {
      prog = Math.max(0, Math.min(2 * p - (blind + 1) / blinds, 1));
      ctx.rect(blindWidth * blind, 0, blindWidth * prog, h);
    }
  }
});

