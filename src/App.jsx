import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw, X, BookOpen, ArrowRight } from "lucide-react";
import Globe from "./components/Globe.jsx";
import CalendarStrip from "./components/CalendarStrip.jsx";
import AstronomyStrip from "./components/AstronomyStrip.jsx";
import { Metric } from "./components/Metric.jsx";
import { categories, metrics, formatValue } from "./data/metrics.js";
import { useMetrics, usableObservation } from "./lib/useMetrics.js";
import { ephemeris, instantForCivilDate } from "./lib/astronomy.js";
import {
  localToday,
  addDays,
  dateKey,
  formatDate,
} from "./calendar/calendar.js";

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [chosenDate, setChosenDate] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [playing, setPlaying] = useState(false);
  const { data, loading, refresh } = useMetrics();
  const sourcesDialog = useRef(null);
  const today = useMemo(() => localToday(), [now]);
  const selected = chosenDate || today;
  const instant = useMemo(
    () => (chosenDate ? instantForCivilDate(chosenDate, now) : now),
    [chosenDate, now],
  );
  const ephem = useMemo(() => ephemeris(instant), [instant]);
  const observations = useMemo(
    () =>
      Object.fromEntries(
        metrics.map((m) => [
          m.id,
          usableObservation(m.id, data.observations[m.id], now),
        ]),
      ),
    [data, now],
  );
  const selectMetric = useCallback((id) => {
    setSelectedMetric((previous) => (previous === id ? null : id));
    requestAnimationFrame(() => {
      const globe = document.getElementById("globe-view");
      if (!globe) return;
      const bounds = globe.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
        globe.scrollIntoView({
          block: "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
    });
  }, []);
  const clearMetric = useCallback(() => setSelectedMetric(null), []);
  const selectDate = useCallback((date) => {
    setChosenDate(date);
    setPlaying(false);
  }, []);
  const goToday = () => {
    setChosenDate(null);
    setPlaying(false);
    setNow(new Date());
  };
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setChosenDate((previous) => {
          const next = addDays(previous || localToday(), 1);
          return next.getUTCFullYear() > 2200 ? previous : next;
        }),
      500,
    );
    return () => clearInterval(timer);
  }, [playing]);
  const failedCount = data.sources?.filter((s) => !s.ok).length || 0;
  const metricList = (category, compact = false) =>
    metrics
      .filter((m) => m.category === category)
      .map((m) => (
        <Metric
          key={m.id}
          metric={m}
          observation={observations[m.id]}
          selected={selectedMetric === m.id}
          onSelect={selectMetric}
          compact={compact}
        />
      ));
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#earth">
          <img src="/favicon.svg" alt="" />
          <span>World Dashboard</span>
        </a>
        <div className="header-right">
          <time dateTime={now.toISOString()}>
            {formatDate(today, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <button
            className="icon-button refresh-button"
            aria-label="Refresh indicator data"
            title="Refresh indicator data"
            disabled={loading}
            onClick={() => refresh()}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button className="today-button" onClick={goToday}>
            Today
          </button>
        </div>
      </header>
      <main>
        <section
          id="earth"
          className="earth-strip"
          aria-labelledby="earth-heading"
        >
          <div className="overview-top">
            <div className="earth-title">
              <h1 id="earth-heading">Earth, today</h1>
              <p>A shared planet. A daily perspective.</p>
            </div>
            <div
              className="economy-metrics"
              role="group"
              aria-label={categories.economy}
            >
              {metricList("economy", true)}
            </div>
          </div>
          {chosenDate && dateKey(chosenDate) !== dateKey(today) && (
            <div className="date-exploration" role="status">
              <span>
                Exploring{" "}
                {formatDate(chosenDate, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · Globe & orbits follow this date. Indicators show their
                published periods.
              </span>
              <button className="text-button" onClick={goToday}>
                Back to today <ArrowRight size={12} />
              </button>
            </div>
          )}
          <div className="earth-layout">
            <div
              className="metric-column geophysics"
              role="group"
              aria-label={categories.geophysics}
            >
              <h2 className="column-heading">{categories.geophysics}</h2>
              {metricList("geophysics")}
            </div>
            <Globe
              solar={ephem.solar}
              selected={selectedMetric}
              observation={observations[selectedMetric]}
              onClear={clearMetric}
            />
            <div
              className="metric-column geopolitics"
              role="group"
              aria-label={categories.geopolitics}
            >
              <h2 className="column-heading">{categories.geopolitics}</h2>
              {metricList("geopolitics")}
            </div>
          </div>
          <div className="infrastructure-wrap">
            <h2 className="infrastructure-heading">
              The world <br />
              we build
            </h2>
            <div
              className="infrastructure-metrics"
              role="group"
              aria-label={categories.infrastructure}
            >
              {metricList("infrastructure", true)}
            </div>
          </div>
          <div className="data-status" role="status">
            <span
              className={`status-dot ${data.offline || failedCount ? "muted" : ""}`}
            />
            {loading
              ? "Checking public data sources…"
              : data.offline
                ? "Showing saved observations · refresh unavailable"
                : failedCount
                  ? `${data.sources.length - failedCount} feeds checked · ${failedCount} using saved observations`
                  : data.checkedAt
                    ? "Public data checked · each indicator shows its observation period"
                    : "Published observations · each indicator shows its reporting period"}
            <button
              className="text-button"
              onClick={() => sourcesDialog.current.showModal()}
            >
              Sources & method <ArrowUpRight size={12} />
            </button>
          </div>
        </section>
        <CalendarStrip
          selected={selected}
          today={today}
          onSelect={selectDate}
        />
        <AstronomyStrip
          ephem={ephem}
          instant={instant}
          playing={playing}
          onPlay={() => setPlaying((p) => !p)}
        />
      </main>
      <footer>
        <span>
          World Dashboard <span className="footer-dot">·</span> A little
          perspective, every morning.
        </span>
        <button
          className="text-button"
          onClick={() => sourcesDialog.current.showModal()}
        >
          <BookOpen size={13} /> Sources & methodology
        </button>
      </footer>
      <dialog
        ref={sourcesDialog}
        className="sources-dialog"
        onClick={(e) => {
          if (e.target === sourcesDialog.current) sourcesDialog.current.close();
        }}
      >
        <div className="dialog-header">
          <h2>Sources & methodology</h2>
          <button
            className="icon-button"
            aria-label="Close sources"
            onClick={() => sourcesDialog.current.close()}
          >
            <X size={22} />
          </button>
        </div>
        <p className="sources-intro">
          Twenty lenses on one planet. Figures retain their observation periods;
          annual statistics do not become daily measurements. World Bank, NOAA
          and USGS feeds refresh on opening and every 15 minutes. Other figures
          are dated references reviewed on{" "}
          {data.referenceReviewed || "2026-10-03"}.
        </p>
        <div className="method-note">
          <strong>How to read the models</strong>
          <p>
            Astronomy Engine computes the Sun, Earth and Moon at the displayed
            instant. Daylight follows the subsolar point; rotating the view
            moves the camera. Earth and Moon textures are historical composites,
            not live weather. Orbital body sizes and the lunar distance are
            exaggerated independently; positions, planes and axial directions
            come from the ephemerides. The calendar keeps the Orbit Week
            Calendar repository’s equally spaced weekly spokes, rather than
            simulating orbital speed.
          </p>
          <p>
            Most indicator layers are explanatory annotations. They do not claim
            to be measured geographic distributions. Earthquake epicenters come
            from the USGS feed; other layers explain their scope below.
          </p>
          <a
            href="https://github.com/cosinekitty/astronomy"
            target="_blank"
            rel="noreferrer"
          >
            Astronomy Engine <ArrowUpRight size={12} />
          </a>
        </div>
        {Object.entries(categories).map(([category, name]) => (
          <section key={category} className="source-section">
            <h3>{name}</h3>
            {metrics
              .filter((m) => m.category === category)
              .map((m) => {
                const obs = observations[m.id],
                  f = formatValue(m, obs);
                return (
                  <details key={m.id} className="source-row">
                    <summary>
                      <span>{m.label}</span>
                      <span>
                        {f.value} {f.unit}{" "}
                        <small>· {obs?.period || "Unavailable"}</small>
                      </span>
                    </summary>
                    <p>{m.definition}</p>
                    <p>
                      <strong>On the globe:</strong> {m.layer}
                    </p>
                    <p className="source-state">
                      {obs?.status === "checked"
                        ? "Successfully checked online"
                        : "Saved reference / awaiting source"}
                      {obs?.checkedAt
                        ? ` · ${new Date(obs.checkedAt).toLocaleString()}`
                        : ""}
                    </p>
                    <a href={m.url} target="_blank" rel="noreferrer">
                      {m.source} <ArrowUpRight size={12} />
                    </a>
                  </details>
                );
              })}
          </section>
        ))}
        <p className="asset-credits">
          Earth imagery: NASA Blue Marble and Earth at Night, distributed with
          three-globe, shown without a cloud overlay. Moon: three.js example
          texture. Sun texture: Solar System Scope, CC BY 4.0. Interface: Inter,
          SIL Open Font License. Calendar adapted from your OrbitWeekCalendar
          repository.
        </p>
      </dialog>
    </div>
  );
}
