import {
  ArcRotateCamera,
  Color4,
  PointsCloudSystem,
  Scene,
  SceneLoader,
  Vector3,
  VertexData,
} from "@babylonjs/core";

class Earth {
  scene;
  /**
   * @type {Mesh | undefined}
   */
  #EarthMesh;
  #camera;
  #stars;
  #starColor;
  particles;
  particleColor;
  constructor(engine, canvas) {
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0, 0, 0, 1);
    this.#camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      this.scene
    );
    this.#starColor = new Color4(1, 1, 1, 1);

    this.#camera.lowerRadiusLimit = 2;
    this.#camera.upperRadiusLimit = 24;
    this.#camera.wheelPrecision =
      (this.#camera.upperRadiusLimit - this.#camera.lowerRadiusLimit) * 2;
    this.#camera.attachControl(canvas, true);

    this.#camera.maxZ = 1001;

    this.#stars = new PointsCloudSystem("stars", 1, this.scene, {
      updatable: false,
    });

    this.#stars.addPoints(1000, this.starMaker.bind(this));

    this.particles = new PointsCloudSystem("particles", 3, this.scene, {
      updatable: true,
    });
    this.particleColor = new Color4(0.3, 0.5, 1, 1);

    this.particles.addPoints(20000, this.particleMaker.bind(this));
  }

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

  eulerToCartesian(r, phi, theta, psi) {
    let x = r * Math.cos(psi) * Math.cos(theta);
    let y = r * Math.sin(psi) * Math.cos(theta);
    let z = r * Math.sin(theta);

    return new Vector3(x, y, z);
  }

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

  particleMaker(particle) {
    particle.position = Vector3.Zero();
    particle.color = this.particleColor;
    particle.pivot = Vector3.Zero();
    return particle;
  }

  async updateParticles(positions) {
    var vertexData = new VertexData();
    vertexData.positions = positions;
    if (this.particles.mesh) vertexData.applyToMesh(this.particles.mesh);
  }
}

export default Earth;
