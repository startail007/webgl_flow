export default class Geometry {
  static Box(gl, w, h) {
    const geometry = new Geometry(gl);
    geometry.addAttribute("aVertexPosition", [-w * 0.5, -h * 0.5, w * 0.5, -h * 0.5, w * 0.5, h * 0.5, -w * 0.5, h * 0.5], 2);
    geometry.addAttribute("aTextureCoord", [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0], 2);
    geometry.addIndex([0, 1, 2, 0, 2, 3]);
    return geometry;
  }
  constructor(gl) {
    this.gl = gl;
    this.attributes = [];
    this.indexLength = 0;
    this.program = null;
  }
  addAttribute(name, data, size) {
    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    this.attributes.push({ name, positionBuffer, size });
    return this;
  }
  addIndex(data) {
    const gl = this.gl;
    this.indexLength = data.length;
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    return this;
  }
  use(program) {
    const gl = this.gl;
    this.attributes.forEach((el) => {
      const loc = gl.getAttribLocation(program, el.name);
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, el.positionBuffer);
      gl.vertexAttribPointer(loc, el.size, gl.FLOAT, false, 0, 0);
    });
    return this;
  }
}
