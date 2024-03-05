attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying highp vec2 vTextureCoord;
void main(void) {
  vTextureCoord = aTextureCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 0., 1.);
}