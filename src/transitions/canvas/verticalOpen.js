sliderjs.canvasTransitions("verticalOpen", {
  clippedTransition: function (o, ctx, params) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    var h1, h2, hi, nbSpike, pw, spikeh, spikel, spiker, spikew, xl, xr;
    nbSpike = params.split || 8;
    spikeh = h / (2 * nbSpike);
    spikew = spikeh;
    pw = o.progress * w / 2;
    xl = w / 2 - pw;
    xr = w / 2 + pw;
    spikel = xl - spikew;
    spiker = xr + spikew;
    ctx.moveTo(xl, 0);
    for (hi = 0; hi <= nbSpike; hi++) {
      h1 = (2 * hi) * spikeh;
      h2 = h1 + spikeh;
      ctx.lineTo(spikel, h1);
      ctx.lineTo(xl, h2);
    }
    ctx.lineTo(spiker, h);
    for (hi = nbSpike; hi >= 0; hi--) {
      h1 = (2 * hi) * spikeh;
      h2 = h1 - spikeh;
      ctx.lineTo(xr, h1);
      ctx.lineTo(spiker, h2);
    }
  }
});

