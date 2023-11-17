import {
  ArcRotateCamera,
  Color4,
  Effect,
  EffectRenderer,
  EffectWrapper,
  PointsCloudSystem,
  PostProcess,
  RenderTargetTexture,
  Scene,
  SceneLoader,
  Vector3,
  VertexData,
} from "@babylonjs/core";
// eslint-disable-next-line import/no-webpack-loader-syntax
import trailsShader from "!!raw-loader!./Shaders/trail.frag";
import { extractNumbersFromString } from "./utils";

const config_pviz = require("../Config.json");
const config_webapp = config_pviz.webapp;

/**
 * Represents a 3D Earth model with stars and particles.
 * @class
 */
class Earth {
  /**
   * The Babylon.js scene.
   * @type {Scene}
   */
  scene;

  #engine;

  /**
   * The mesh representing the Earth.
   * @type {Mesh | undefined}
   */
  #EarthMesh;

  /**
   * The camera used for rendering the scene.
   * @type {ArcRotateCamera}
   */
  camera;

  /**
   * The points cloud system for stars.
   * @type {PointsCloudSystem}
   */
  #stars;

  /**
   * The color of stars.
   * @type {Color4}
   */
  #starColor;
  #postProcess;

  /**
   * The points cloud system for particles.
   * @type {PointsCloudSystem}
   */
  particles;

  /**
   * The color of particles.
   * @type {Color4}
   */
  particleColor;

  /**
   * Creates an instance of the Earth class.
   * @constructor
   * @param {Engine} engine - The Babylon.js engine.
   * @param {HTMLElement} canvas - The HTML canvas element.
   */
  constructor(engine, canvas) {
    this.#engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0, 0, 0, 1);

    this.camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      this.scene
    );

    // console.log(trailsShader);

    Effect.ShadersStore["trailsFragmentShader"] = trailsShader;
    // this.#postProcess = new PostProcess(
    //   "Trails",
    //   "trails",
    //   ["screenSize", "threshold", "frame"],
    //   null,
    //   1,
    //   this.camera
    // );
    // this.#postProcess.onApply = function (effect) {
    //   effect.setFloat2(
    //     "screenSize",
    //     this.#postProcess.width,
    //     this.#postProcess.height
    //   );
    // }.bind(this);

    // this.#postProcess.inputTexture = new PassPostProcess("Trails", 1.0, this.camera);

    // let postProcess0 =

    // postProcess0.

    this.#starColor = new Color4(1, 1, 1, 1);

    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 24;
    this.camera.wheelPrecision =
      (this.camera.upperRadiusLimit - this.camera.lowerRadiusLimit) * 2;
    this.camera.attachControl(canvas, true);

    this.camera.maxZ = 1001;

