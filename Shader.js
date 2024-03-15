const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};
const initShaderProgram = (gl, vsSource, fsSource) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
};
export default class Shader {
  constructor(gl, program, uniforms) {
    this.gl = gl;
    this.program = program;
    this.uniforms = uniforms;
  }
  static from(gl, vertexSrc, fragmentSrc, uniforms) {
    return new Shader(gl, initShaderProgram(gl, vertexSrc, fragmentSrc), uniforms);
  }
  use(uniforms) {
    const gl = this.gl;
    let index = 0;
    const _uniforms = { ...this.uniforms, ...uniforms };
    for (let key in _uniforms) {
      const uniform = _uniforms[key];
      const loc = gl.getUniformLocation(this.program, key);
      if (uniform.type == "matrix") {
        gl.uniformMatrix4fv(loc, false, uniform.data);
      } else if (uniform.type == "texture") {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, uniform.data);
        gl.uniform1i(loc, index);
        index++;
      }
    }
    return this;
  }
}
