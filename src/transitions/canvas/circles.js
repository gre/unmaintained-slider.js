sliderjs.canvasTransitions("circles", {
  params: { split: 10 },
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var circleH, circleW, circlesX, circlesY, cx, cy, maxRad, maxWH, r, x, y;
    circlesX = params.split;
    circlesY = Math.floor(circlesX * h / w);
    circleW = w / circlesX;
    circleH = h / circlesY;
    maxWH = Math.max(w, h);
    maxRad = 0.7 * Math.max(circleW, circleH);
    for (x = 0; x <= circlesX; x++) {
      for (y = 0; y <= circlesY; y++) {
        cx = (x + 0.5) * circleW;
        cy = (y + 0.5) * circleH;
        r = Math.max(0, Math.min(2 * p - cx / w, 1)) * maxRad;
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
      }
    }
  }
});


