import { memo } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { formatValue } from "../data/metrics.js";
import MetricIcon from "./Icons.jsx";
export const Metric = memo(function Metric({
  metric,
  observation,
  selected,
  onSelect,
  compact = false,
}) {
  const { value, unit } = formatValue(metric, observation);
  return (
    <button
      className={`metric ${compact ? "metric-compact" : ""} ${selected ? "is-selected" : ""}`}
      aria-pressed={selected}
      aria-label={`${metric.label}: ${value} ${unit}. Show globe layer`}
      onClick={() => onSelect(metric.id)}
      data-metric={metric.id}
    >
      <span className="metric-icon">
        <MetricIcon name={metric.icon} />
      </span>
      <span className="metric-copy">
        <span className="metric-label">{metric.label}</span>
        <span className="metric-value">
          {value}
          <span className="metric-unit">{unit}</span>
        </span>
        <span className="metric-description">{metric.sub}</span>
        <span className="metric-source">
          {metric.source.split(" / ")[0]} ·{" "}
          {observation?.period || "Unavailable"}
        </span>
      </span>
      <ArrowUpRight className="metric-open" size={13} aria-hidden="true" />
    </button>
  );
});
export function MetricDetail({ metric, observation, onClose }) {
  return (
    <div className="metric-detail" aria-live="polite">
      <div className="detail-heading">
        <span>
          <MetricIcon name={metric.icon} size={16} />
          <strong>{metric.label}</strong>
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Clear globe selection"
        >
          <X size={16} />
        </button>
      </div>
      <p>{metric.definition}</p>
      <details>
        <summary>About this globe layer</summary>
        <p>{metric.layer}</p>
      </details>
      <div className="detail-source">
        <span>
          {observation?.status === "checked"
            ? "Source checked"
            : "Saved reference"}
          {observation?.checkedAt
            ? ` ${new Date(observation.checkedAt).toLocaleDateString()}`
            : ""}
        </span>
        <a href={metric.url} target="_blank" rel="noreferrer">
          {metric.source} <ArrowUpRight size={12} />
        </a>
      </div>
    </div>
  );
}
