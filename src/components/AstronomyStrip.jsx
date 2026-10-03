import { useEffect, useRef, useState } from "react";
import { MoveHorizontal, Orbit, Moon, Scan, Play, Pause } from "lucide-react";
import { createSolarScene } from "../lib/solar-scene.js";
export default function AstronomyStrip({ ephem, instant, playing, onPlay }) {
  const host = useRef(null),
    labels = useRef(null),
    scene = useRef(null),
    [error, setError] = useState("");
  useEffect(() => {
    scene.current = createSolarScene(host.current, labels.current, {
      onError: setError,
    });
    return () => {
      scene.current?.destroy();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.update(ephem, instant);
  }, [ephem, instant]);
  return (
    <section
      className="astronomy-strip strip"
      aria-labelledby="astronomy-heading"
    >
      <div className="section-header">
        <div>
          <h2 id="astronomy-heading">Our place in the solar system</h2>
          <p>One shared journey around the Sun.</p>
        </div>
        <div className="astronomy-controls">
          <button
            className={`control ${playing ? "active" : ""}`}
            onClick={onPlay}
            aria-pressed={playing}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
            {playing ? "Pause time" : "Play orbit"}
          </button>
          <button
            className="icon-button"
            aria-label="Reset orbital view"
            onClick={() => scene.current?.reset()}
          >
            <Scan size={17} />
          </button>
        </div>
      </div>
      <div className="solar-visual">
        <div
          className="solar-canvas"
          ref={host}
          role="img"
          aria-label="Computed 3D Sun, Earth and Moon orbits with axial tilts. Body sizes and lunar distance exaggerated."
        />
        <div className="scene-labels" ref={labels} aria-hidden="true" />
        {error && <div className="canvas-error">{error}</div>}
      </div>
      <div className="astronomy-readouts">
        <div>
          <MoveHorizontal />
          <span>
            <small>Earth–Sun distance</small>
            <strong>
              {(ephem.earthKm / 1e6).toFixed(2)} <em>million km</em>
            </strong>
            <small>{(ephem.earthKm / 149597870.7).toFixed(4)} AU</small>
          </span>
        </div>
        <div>
          <Orbit />
          <span>
            <small>Earth’s axial tilt</small>
            <strong>{ephem.tilt.toFixed(2)}°</strong>
            <small>Relative to J2000 ecliptic</small>
          </span>
        </div>
        <div>
          <MoveHorizontal />
          <span>
            <small>Moon–Earth distance</small>
            <strong>
              {Math.round(ephem.moonKm).toLocaleString()} <em>km</em>
            </strong>
            <small>Center to center</small>
          </span>
        </div>
        <div>
          <Moon />
          <span>
            <small>Moon illumination</small>
            <strong>{(ephem.illumination * 100).toFixed(1)}%</strong>
            <small>{ephem.phase}</small>
          </span>
        </div>
      </div>
      <div className="astronomy-note">
        <span>
          Computed positions & axial orientations · Exaggerated sizes and lunar
          orbit
        </span>
        <span>
          {instant.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          })}{" "}
          UTC
        </span>
      </div>
    </section>
  );
}