    this.#stars = new PointsCloudSystem("stars", 1, this.scene, {
      updatable: false,
    });

    this.#stars.addPoints(1000, this.starMaker.bind(this));

    this.particles = new PointsCloudSystem("particles", 3, this.scene, {
      updatable: true,
    });
    const Color_RGBA = extractNumbersFromString(config_webapp["particles_color"]); 
    // this.particleColor = new Color4(0.3, 0.5, 1, 1);
    this.particleColor = new Color4(Color_RGBA[0]/255, Color_RGBA[1]/255, Color_RGBA[2]/255, 1);

    this.particles.addPoints(20000, this.particleMaker.bind(this));

  //   //create an EffectRenderer
  //   var eRenderer = new EffectRenderer(this.#engine);

  //   Effect.ShadersStore["onionSkinFragmentShader"] = `
  //     precision highp float;

  //     uniform sampler2D lastFrame;
  //     uniform sampler2D textureSampler;
  //     varying vec2 vUV;
  //     //uniform float opacity;

  //     void main(void) {
  //         vec4 curr = texture2D(textureSampler, vUV);
  //         vec4 last = texture2D(lastFrame, vUV);
  //         curr.rgb = mix(curr.rgb, last.rgb, 0.5);
  //         gl_FragColor = curr;
  //     }
  // `;

  //   Effect.ShadersStore["displayingFragmentShader"] = `
  //       precision highp float;

  //       uniform sampler2D onionedFrame;
  //       varying vec2 vUV;

  //       void main(void) {
  //           vec4 color = texture2D(onionedFrame, vUV);
  //           gl_FragColor = color;
  //       }
  //   `;
  //   let outputTexture;
  //   let eWrapper = new EffectWrapper({
  //     engine: this.#engine,
  //     fragmentShader: Effect.ShadersStore["onionSkinFragmentShader"],
  //     samplerNames: ["lastFrame", "textureSampler"],
  //     name: "effect wrapper",
  //   });
  //   let pingpong = 0;
  //   //Create the two textures to write to
  //   let rttA = new RenderTargetTexture("a", 1, this.scene, false);
  //   let rttB = new RenderTargetTexture("a", 1, this.scene, false);

  //   let rttScene = new RenderTargetTexture("s", 1, this.scene, false);

  //   let trailPostProcess = new PostProcess(
  //     "displaying",
  //     "displaying",
  //     ["screenSize"],
  //     ["onionedFrame"],
  //     1.0,
  //     this.camera,
  //     0,
  //     this.engine
  //   );

  //   trailPostProcess.onApply = function (effect) {
  //     effect.setTexture("onionedFrame", pingpong ? rttA : rttB);
  //   };

  //   eWrapper.onApplyObservable.add(() => {
  //     eWrapper.effect.setTexture("lastFrame", pingpong ? rttB : rttA);
  //     eWrapper.effect.setTexture("textureSampler", rttScene /*videoTexture*/);
  //   });

  //   this.scene.onBeforeCameraRenderObservable.add(() => {
  //     rttScene.render();
  //     // outputTexture = pingpong ? rttA : rttB;
  //     eRenderer.render(eWrapper, pingpong ? rttA : rttB);
  //     pingpong ^= 1;
  //   });

  }

  /**
   * Builds the mesh for stars and particles asynchronously.
   * @async
   * @returns {Promise<void>}
   */
  async buildMesh() {
    await this.#stars.buildMeshAsync();
    await this.particles.buildMeshAsync();

    SceneLoader.ImportMesh(
      null,
      window.location.href,
      "assets/earth.glb",
      this.scene,
      (mesh) => {
        this.scene.createDefaultCameraOrLight(true, false, true);
      }
    );
    return;
  }

  /**
   * Converts Euler angles to Cartesian coordinates.
   * @param {number} r - The radius.
   * @param {number} phi - The azimuthal angle.
   * @param {number} theta - The polar angle.
   * @param {number} psi - The roll angle.
   * @returns {Vector3} - The Cartesian coordinates.
   */
  eulerToCartesian(r, phi, theta, psi) {
    let x = r * Math.cos(psi) * Math.cos(theta);
    let y = r * Math.sin(psi) * Math.cos(theta);
    let z = r * Math.sin(theta);

    return new Vector3(x, y, z);
  }

  /**
   * Generates the position and color of a star particle.
   * @param {Particle} particle - The star particle.
   * @returns {Particle} - The updated star particle.
   */
  starMaker(particle) {
    particle.position = this.eulerToCartesian(
      25,
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random()
    );
    particle.color = this.#starColor;
    particle.pivot = Vector3.Zero();
    return particle;
  }

  /**
   * Generates the position and color of a particle.
   * @param {Particle} particle - The particle.
   * @returns {Particle} - The updated particle.
   */
  particleMaker(particle) {
    particle.position = Vector3.Zero();
    particle.color = this.particleColor;
    particle.pivot = Vector3.Zero();
    return particle;
  }

  /**
   * Updates the positions of particles in the point cloud system.
   * @async
   * @param {number[]} positions - The new positions of particles.
   * @returns {Promise<void>}
   */
  async updateParticles(positions, size) {
    var vertexData = new VertexData();
    vertexData.positions = positions;

    // this.particles = new PointsCloudSystem("particles", size, this.scene, {
    //   updatable: true,
    // });
    // this.particleColor = new Color4(0.3, 0.5, 1, 1);

    // this.particles.addPoints(20000, this.particleMaker.bind(this));
    if (this.particles.mesh) {
      vertexData.applyToMesh(this.particles.mesh);

      this.particles.mesh.material.pointSize = size;
    }
  }
}

export default Earth;
