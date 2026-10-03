import {
  THREE,
  createScene,
  earthMaterial,
  graticule,
  shell,
  marker,
  latitudeRing,
  column,
  arc,
  line,
  createLabel,
  updateLabels,
  v3,
  disposeObject,
} from "./scene.js";
import { latLonVector } from "./astronomy.js";
import { metricById } from "../data/metrics.js";
const cities = [
  [40.71, -74.01],
  [51.51, -0.12],
  [35.68, 139.69],
  [31.23, 121.47],
  [28.61, 77.21],
  [-23.55, -46.63],
  [6.52, 3.38],
  [-6.21, 106.85],
  [30.04, 31.24],
  [19.43, -99.13],
  [-1.29, 36.82],
  [-33.86, 151.2],
];
const teal = "#56b9c2";
function makeLayer(id, observation) {
  const group = new THREE.Group();
  if (id === "temperature" || id === "co2") {
    const color = id === "temperature" ? "#df9561" : "#7fbec8";
    group.add(shell(color, 1.035, 0.15));
    [-45, 0, 45].forEach((lat) =>
      group.add(latitudeRing(lat, 1.05, color, 0.8)),
    );
  } else if (id === "sea") {
    [-45, -15, 15, 45].forEach((lat) =>
      group.add(latitudeRing(lat, 1.03, "#60b9e1", 0.9)),
    );
  } else if (id === "ice") {
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.008,
          80,
          24,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.13,
        ),
        new THREE.MeshBasicMaterial({
          color: "#b9e9f9",
          transparent: true,
          opacity: 0.85,
        }),
      ),
    );
    group.add(latitudeRing(66.6, 1.012, "#f0fdff", 0.95));
  } else if (id === "quakes") {
    for (const p of observation?.points || [])
      group.add(
        marker(p.lat, p.lon, "#eab26d", 0.012 + (p.magnitude - 4.5) * 0.006),
      );
  } else if (id === "nations") {
    group.add(marker(40.75, -73.97, "#f2c77a", 0.028));
    group.add(column(40.75, -73.97, "#f2c77a", 0.24, 0.014));
  } else if (id === "conflicts") {
    [
      [49, 32],
      [15, 30],
      [31.5, 34.5],
      [32, 53],
      [34, 74],
      [35, 38],
    ].forEach((p) => group.add(marker(...p, "#e99a7e", 0.028)));
  } else if (id === "displaced") {
    [
      [15, 30],
      [34, 66],
      [49, 32],
      [35, 38],
      [-2, 24],
    ].forEach((p) => group.add(marker(...p, "#deab8c", 0.025)));
    group.add(
      arc([15, 30], [12, 22], "#deab8c", 0.1),
      arc([49, 32], [52, 20], "#deab8c", 0.12),
      arc([35, 38], [39, 35], "#deab8c", 0.12),
    );
  } else if (id === "gdp" || id === "urban" || id === "renewables") {
    cities.forEach((p, i) => {
      group.add(
        column(
          ...p,
          id === "renewables" ? "#a2cd8d" : "#75c0c9",
          0.08 + (i % 4) * 0.035,
          id === "urban" ? 0.045 : 0.025,
        ),
      );
      group.add(marker(...p, teal, 0.01));
    });
  } else if (id === "trade" || id === "internet" || id === "electricity") {
    [
      [0, 1],
      [1, 2],
      [1, 6],
      [0, 5],
      [2, 3],
      [3, 7],
      [7, 11],
      [4, 8],
    ].forEach(([a, b], i) =>
      group.add(
        arc(
          cities[a],
          cities[b],
          id === "electricity" ? "#f6cb72" : "#80d0dc",
          0.15 + (i % 3) * 0.08,
        ),
      ),
    );
    cities.forEach((p) =>
      group.add(marker(...p, id === "electricity" ? "#f6cb72" : teal)),
    );
  } else if (id === "growth" || id === "inflation" || id === "lifespan") {
    group.add(latitudeRing(0, 1.1, teal, 0.85));
    if (id === "inflation") group.add(latitudeRing(0, 1.18, "#b9d9c9", 0.7));
    if (id === "lifespan") group.rotation.x = Math.PI / 2;
  } else {
    cities.forEach((p) =>
      group.add(marker(...p, id === "water" ? "#7bd6f8" : "#83c7ca", 0.02)),
    );
  }
  return group;
}
export function createGlobe(host, labelsHost, options) {
  const context = createScene(host, { onError: options.onError });
  if (!context) return null;
  const { scene, camera, controls } = context;
  const material = earthMaterial(context.invalidate, () =>
    options.onError("An Earth texture could not load. Reload to try again."),
  );
  scene.add(
    new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material),
    graticule(),
  );
  const outline = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 64, 40),
    new THREE.MeshBasicMaterial({
      color: "#9bcbd7",
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    }),
  );
  scene.add(outline);
  let selected = null,
    layer = new THREE.Group(),
    labels = [],
    targetCamera,
    dragging = false;
  scene.add(layer);
  function clearLabels() {
    labels.forEach((l) => l.el.remove());
    labels = [];
  }
  const focus = (lat, lon, animate = true) => {
    const target = v3(latLonVector(lat, lon, 3.6));
    if (animate && !options.reducedMotion) targetCamera = target;
    else {
      camera.position.copy(target);
      camera.lookAt(0, 0, 0);
      targetCamera = null;
    }
  };
  controls.addEventListener("start", () => {
    targetCamera = null;
    dragging = true;
  });
  controls.addEventListener("end", () => {
    dragging = false;
  });
  let solar;
  function select(id, observation) {
    selected = id;
    scene.remove(layer);
    disposeObject(layer);
    clearLabels();
    layer = id ? makeLayer(id, observation) : new THREE.Group();
    scene.add(layer);
    material.uniforms.cityLights.value = id === "electricity" ? 1 : 0;
    if (id) {
      let [lat, lon] = metricById[id].focus;
      let label = metricById[id].label;
      if (id === "quakes" && observation?.points?.length) {
        ({ lat, lon } = observation.points[0]);
        label = `M ${observation.points[0].magnitude.toFixed(1)} · ${observation.points[0].label}`;
      }
      labels.push(
        createLabel(
          labelsHost,
          label,
          latLonVector(lat, lon, 1.12),
          "selected-label",
        ),
      );
      focus(lat > 60 ? 64 : lat, lon);
    } else {
      const landmarks = [
        [42, -34, "North Atlantic"],
        [-5, 25, "Equatorial Africa"],
        [52, 85, "Eurasia"],
      ];
      for (const [lat, lon, label] of landmarks) {
        layer.add(marker(lat, lon, "#75bac4", 0.012));
        labels.push(
          createLabel(labelsHost, label, latLonVector(lat, lon, 1.02)),
        );
      }
    }
  }
  select(null);
  context.setFrame((time) => {
    if (targetCamera && !dragging) {
      camera.position.lerp(targetCamera, 0.07);
      camera.position.setLength(3.6);
      camera.lookAt(0, 0, 0);
      if (camera.position.distanceTo(targetCamera) < 0.004) targetCamera = null;
    }
    if (selected === "growth" && !options.reducedMotion)
      layer.scale.setScalar(1 + Math.sin(time / 950) * 0.018);
    updateLabels(labels, context);
  });
  return {
    select,
    updateSun(value) {
      solar = value;
      material.uniforms.sunDirection.value.copy(v3(value.vector));
    },
    daylight(value) {
      material.uniforms.daylight.value = value ? 1 : 0;
    },
    rotate(value) {
      controls.autoRotate = value;
    },
    reset() {
      controls.autoRotate = false;
      focus(22, solar ? solar.longitude + 42 : -22);
    },
    destroy() {
      clearLabels();
      context.destroy();
    },
  };
}
