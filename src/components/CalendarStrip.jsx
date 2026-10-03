import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Maximize2,
  X,
  Sun,
  Snowflake,
  Leaf,
  Sprout,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import OrbitCalendar from "../calendar/OrbitCalendar.jsx";
import {
  calendarYear,
  dayOfYear,
  dateKey,
  formatDate,
  isoWeek,
  startOfWeek,
  addDays,
  changeYear,
} from "../calendar/calendar.js";
import { seasonEvents } from "../calendar/seasons.js";
const seasonIcons = [Sprout, Sun, Leaf, Snowflake];
export default function CalendarStrip({ selected, today, onSelect }) {
  const year = selected.getUTCFullYear(),
    calendar = useMemo(() => calendarYear(year), [year]),
    seasons = useMemo(() => seasonEvents(year), [year]);
  const dialog = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [januaryAtBottom, setJanuaryAtBottom] = useState(false);
  const openCalendar = () => {
    setExpanded(true);
    dialog.current.showModal();
  };
  const start = startOfWeek(selected),
    day = dayOfYear(selected),
    progress = (day / calendar.dayCount) * 100;
  const props = {
    calendar,
    seasons,
    selected,
    today,
    onSelect,
    januaryAtBottom,
    onToggleJanuaryPosition: () => setJanuaryAtBottom((value) => !value),
  };
  return (
    <section
      className="calendar-strip strip"
      aria-labelledby="calendar-heading"
    >
      <div className="section-header">
        <div>
          <h2 id="calendar-heading">The shape of a year</h2>
          <p>Orbit Week Calendar</p>
        </div>
        <button className="control" onClick={openCalendar}>
          <Maximize2 size={14} />
          View calendar
        </button>
      </div>
      <div className="calendar-layout">
        <div className="date-summary">
          <h3>
            {formatDate(selected, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <p>
            Day {day} of {calendar.dayCount} <span>·</span> Week{" "}
            {isoWeek(selected)}
          </p>
          <div className="year-progress">
            <div
              role="progressbar"
              aria-label="Progress through selected year"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="season-list">
            <h4>Equinoxes & solstices</h4>
            {seasons.map((season, i) => {
              const Icon = seasonIcons[i];
              return (
                <button
                  key={season.id}
                  onClick={() => onSelect(season.date)}
                  className={
                    dateKey(selected) === season.key ? "selected-season" : ""
                  }
                >
                  <Icon size={17} />
                  <span>
                    {formatDate(season.date, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>{season.name}</span>
                </button>
              );
            })}
          </div>
          <p className="calendar-explainer">
            One spoke, one week.
            <br />
            Seven tracks trace the days of our year.
          </p>
        </div>
        <OrbitCalendar {...props} onExpand={openCalendar} />
        <div className="week-panel">
          <div className="week-heading">
            <h3>Week {isoWeek(selected)}</h3>
            <div>
              <button
                className="icon-button"
                aria-label="Previous week"
                disabled={+addDays(selected, -7) < Date.UTC(1900, 0, 1)}
                onClick={() => onSelect(addDays(selected, -7))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Next week"
                disabled={+addDays(selected, 7) > Date.UTC(2200, 11, 31)}
                onClick={() => onSelect(addDays(selected, 7))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p>
            {formatDate(start, { month: "short", day: "numeric" })} –{" "}
            {formatDate(addDays(start, 6), {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="week-list">
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(start, i);
              return (
                <button
                  className={`week-day ${dateKey(date) === dateKey(selected) ? "is-selected" : ""}`}
                  key={i}
                  aria-pressed={dateKey(date) === dateKey(selected)}
                  disabled={
                    date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2200
                  }
                  onClick={() => onSelect(date)}
                >
                  <span>{formatDate(date, { weekday: "short" })}</span>
                  <span>
                    {formatDate(date, { month: "short", day: "numeric" })}
                  </span>
                  {dateKey(date) === dateKey(today) && (
                    <span className="today-tag">Today</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="calendar-year-nav">
            <button
              className="icon-button"
              aria-label="Previous calendar year"
              disabled={year <= 1900}
              onClick={() => onSelect(changeYear(selected, year - 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <span>{year}</span>
            <button
              className="icon-button"
              aria-label="Next calendar year"
              disabled={year >= 2200}
              onClick={() => onSelect(changeYear(selected, year + 1))}
            >
              <ChevronRight size={15} />
            </button>
            <button className="text-button" onClick={() => onSelect(today)}>
              Today
            </button>
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="calendar-dialog"
        onClose={() => setExpanded(false)}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="dialog-header">
          <span>
            <CalendarDays size={18} />
            Orbit Week Calendar
          </span>
          <button
            className="icon-button"
            aria-label="Close calendar"
            onClick={() => dialog.current.close()}
          >
            <X size={21} />
          </button>
        </div>
        {expanded && <OrbitCalendar {...props} initiallyZoomed />}
        <p className="dialog-note">
          Dates also move the daylight and orbital models. Equinox and solstice
          times use your local time zone.
        </p>
      </dialog>
    </section>
  );
}
