sliderjs.canvasTransitions("squares", {
  easing: 'easeOutCubic',
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var blindHeight, blindWidth, blindsX, blindsY, prog, rh, rw, sx, sy, x, y;
    blindsX = params.split || 8;
    blindsY = Math.floor(blindsX * h / w);
    blindWidth = w / blindsX;
    blindHeight = h / blindsY;
    for (x = 0; x <= blindsX; x++) {
      for (y = 0; y <= blindsY; y++) {
        sx = blindWidth * x;
        sy = blindHeight * y;
        prog = Math.max(0, Math.min(3 * p - sx / w - sy / h, 1));
        rw = blindWidth * prog;
        rh = blindHeight * prog;
        ctx.rect(sx - rw / 2, sy - rh / 2, rw, rh);
      }
    }
  }
});

