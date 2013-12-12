$(document).ready(function () {
  fixture = $('#qunit-fixture'), i = 0;
window.SLIDES = [
  { "image" : "images/bbb-splash.png", "legend": "Big Buck Bunny - splash", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/bird1.jpg", "legend": "Big Buck Bunny - bird", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/evil-frank.png", "legend": "Big Buck Bunny - evil frank", "link": "http://bigbuckbunny.org/" },
  { "image" : "images/s1_proog.jpg", "legend": "Elephant Dreams - proog", "link": "http://orange.blender.org/" },
  { "image" : "images/s6_both.jpg", "legend": "Elephant Dreams - proog & emo", "link": "http://orange.blender.org/" },
  { "image" : "images/s8_emocu.jpg", "legend": "Elephant Dreams - emo", "link": "http://orange.blender.org/" }
];
window.newContainer = function () { return fixture.append('<div id="slider_'+(++i)+'"></div>'); }
window.newSlider = (sliderjs.util.version == 'native') ?
  function (o) { return sliderjs.Slider(newContainer()[0], o) } :
  function (o) { return $(newContainer()).sliderjs(o) };

});
