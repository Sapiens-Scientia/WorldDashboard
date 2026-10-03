# World Dashboard

A white, interactive morning dashboard with three horizontal sections:

1. **Earth:** a textured 3D globe with computed daylight. Five economic indicators above it, five geophysical indicators to the left, five geopolitical indicators to the right, and five infrastructure indicators below. Every indicator selects a related 3D annotation and opens its definition and source.
2. **Calendar:** the seven-track annual calendar adapted directly from the local OrbitWeekCalendar repository. Includes week selection, keyboard navigation, year navigation, leap years, solstices/equinoxes, direction reversal, fading past weeks, and an enlarged view.
3. **Astronomy:** an interactive Sun–Earth–Moon model with calculated positions, orbital planes, axial tilts and surface orientations. Play advances one day every half second. Selecting a calendar date updates both 3D models.

## Run

Uses Node.js 22, matching the Vercel runtime.

```sh
npm install
npm run dev -- --port 5174
```

Open http://127.0.0.1:5174. The API runs inside the Vite server during development.

For a local production build:

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173. `HOST` and `PORT` can override the local server binding. No API keys or accounts are required.

```sh
npm test
npm run refresh-data
```

`refresh-data` saves fresh observations to `src/data/snapshot.json`. It preserves saved observations when a source is unavailable. The reference review date is separate from the download date.

## Vercel deployment

[Live dashboard](https://world-dashboard-black.vercel.app/) · [Vercel project](https://vercel.com/sapiens-scientia-vercel-projects/world-dashboard)

The Vercel project connects to `Sapiens-Scientia/WorldDashboard`. Pushes to `main` deploy the production site; other branches get preview deployments through the Vercel GitHub integration.

- `vercel.json` selects Vite, builds with `npm run build`, and serves `dist/`.
- `api/metrics.js` runs the existing public-data service as a Vercel Node.js function. Its bundle includes the saved snapshot for fallback and allows 30 seconds for upstream requests.
- The app needs no API keys or environment variables. Vercel project links and local environment files are ignored by Git.
- Feed caches are local to each function instance; saved observations remain available when an upstream source fails.

This follows [Vercel's Vite function support](https://vercel.com/docs/frameworks/frontend/vite) and [Git integration](https://vercel.com/docs/git).

## Data and model boundaries

- World Bank WDI, NOAA global monthly CO₂, and the USGS M4.5+ past-day feed are checked on opening, manually, and every 15 minutes while the page is visible. Server refreshes are deduplicated and cached for 15 minutes. Each upstream request has a timeout.
- WMO temperature and sea-level trend, NSIDC sea ice, UN membership, UCDP conflicts, UNHCR displacement, and IRENA renewable capacity are **dated published references**, reviewed on October 3, 2026. They are not automatically scraped. All figures link to their primary sources in the app.
- Population is the latest published annual estimate, not an invented ticking count. Inflation uses the World Bank median aggregate. Armed conflicts use the UCDP state-based definition; UN membership counts 193 member states, not every claimed nation.
- Saved observations remain available when public services fail. A USGS feed older than two hours is shown as unavailable, rather than as a current rolling count. Old cache data retains its original check time.
- Most globe layers are **illustrative annotations**: they describe a global measure without pretending to have a measured geographic distribution. Each layer explains this in its details. Earthquake epicenters use measured USGS positions. The selected UCDP conflict locations are examples, not a complete map.
- Astronomy Engine computes planetary and lunar ephemerides in the J2000 ecliptic frame. Earth orientation uses sidereal time plus precession/nutation; Moon orientation uses IAU pole and prime-meridian rotation. Globe sunlight is transformed into Earth-fixed coordinates. The Earth–Sun scene distance is scaled uniformly, the lunar orbit independently, and each body's radius is exaggerated for visibility. Solar texture is illustrative; Earth/cloud imagery is a static composite and does not portray current weather. Moon illumination readout is the geocentric phase fraction.
- The calendar uses equal angular spacing for weeks, as in the original repository. It is a diagram of civil time, not a Keplerian orbit. Calendar dates follow the viewer's local time zone; model timestamps are also displayed in UTC. Date exploration does not change the statistical observation periods.
- The app requires WebGL for 3D. It shows an error if graphics initialization fails; data and the SVG calendar remain available. Scenes pause when offscreen, respect reduced motion for automatic transitions, and release graphics resources on unmount.

## Structure

- `src/calendar/`: original calendar arithmetic, season calculations, and adapted SVG component.
- `src/lib/astronomy.js`: ephemerides and coordinate transformations.
- `src/lib/{scene,globe,solar-scene}.js`: Three.js rendering, annotations and controls.
- `src/data/metrics.js`: metric definitions, source links, formatting and layer descriptions.
- `server/metrics.mjs`: public data feeds, validation and caching.
- `tests/`: astronomy alignment, known events, calendar boundaries, data parsing and staleness tests.
- `docs/design-concept.png`: complete visual concept made with the built-in Image Gen tool. `docs/design.md` records the prompt and design system.

## Attribution

- Calendar adapted from `/Users/benpundykair/Projects_macbookair/CodeProjects_macbookair/OrbitWeekCalendar`, with its existing calendar and seasons logic preserved.
- Ephemerides: [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT.
- Earth Blue Marble and night imagery: NASA, distributed with [three-globe](https://github.com/vasturiano/three-globe/tree/master/example/img).
- Moon texture: [three.js example texture](https://github.com/mrdoob/three.js/tree/r160/examples/textures/planets), MIT distribution.
- Sun and cloud textures: [Solar System Scope](https://www.solarsystemscope.com/textures/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), rendered with lighting and material adjustments.
- Inter: [Rasmus Andersson](https://rsms.me/inter/), SIL Open Font License.
- Icons: [Lucide](https://lucide.dev/), ISC.
- See `THIRD_PARTY_NOTICES.md` for distribution notices.

The original OrbitWeekCalendar repository and its deployment settings were not changed.
