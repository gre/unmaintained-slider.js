#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
varying vec2 texCoord;
uniform vec2 resolution;

void main() {
  gl_FragColor = progress*texture2D(to,texCoord) + (1.0-progress)*texture2D(from,texCoord);
}

