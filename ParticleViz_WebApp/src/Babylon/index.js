import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene } from "@babylonjs/core";
import Earth from "./earth";
import { TRAIL_SIZE } from "../ParticlesLayer";

/**
 * List of methods to be overwritten in the main application scope.
 * @constant {string[]}
 */
const METHODS_TO_OVERWRITE = [
  "AddPointToBufferGeometry",
  "RenderPoints",
  "update3DCanvas",
  "clearThreeJSPoints",
  "updateTrails",
  "updatePointsMaterial",
];

/**
 * Represents the main application controlling the 3D globe.
 * @class
 */
class App {
  /**
   * The Babylon.js engine.
   * @type {Engine}
   */
  #engine;

  /**
   * The HTML canvas element.
   * @type {HTMLCanvasElement}
   */
  #canvas;
  #canvasContext;

  /**
   * The HTML container element.
   * @type {HTMLElement}
   */
  #container;

  /**
   * The HTML navigation bar element.
   * @type {HTMLElement | null}
   */
  #navbar;

  /**
   * The main application scope.
   * @type {Object}
   */
  #mainAppScope;

  /**
   * The size of the trail.
   * @type {number}
   */
  #trailSize;

  /**
   * Creates an instance of the App class.
   * @constructor
   * @param {Object} mainAppScope - The main application scope.
   */
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

    this.#canvasContext = this.#canvas.getContext("webgl");

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

    this.Earth = new Earth(this.#engine, this.#canvas);

    this.particlePositions = [];

    this.Earth.buildMesh().then(() => {
      this.#engine.runRenderLoop(() => {
        try {
          this.Earth.scene.render();
          const previousframe = this.#canvasContext.getImageData(
            0,
            0,
            this.#canvas.width,
            this.#canvas.height
          );
          for (var i = 3; i < previousframe.length; i += 4) {
            previousframe[i] = 50;
          }
          // this.#canvas.globalAlpha = 0.9; //TRAIL_SIZE[this.#trailSize];
          this.#canvasContext.putImage(
            previousframe,
            0,
            0,
            this.#canvas.width,
            this.#canvas.height
          );
          // this.#canvas.restore();
        } catch (error) {
          // console.warn(error);
        }
      });
    });

    window.addEventListener("resize", (e) => {
      this.#onWindowResize();
    });

    METHODS_TO_OVERWRITE.forEach((method) => {
      mainAppScope[method] = this[method].bind(this);
    });
  }

  /**
   * Adds a point to the buffer geometry based on latitude and longitude.
   * @param {number} lat - The latitude.
   * @param {number} lon - The longitude.
   */
  AddPointToBufferGeometry(lat, lon) {
    const { x, y, z } = this.getCoordinatesFromlatlong(lat, lon);
    this.particlePositions.push(...[x, y, z]);
  }

  /**
   * Renders the points in the Earth scene.
   */
  RenderPoints() {
    this.Earth.updateParticles(this.particlePositions,this.#mainAppScope.state.particle_size_index);
  }

  /**
   * Updates the canvas on window resize.
   */
  update3DCanvas() {
    this.#onWindowResize();
  }

  /**
   * Clears the points in the scene.
   */
  clearThreeJSPoints() {
    this.particlePositions = [];
  }

  /**
   * Updates the size of the trail.
   */
  updateTrails() {
    this.#trailSize = this.#mainAppScope.state.trail_size;
  }

  /**
   * WIP
   * Updates the points material.
   */
  updatePointsMaterial() {
    return;
  }

  /**
   * Interpolates between two points.
   * @param {Object} a - The first point.
   * @param {Object} b - The second point.
   * @param {number} frac - The interpolation factor.
   * @returns {Object} - The interpolated point.
   */
  interpolate(a, b, frac) {
    var nx = a.x + (b.x - a.x) * frac;
    var ny = a.y + (b.y - a.y) * frac;
    return { x: nx, y: ny };
  }

  /**
   * Handles window resize event.
   * @private
   */
  #onWindowResize() {
    this.#canvas.style.width = this.getCanvasSize().w;
    this.#canvas.style.height = this.getCanvasSize().h;
    this.#canvas.style.top = this.getCanvasSize().topMargin;
    this.#engine.resize();
  }

  /**
   * Converts latitude and longitude to 3D coordinates.
   * @param {number} latitude - The latitude.
   * @param {number} Longitude - The longitude.
   * @returns {Object} - The 3D coordinates.
   */
  getCoordinatesFromlatlong(latitude, Longitude) {
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (Longitude + 180) * (Math.PI / 180);

    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
  }

  /**
   * Gets the size of the canvas.
   * @returns {Object} - The size of the canvas.
   */
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

/**
 * Initializes the Globe application.
 * @param {Object} ReactScope - The main React application scope.
 * @returns {App} - The Globe application instance.
 */
const Globe = (ReactScope) => new App(ReactScope);
export default Globe;
