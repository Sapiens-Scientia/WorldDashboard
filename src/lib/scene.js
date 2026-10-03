import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { latLonVector, DEG } from "./astronomy.js";

export const v3 = (values) => new THREE.Vector3(...values);
export function line(points, color = "#9aaeb3", opacity = 0.5) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map((p) => (p.isVector3 ? p : v3(p))),
    ),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}
export function latitudeRing(lat, radius = 1.01, color, opacity) {
  return line(
    Array.from({ length: 129 }, (_, i) =>
      latLonVector(lat, (i / 128) * 360, radius),
    ),
    color,
    opacity,
  );
}
export function graticule() {
  const group = new THREE.Group();
  for (let lat = -60; lat <= 60; lat += 30)
    group.add(latitudeRing(lat, 1.003, "#aec3cb", 0.17));
  for (let lon = 0; lon < 360; lon += 30)
    group.add(
      line(
        Array.from({ length: 65 }, (_, i) =>
          latLonVector(-90 + (i / 64) * 180, lon, 1.003),
        ),
        "#aec3cb",
        0.17,
      ),
    );
  return group;
}
export function loadTexture(path, onLoad, onError) {
  const texture = new THREE.TextureLoader().load(
    path,
    onLoad,
    undefined,
    onError,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export function earthMaterial(onLoad, onError) {
  const day = loadTexture("/textures/earth-day.jpg", onLoad, onError);
  const night = loadTexture("/textures/earth-night.jpg", onLoad, onError);
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: day },
      nightMap: { value: night },
      sunDirection: { value: new THREE.Vector3(1, 0, 1).normalize() },
      daylight: { value: 1 },
      cityLights: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; varying vec3 vNormal;
      void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D dayMap; uniform sampler2D nightMap; uniform vec3 sunDirection; uniform float daylight; uniform float cityLights; varying vec2 vUv; varying vec3 vNormal;
      void main(){
        float solar=dot(normalize(vNormal),normalize(sunDirection));
        float sun=smoothstep(-0.055,0.09,solar);
        vec3 day=texture2D(dayMap,vUv).rgb;
        vec3 night=texture2D(nightMap,vUv).rgb;
        vec3 lit=day*(0.28+0.85*max(0.0,solar));
        vec3 dark=day*0.038+night*0.85;
        vec3 col=mix(dark,lit,sun);
        col=mix(day*0.82,col,daylight);
        col=mix(col,day*0.06+night*1.7,cityLights);
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
export function shell(color, radius = 1.025, opacity = 0.13) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
}
export function disposeObject(object) {
  const textures = new Set(),
    materials = new Set(),
    geometries = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const list = child.material
      ? Array.isArray(child.material)
        ? child.material
        : [child.material]
      : [];
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value?.isTexture) textures.add(value);
      for (const uniform of Object.values(material.uniforms || {}))
        if (uniform.value?.isTexture) textures.add(uniform.value);
    }
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
}
export function createScene(
  host,
  { fov = 34, distance = 4.1, orthographic = false, onError } = {},
) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    onError?.(
      "This browser could not start 3D graphics. Enable WebGL or try a different browser.",
    );
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor("#ffffff");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  const camera = orthographic
    ? new THREE.OrthographicCamera(-7.5, 7.5, 2, -2, 0.01, 200)
    : new THREE.PerspectiveCamera(fov, 1, 0.01, 200);
  camera.position.set(0, 0.9, distance);
  const scene = new THREE.Scene();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.55;
  controls.autoRotateSpeed = 0.45;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;
  let visible = true,
    destroyed = false,
    last = 0,
    dirty = true;
  const size = { width: 1, height: 1 };
  const resize = new ResizeObserver(() => {
    size.width = host.clientWidth;
    size.height = host.clientHeight;
    if (!size.width || !size.height) return;
    if (orthographic) {
      camera.top = (7.5 * size.height) / size.width;
      camera.bottom = -camera.top;
    } else {
      camera.aspect = size.width / size.height;
      camera.fov =
        (2 *
          Math.atan(
            Math.tan((fov * Math.PI) / 360) / Math.min(1, camera.aspect),
          ) *
          180) /
        Math.PI;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
    dirty = true;
  });
  resize.observe(host);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  });
  intersection.observe(host);
  const onContextLost = (event) => {
    event.preventDefault();
    onError?.(
      "The 3D graphics connection was lost. Reload this page to restore it.",
    );
  };
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  let renderFrame = () => {};
  renderer.setAnimationLoop((time) => {
    if (
      destroyed ||
      (!visible && !dirty) ||
      document.hidden ||
      time - last < 30
    )
      return;
    last = time;
    controls.update();
    renderFrame(time);
    renderer.render(scene, camera);
    dirty = false;
  });
  return {
    renderer,
    camera,
    controls,
    scene,
    size,
    invalidate() {
      dirty = true;
    },
    setFrame(fn) {
      renderFrame = fn;
    },
    destroy() {
      destroyed = true;
      renderer.setAnimationLoop(null);
      resize.disconnect();
      intersection.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
export function applyBasis(object, basis) {
  const x = v3(basis.prime).normalize(),
    y = v3(basis.north).normalize();
  const z = x.clone().cross(y).normalize();
  object.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(x, y, z),
  );
}
export function createLabel(host, text, position, className = "") {
  const el = document.createElement("span");
  el.className = `scene-label ${className}`;
  el.textContent = text;
  host.appendChild(el);
  return { el, position: v3(position) };
}
export function updateLabels(labels, context, occlude = true) {
  const { camera, size } = context;
  const placed = [];
  for (const label of labels) {
    const p = label.position.clone().project(camera);
    const facing =
      !occlude ||
      label.position
        .clone()
        .normalize()
        .dot(camera.position.clone().sub(label.position).normalize()) > 0.12;
    label.el.style.display = facing && p.z < 1 ? "" : "none";
    let left = (p.x * 0.5 + 0.5) * size.width,
      top = (-p.y * 0.5 + 0.5) * size.height;
    if (!occlude) {
      left = Math.max(30, Math.min(size.width - 30, left));
      top = Math.max(20, Math.min(size.height - 12, top));
      for (const prior of placed)
        if (Math.abs(prior.left - left) < 52 && Math.abs(prior.top - top) < 22)
          top = prior.top >= 43 ? prior.top - 23 : prior.top + 23;
      placed.push({ left, top });
    }
    label.el.style.left = `${left}px`;
    label.el.style.top = `${top}px`;
  }
}
export function marker(lat, lon, color = "#43a5ad", size = 0.016) {
  const position = v3(latLonVector(lat, lon, 1.014));
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 12),
    new THREE.MeshBasicMaterial({ color }),
  );
  sphere.position.copy(position);
  group.add(sphere);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 1.8, size * 2.15, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  ring.position.copy(position.clone().multiplyScalar(1.003));
  ring.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize(),
  );
  group.add(ring);
  return group;
}
export function arc(from, to, color, height = 0.25) {
  const a = v3(latLonVector(...from)),
    b = v3(latLonVector(...to));
  const angle = a.angleTo(b),
    sin = Math.sin(angle);
  const points = Array.from({ length: 65 }, (_, i) => {
    const t = i / 64;
    const v =
      Math.abs(sin) < 0.001
        ? a.clone().lerp(b, t).normalize()
        : a
            .clone()
            .multiplyScalar(Math.sin((1 - t) * angle) / sin)
            .add(b.clone().multiplyScalar(Math.sin(t * angle) / sin));
    return v.multiplyScalar(1.02 + Math.sin(t * Math.PI) * height);
  });
  return line(points, color, 0.8);
}
export function column(lat, lon, color, height = 0.13, width = 0.022) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, width),
    new THREE.MeshBasicMaterial({ color }),
  );
  const normal = v3(latLonVector(lat, lon));
  mesh.position.copy(normal.clone().multiplyScalar(1 + height / 2));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  return mesh;
}
export { THREE, DEG };
