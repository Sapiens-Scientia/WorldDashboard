import {
  THREE,
  createScene,
  loadTexture,
  earthMaterial,
  line,
  applyBasis,
  createLabel,
  updateLabels,
  v3,
  disposeObject,
} from "./scene.js";
import { orbitPaths } from "./astronomy.js";
const EARTH_SCALE = 5.3,
  MOON_SCALE = 600;
export function createSolarScene(host, labelHost, options) {
  const context = createScene(host, {
    orthographic: true,
    distance: 19,
    onError: options.onError,
  });
  if (!context) return null;
  const { scene, camera, controls } = context;
  camera.position.set(0, 3.1, 18);
  camera.lookAt(0, 0, 0);
  controls.enableZoom = false;
  controls.minPolarAngle = 0.14;
  controls.maxPolarAngle = Math.PI * 0.48;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 64, 48),
    new THREE.MeshBasicMaterial({
      map: loadTexture("/textures/sun.jpg", context.invalidate, () =>
        options.onError("The solar texture could not load."),
      ),
      color: "#ffe1a8",
    }),
  );
  scene.add(sun);
  const earthGroup = new THREE.Group(),
    moonGroup = new THREE.Group();
  const earthMat = earthMaterial(context.invalidate);
  earthGroup.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.3, 64, 40), earthMat),
  );
  earthGroup.add(
    line(
      [
        [0, -0.46, 0],
        [0, 0.53, 0],
      ],
      "#527a80",
      0.9,
    ),
  );
  const moonMat = new THREE.MeshStandardMaterial({
    map: loadTexture("/textures/moon.jpg", context.invalidate),
    roughness: 1,
  });
  moonGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 40, 24), moonMat));
  moonGroup.add(
    line(
      [
        [0, -0.16, 0],
        [0, 0.19, 0],
      ],
      "#8b969b",
      0.65,
    ),
  );
  scene.add(earthGroup, moonGroup);
  scene.add(new THREE.AmbientLight("#c8d6df", 0.22));
  const sunlight = new THREE.PointLight("#fff3df", 70, 0, 0);
  scene.add(sunlight);
  let paths = new THREE.Group();
  scene.add(paths);
  const labels = [
    createLabel(labelHost, "Sun", [0, 0.68, 0], "body-label"),
    createLabel(labelHost, "Earth", [0, 0, 0], "body-label"),
    createLabel(labelHost, "Moon", [0, 0, 0], "body-label moon-label"),
  ];
  let lastDateKey;
  function update(ephem, date) {
    context.invalidate();
    applyBasis(sun, ephem.sunBasis);
    earthGroup.position.copy(v3(ephem.earth).multiplyScalar(EARTH_SCALE));
    moonGroup.position.copy(
      v3(ephem.moon).multiplyScalar(MOON_SCALE).add(earthGroup.position),
    );
    applyBasis(earthGroup, ephem.earthBasis);
    applyBasis(moonGroup, ephem.moonBasis);
    earthMat.uniforms.sunDirection.value.copy(
      earthGroup.position.clone().negate().normalize(),
    );
    labels[1].position
      .copy(earthGroup.position)
      .add(v3(ephem.earthBasis.north).multiplyScalar(0.62));
    labels[2].position
      .copy(moonGroup.position)
      .add(new THREE.Vector3(0, 0.24, 0));
    const key = date.toISOString().slice(0, 10);
    if (key !== lastDateKey) {
      lastDateKey = key;
      scene.remove(paths);
      disposeObject(paths);
      paths = new THREE.Group();
      const orbit = orbitPaths(date);
      paths.add(
        line(
          orbit.earth.map((p) => p.map((v) => v * EARTH_SCALE)),
          "#91a4a9",
          0.66,
        ),
      );
      const lunar = line(
        orbit.moon.map((p) =>
          v3(p).multiplyScalar(MOON_SCALE).add(earthGroup.position),
        ),
        "#99b3b8",
        0.8,
      );
      paths.add(lunar);
      // A reference plane makes the Moon's actual orbital inclination visible.
      const reference = new THREE.EllipseCurve(
        0,
        0,
        0.00257 * MOON_SCALE,
        0.00257 * MOON_SCALE,
      );
      const ring = line(
        reference
          .getPoints(120)
          .map((p) => new THREE.Vector3(p.x, 0, p.y).add(earthGroup.position)),
        "#c1cdcf",
        0.35,
      );
      paths.add(ring);
      scene.add(paths);
    }
  }
  context.setFrame(() => updateLabels(labels, context, false));
  return {
    update,
    reset() {
      camera.position.set(0, 3.1, 18);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    destroy() {
      labels.forEach((l) => l.el.remove());
      context.destroy();
    },
  };
}
