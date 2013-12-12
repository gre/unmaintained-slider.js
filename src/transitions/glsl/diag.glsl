#ifdef GL_ES
precision highp float;
#endif

// General parameters
uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
varying vec2 texCoord;
uniform vec2 resolution;

// Custom parameters
uniform float size;

void main() {
  float effectsize = (size > 0.0) ? size : 0.2;
  float pTo = 2.*(progress+effectsize*(2.*progress-1.));
  float pos = texCoord.x+texCoord.y;
  pTo = smoothstep(pos-effectsize, pos+effectsize, pTo);
  float pFrom = 1.0 - pTo;
  gl_FragColor = pTo*texture2D(to,texCoord) + pFrom*texture2D(from,texCoord);
}

