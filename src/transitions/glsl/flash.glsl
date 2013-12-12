//!{ params: { insolation: 4.0 }, easing: 'easeOutCubic' }
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
varying vec2 texCoord;
uniform vec2 resolution;

// Custom parameters
uniform float insolation;

void main() {
  gl_FragColor = progress*texture2D(to, texCoord) + (1.-progress)*texture2D(from, texCoord);
  gl_FragColor *= (1.+insolation*max(0., .5-abs(progress-.5)));
}

