import { useEffect, useRef, useState } from "react";
import { Sun, RotateCw, Scan, Pause, Move } from "lucide-react";
import { createGlobe } from "../lib/globe.js";
import { metricById } from "../data/metrics.js";
import { MetricDetail } from "./Metric.jsx";
export default function Globe({ solar, selected, observation, onClear }) {
  const host = useRef(null),
    labels = useRef(null),
    scene = useRef(null);
  const [error, setError] = useState(""),
    [daylight, setDaylight] = useState(true),
    [rotate, setRotate] = useState(false);
  const initialSun = useRef(solar);
  useEffect(() => {
    scene.current = createGlobe(host.current, labels.current, {
      onError: setError,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    scene.current?.updateSun(initialSun.current);
    scene.current?.reset();
    return () => {
      scene.current?.destroy();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.updateSun(solar);
  }, [solar]);
  useEffect(() => {
    scene.current?.select(selected, observation);
  }, [selected, observation]);
  useEffect(() => {
    scene.current?.daylight(daylight);
  }, [daylight]);
  useEffect(() => {
    scene.current?.rotate(rotate);
  }, [rotate]);
  return (
    <div className="globe-panel" id="globe-view">
      <div className="globe-visual">
        <div
          className="globe-canvas"
          ref={host}
          role="img"
          aria-label={`Interactive Earth with ${daylight ? "computed daylight" : "even lighting"}${selected ? `, ${metricById[selected].label} layer` : ""}`}
        />
        <div className="scene-labels" ref={labels} aria-hidden="true" />
        {error && (
          <div className="canvas-error" role="status">
            {error}
          </div>
        )}
      </div>
      <div className="globe-controls">
        <button
          className={daylight ? "control active" : "control"}
          aria-pressed={daylight}
          onClick={() => setDaylight((v) => !v)}
        >
          <Sun size={14} />
          Daylight
        </button>
        <button
          className={rotate ? "control active" : "control"}
          aria-pressed={rotate}
          onClick={() => setRotate((v) => !v)}
        >
          {rotate ? <Pause size={14} /> : <RotateCw size={14} />}{" "}
          {rotate ? "Pause" : "Rotate"}
        </button>
        <button
          className="control"
          onClick={() => {
            setRotate(false);
            onClear();
            scene.current?.reset();
          }}
        >
          <Scan size={14} />
          Reset view
        </button>
      </div>
      {selected ? (
        <MetricDetail
          metric={metricById[selected]}
          observation={observation}
          onClose={onClear}
        />
      ) : (
        <p className="globe-hint">
          <Move size={12} /> Drag to explore <span>·</span> Select an indicator
          to see its layer
        </p>
      )}
    </div>
  );
}
