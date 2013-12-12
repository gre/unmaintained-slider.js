sliderjs.canvasTransitions("horizontalSunblind", {
  easing: 'easeOutCubic',
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blind, blindHeight, blinds;
    blinds = params.split || 6;
    blindHeight = h / blinds;
    for (blind = 0; blind <= blinds; blind++)
      ctx.rect(0, blindHeight * blind, w, blindHeight * p);
  }
});

