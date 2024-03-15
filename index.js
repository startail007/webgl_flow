import Geometry from "./Geometry.js";
import Texture from "./Texture.js";
import Shader from "./Shader.js";
import Mesh from "./Mesh.js";
import { require } from "./fun.js";

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
  geometry.addIndex([0, 1, 2, 0, 2, 3]);*/
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

  mat4.ortho(projectionMatrix.data, 0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);
  //mat4.translate(projectionMatrix.data, projectionMatrix.data, [0.0, 0.0, -1.0]);

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
