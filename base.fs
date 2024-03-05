precision highp float;
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
void main(void) {
  /*float a = fract(vTextureCoord.x + vTextureCoord.y);
  float b =  vTextureCoord.x / a;*/  
  if(vTextureCoord.x < 0.5) {
    gl_FragColor = texture2D(uSampler0, vTextureCoord);
  } else {
    gl_FragColor = texture2D(uSampler1, vTextureCoord);
  }
}