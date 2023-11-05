import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene } from "@babylonjs/core";
import Earth from "./earth";

const METHODS_TO_OVERWRITE = [
  "AddPointToBufferGeometry",
  "RenderPoints",
  "update3DCanvas",
  "clearThreeJSPoints",
  "updateTrails",
  "updatePointsMaterial",
];

class App {
  #engine;
  #canvas;
  #container;
  #navbar;
  #mainAppScope;
  #trailSize;
  #previousPositions;
  constructor(mainAppScope) {
    this.#mainAppScope = mainAppScope;

    this.#container = document.getElementById("threejs_holder");

    this.#canvas = document.createElement("canvas");
    this.#canvas.style.width = this.getCanvasSize().w;
    this.#canvas.style.height = this.getCanvasSize().h;
    this.#canvas.style.position = "absolute";
    this.#canvas.style.left = "0px";
    this.#canvas.style.top = this.getCanvasSize().topMargin;

    this.#canvas.id = "gameCanvas";
    this.#container?.appendChild(this.#canvas);

    this.#engine = new Engine(
      this.#canvas,
      true,
      { antialias: true, powerPreference: "high-performance" },
      true
    );
    var scene = new Scene(this.#engine);
    this.#engine.displayLoadingUI();

    scene.whenReadyAsync();
    this.#engine.hideLoadingUI();

    this.#trailSize = this.#mainAppScope.state.trail_size;
    this.#previousPositions = [];

    this.Earth = new Earth(this.#engine, this.#canvas);

    this.particlePositions = [];

    this.Earth.buildMesh().then((mesh) => {
      this.#engine.runRenderLoop(() => {
        this.Earth.scene.render();
      });
    });

    window.addEventListener("resize", (e) => {
      this.#onWindowResize();
    });

    METHODS_TO_OVERWRITE.forEach((method) => {
      mainAppScope[method] = this[method].bind(this);
    });
  }

  AddPointToBufferGeometry(lat, lon) {
    const { x, y, z } = this.getCoordinatesFromlatlong(lat, lon);
    // const { x, y, z } = this.getCoordinatesFromlatlong(18.51957, 73.85535);
    this.particlePositions.push(...[x, y, z]);
  }

  RenderPoints() {
    this.Earth.updateParticles(this.particlePositions);
  }

  update3DCanvas() {
    this.#onWindowResize();
  }

  clearThreeJSPoints() {
    if (this.#previousPositions.length > 1) this.#previousPositions.shift();
    this.#previousPositions.push(this.particlePositions);
    this.particlePositions = [];
  }

  updateTrails() {
    this.#trailSize = this.#mainAppScope.state.trail_size;
  }

  updatePointsMaterial() {
    return;
  }

  interpolate(a, b, frac) {
    var nx = a.x + (b.x - a.x) * frac;
    var ny = a.y + (b.y - a.y) * frac;
    return { x: nx, y: ny };
  }

  #onWindowResize() {
    this.#canvas.style.width = this.getCanvasSize().w;
    this.#canvas.style.height = this.getCanvasSize().h;
    this.#canvas.style.top = this.getCanvasSize().topMargin;
    this.#engine.resize();
  }

  getCoordinatesFromlatlong(latitude, Longitude) {
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (Longitude + 180) * (Math.PI / 180);

    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
  }

  getCanvasSize = () => {
    const getElementByXpath = (path) => {
      return this.#navbar
        ? this.#navbar
        : document.evaluate(
            path,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
    };

    const navBar = getElementByXpath(`//*[@id="root"]`);

    return {
      w: window.innerWidth + "px",
      h: window.innerHeight - (navBar?.offsetHeight || 0) + "px",
      topMargin: (navBar?.offsetHeight || 0) + "px",
    };
  };
}
const Globe = (ReactScope) => new App(ReactScope);
export default Globe;
