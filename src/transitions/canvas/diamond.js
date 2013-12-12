sliderjs.canvasTransitions("diamond", {
  clippedTransition: function (o, ctx) {
    var w = ctx.canvas.width, h = ctx.canvas.height, p = o.progress;
    var w2 = w/2;
    var h2 = h/2;
    var dh = p*h;
    var dw = p*w;
    ctx.moveTo(w2,    h2-dh);
    ctx.lineTo(w2+dw, h2);
    ctx.lineTo(w2,    h2+dh);
    ctx.lineTo(w2-dw, h2);
  }
});

