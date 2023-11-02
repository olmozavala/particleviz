// #################################################################
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import earth from "./imgs/earth.jpg";
import { PARTICLE_SIZES, TRAIL_SIZE } from "./ParticlesLayer";
// #################################################################

const initThreeJS = (ReactScope) => {
  console.log("Initializing three.js");

  let autoRotate = true;

  let container = document.getElementById("threejs_holder");
  if (container) {
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
  }

  const getElementByXpath = (path) => {
    return document.evaluate(
      path,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  };

  const navBar = getElementByXpath(`//*[@id="root"]`);
  if (container) {
    container.style.top = navBar?.offsetHeight + "px";
  }

  const getCanvasSize = () => {
    return {
      w: window.innerWidth,
      h: window.innerHeight - (navBar?.offsetHeight || 0),
    };
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    getCanvasSize().w / getCanvasSize().h,
    0.1,
    1000
  );

  const sphereMeshResolution = 32;
  const geometry = new THREE.SphereGeometry(
    1,
    sphereMeshResolution,
    sphereMeshResolution
  );
  let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  var loader = new THREE.TextureLoader();
  loader.load(earth, function (texture) {
    material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  });

  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(getCanvasSize().w, getCanvasSize().h);

  window.addEventListener(
    "resize",
    () => {
      if (container) {
        container.style.top = navBar?.offsetHeight + "px";
      }

      camera.aspect = getCanvasSize().w / getCanvasSize().h;
      camera.updateProjectionMatrix();

      renderer.setSize(getCanvasSize().w, getCanvasSize().h);
    },
    false
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = autoRotate;

  container?.addEventListener("touchstart", (e) => {
    autoRotate = false;
    controls.autoRotate = autoRotate;
  });
  container?.addEventListener("mousedown", (e) => {
    autoRotate = false;
    controls.autoRotate = autoRotate;
  });

  container?.appendChild(renderer.domElement);
  camera.position.set(0, 3, 3);
  controls.update();

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    ReactScope.state._3D_Render ?? requestAnimationFrame(animate);
  };

  window.addEventListener("load", () => {
    requestAnimationFrame(animate);
  });

  const getCoordinatesFromlatlong = (latitude, Longitude) => {
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (Longitude + 180) * (Math.PI / 180);

    let x = -(Math.sin(phi) * Math.cos(theta));
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
  };

  const Point_Geometry = new THREE.BufferGeometry();

  let Point_Material = new THREE.PointsMaterial({
    color: 0x03fcf0,
    size: PARTICLE_SIZES[ReactScope.state.particle_size_index] / 500,
    opacity: 1,
  });

  Point_Material.needsUpdate = true;

  let Points = new THREE.Points(Point_Geometry, Point_Material);

  ReactScope.updatePointsMaterial = () => {
    Point_Material.size =
      PARTICLE_SIZES[ReactScope.state.particle_size_index] / 500;
  };

  let ThreeJSPoints = [];

  ReactScope.RenderPoints = () => {
    Point_Geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(ThreeJSPoints), 3)
    );
  };

  scene.add(Points);
  
  ReactScope.updateTrails = () =>{
    console.log(ReactScope.state.trail_size);
  }

  

  ReactScope.clearThreeJSPoints = () => {
    return new Promise((res) => {
      if (!ThreeJSPoints.length) res(0);
      ThreeJSPoints.forEach((element, i) => {
        scene.remove(element);

        if (i === ThreeJSPoints.length - 1) {
          ThreeJSPoints = [];
          res(0);
        }
      });
    });
  };

  ReactScope.AddPointToBufferGeometry = (lat, lon) => {
    const { x, y, z } = getCoordinatesFromlatlong(lat, lon);
    ThreeJSPoints.push(x);
    ThreeJSPoints.push(y);
    ThreeJSPoints.push(z);
  };

  if (container) document.body.appendChild(container);
};

export default initThreeJS;
