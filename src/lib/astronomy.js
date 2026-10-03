import * as A from "astronomy-engine";

export const AU_KM = 149597870.7;
export const DEG = Math.PI / 180;
export const normalizeDegrees = (angle) =>
  ((((angle + 180) % 360) + 360) % 360) - 180;
const xyz = (v) => [v.x, v.z, -v.y]; // Astronomical Z-up -> Three.js Y-up, preserving handedness.
const ecliptic = (v) => A.RotateVector(A.Rotation_EQJ_ECL(), v);

export function latLonVector(lat, lon, radius = 1) {
  return [
    radius * Math.cos(lat * DEG) * Math.cos(lon * DEG),
    radius * Math.sin(lat * DEG),
    -radius * Math.cos(lat * DEG) * Math.sin(lon * DEG),
  ];
}

export function solarPosition(date) {
  const sun = A.EquatorFromVector(
    A.RotateVector(
      A.Rotation_EQJ_EQD(date),
      A.GeoVector(A.Body.Sun, date, true),
    ),
  );
  const longitude = normalizeDegrees(15 * (sun.ra - A.SiderealTime(date)));
  return {
    latitude: sun.dec,
    longitude,
    vector: latLonVector(sun.dec, longitude),
  };
}

// Body-fixed +X is the prime meridian; +Y is north; +Z points to 90° west.
export function bodyBasis(body, date) {
  let prime, north;
  if (body === A.Body.Earth) {
    const angle = A.SiderealTime(date) * 15 * DEG;
    const toJ2000 = A.Rotation_EQD_EQJ(date);
    prime = A.RotateVector(
      toJ2000,
      new A.Vector(Math.cos(angle), Math.sin(angle), 0, date),
    );
    north = A.RotateVector(toJ2000, new A.Vector(0, 0, 1, date));
  } else {
    const axis = A.RotationAxis(body, date);
    const a = axis.ra * 15 * DEG,
      d = axis.dec * DEG,
      w = axis.spin * DEG;
    const node = [-Math.sin(a), Math.cos(a), 0];
    const east = [
      -Math.sin(d) * Math.cos(a),
      -Math.sin(d) * Math.sin(a),
      Math.cos(d),
    ];
    prime = new A.Vector(
      ...node.map((n, i) => n * Math.cos(w) + east[i] * Math.sin(w)),
      date,
    );
    north = axis.north;
  }
  return { prime: xyz(ecliptic(prime)), north: xyz(ecliptic(north)) };
}

export function ephemeris(date) {
  const earth = A.HelioVector(A.Body.Earth, date);
  const moon = A.GeoMoon(date);
  const phaseAngle = A.MoonPhase(date);
  const illumination = A.Illumination(A.Body.Moon, date).phase_fraction;
  const earthBasis = bodyBasis(A.Body.Earth, date);
  const tilt = Math.acos(Math.min(1, Math.max(-1, earthBasis.north[1]))) / DEG;
  const phase =
    phaseAngle < 10 || phaseAngle > 350
      ? "New moon"
      : phaseAngle < 80
        ? "Waxing crescent"
        : phaseAngle < 100
          ? "First quarter"
          : phaseAngle < 170
            ? "Waxing gibbous"
            : phaseAngle < 190
              ? "Full moon"
              : phaseAngle < 260
                ? "Waning gibbous"
                : phaseAngle < 280
                  ? "Last quarter"
                  : "Waning crescent";
  return {
    earth: xyz(ecliptic(earth)),
    moon: xyz(ecliptic(moon)),
    earthKm: earth.Length() * AU_KM,
    moonKm: moon.Length() * AU_KM,
    earthBasis,
    moonBasis: bodyBasis(A.Body.Moon, date),
    sunBasis: bodyBasis(A.Body.Sun, date),
    tilt,
    phase,
    phaseAngle,
    illumination,
    solar: solarPosition(date),
  };
}

export function orbitPaths(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const earth = Array.from({ length: 181 }, (_, i) =>
    xyz(
      ecliptic(
        A.HelioVector(
          A.Body.Earth,
          new Date(+start + (i / 180) * 365.25636 * 86400000),
        ),
      ),
    ),
  );
  // Sample an actual sidereal month around the selected instant. Inclination and nodes emerge from the ephemeris.
  const moon = Array.from({ length: 121 }, (_, i) =>
    xyz(
      ecliptic(
        A.GeoMoon(new Date(+date + (i / 120 - 0.5) * 27.321661 * 86400000)),
      ),
    ),
  );
  return { earth, moon };
}

export function instantForCivilDate(civil, now) {
  return new Date(
    civil.getUTCFullYear(),
    civil.getUTCMonth(),
    civil.getUTCDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );
}
