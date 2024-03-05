const require = (src) => {
  return fetch(src).then((response) => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.text();
  });
};

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
class Texture {
  static from(gl, src) {
    return new Promise((res, rej) => {
      const image = new Image();
      image.onload = () => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
        res(texture);
      };
      image.src = src;
    });
  }
}
class Geometry {
  static Box(gl, w, h) {
    const geometry = new Geometry(gl);
    geometry.addAttribute("aVertexPosition", [-w * 0.5, h * 0.5, w * 0.5, h * 0.5, w * 0.5, -h * 0.5, -w * 0.5, -h * 0.5], 2);
    geometry.addAttribute("aTextureCoord", [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0], 2);
    geometry.addIndex([0, 1, 3, 1, 2, 3]);
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
class Shader {
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

class Mesh {
  constructor(gl, geometry, shader) {
    this.gl = gl;
    this.geometry = geometry;
    this.shader = shader;
    this.modelViewMatrix = { type: "matrix", data: mat4.create() };
    this._pos = [0, 0];
    this._rotation = 0;
    this._size = [100, 100];
    this.lockUpdate = false;
    this.updateModelViewMatrix();
  }
  set pos(val) {
    this._pos = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get pos() {
    return this._pos;
  }
  set rotation(val) {
    this._rotation = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get rotation() {
    return this._rotation;
  }
  set size(val) {
    this._size = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get size() {
    return this._size;
  }
  updateModelViewMatrix() {
    mat4.identity(this.modelViewMatrix.data);
    mat4.translate(this.modelViewMatrix.data, this.modelViewMatrix.data, [...this._pos, 0.0]);
    mat4.rotateZ(this.modelViewMatrix.data, this.modelViewMatrix.data, this._rotation * (Math.PI / 180));
    mat4.scale(this.modelViewMatrix.data, this.modelViewMatrix.data, [...this._size, 0.0]);
  }
  use(uniforms) {
    const gl = this.gl;
    gl.useProgram(this.shader.program);
    this.geometry.use(this.shader.program);
    this.shader.use({ uModelViewMatrix: this.modelViewMatrix, ...uniforms });
  }
  draw() {
    const gl = this.gl;
    gl.drawElements(gl.TRIANGLE_STRIP, this.geometry.indexLength, gl.UNSIGNED_SHORT, 0);
  }
}
function computeIntersectionPoint(x1, y1, x1_0, y1_0, x2, y2, x2_0, y2_0) {
  const m1 = (y1_0 - y1) / (x1_0 - x1);
  const m2 = (y2_0 - y2) / (x2_0 - x2);
  if (m1 === m2) {
    return "Parallel lines, no intersection.";
  }
  let x = (m1 * x1 - m2 * x2 + y2 - y1) / (m1 - m2);
  let y = m1 * (x - x1) + y1;
  return { x: x, y: y };
}
const main = async () => {
  const canvas = document.querySelector("#glcanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("無法初始化WebGL。您的瀏覽器或機器可能不支持它。");
    return;
  }
  /*const geometry = new Geometry(gl);
  geometry.addAttribute("aVertexPosition", [-0.5, 1.0, 0.5, 1.0, 1.0, -1.0, -1.0, -1.0], 2);
  geometry.addAttribute("aTextureCoord", [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0], 2);
  geometry.addAttribute("aW", [1.0, 0.0, 0.0, 1.0], 1);
  geometry.addIndex([0, 1, 3, 1, 2, 3]);*/
  const geometry = Geometry.Box(gl, 1, 1);

  const texture0 = await Texture.from(gl, "./image.jpg");
  const texture1 = await Texture.from(gl, "./image.jpg");

  const baseVS = await require("./base.vs");
  const baseFS = await require("./base.fs");

  const shader = Shader.from(gl, baseVS, baseFS, {
    uSampler0: { type: "texture", data: texture0 },
    uSampler1: { type: "texture", data: texture1 },
  });
  const projectionMatrix = { type: "matrix", data: mat4.create() };

  mat4.ortho(projectionMatrix.data, 0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, 0.1, 100);
  mat4.translate(projectionMatrix.data, projectionMatrix.data, [0.0, 0.0, -1.0]);

  const mesh = new Mesh(gl, geometry, shader);
  mesh.pos = [400, 300];
  setInterval(() => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    mesh.rotation += 0.5;
    mesh.use({ uProjectionMatrix: projectionMatrix });
    mesh.draw();
  }, 1000 / 60);
};

main();
