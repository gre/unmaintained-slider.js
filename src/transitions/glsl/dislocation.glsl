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
uniform float displacement;

void main() {
  float disp = displacement>0.0 ? displacement : 0.2;
  float p = progress;
  float pTo = p;
  float pFrom = 1.-p;
  float d = disp*progress;
  gl_FragColor = texture2D(to, texCoord)*pTo;
  if (pFrom > 0.99) {
    gl_FragColor += pFrom*texture2D(from, texCoord);
  }
  else {
    gl_FragColor += pFrom*0.2*texture2D(from, texCoord);
    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(d, d));
    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(-d, d));
    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(-d, -d));
    gl_FragColor += pFrom*0.2*texture2D(from, texCoord+vec2(d, -d));
  }
}

