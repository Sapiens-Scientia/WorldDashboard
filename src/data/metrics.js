const wb = (code) =>
  `https://data.worldbank.org/indicator/${code}?locations=1W`;
const climate =
  "https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025";
export const categories = {
  economy: "The global economy",
  geophysics: "Our living planet",
  geopolitics: "Our human world",
  infrastructure: "The world we build",
};
const M = (
  id,
  category,
  label,
  icon,
  format,
  definition,
  layer,
  focus,
  extra = {},
) => ({
  id,
  category,
  label,
  icon,
  format,
  definition,
  layer,
  focus,
  ...extra,
});
export const metrics = [
  M(
    "gdp",
    "economy",
    "World GDP",
    "Globe",
    "trillion",
    "The value of global economic output in current US dollars. Exchange rates and inflation affect this nominal measure.",
    "Selected economic centers, shown as illustrative columns. Column heights are not national GDP values.",
    [25, -15],
    {
      code: "NY.GDP.MKTP.CD",
      source: "World Bank",
      url: wb("NY.GDP.MKTP.CD"),
      sub: "Current US dollars",
    },
  ),
  M(
    "growth",
    "economy",
    "GDP growth",
    "ChartNoAxesCombined",
    "percent",
    "Annual change in real world GDP, measured at constant prices.",
    "An expanding ring represents growth. It is a global annotation, not a regional growth map.",
    [20, 10],
    {
      code: "NY.GDP.MKTP.KD.ZG",
      source: "World Bank",
      url: wb("NY.GDP.MKTP.KD.ZG"),
      sub: "Real annual change",
    },
  ),
  M(
    "inflation",
    "economy",
    "Inflation",
    "Coins",
    "percent",
    "Annual consumer price inflation. The World Bank world aggregate is a median of country rates, not the price change experienced by every household.",
    "Illustrative price-level rings around the globe; no country-level inflation is implied.",
    [15, 0],
    {
      code: "FP.CPI.TOTL.ZG",
      source: "World Bank",
      url: wb("FP.CPI.TOTL.ZG"),
      sub: "Consumer prices · median",
    },
  ),
  M(
    "trade",
    "economy",
    "Global trade",
    "ArrowLeftRight",
    "percent",
    "Exports plus imports of goods and services as a share of global GDP. Cross-border flows appear on both sides of the measure.",
    "Illustrative arcs between major ports. These are connections, not measured routes or trade volumes.",
    [10, 25],
    {
      code: "NE.TRD.GNFS.ZS",
      source: "World Bank",
      url: wb("NE.TRD.GNFS.ZS"),
      sub: "Share of GDP",
    },
  ),
  M(
    "unemployment",
    "economy",
    "Unemployment",
    "BriefcaseBusiness",
    "percent",
    "Share of the global labor force without work, available for work and seeking work. Modeled ILO estimate.",
    "Illustrative markers at population centers; locations do not represent unemployment observations.",
    [25, 70],
    {
      code: "SL.UEM.TOTL.ZS",
      source: "World Bank / ILO",
      url: wb("SL.UEM.TOTL.ZS"),
      sub: "Share of labor force",
    },
  ),
  M(
    "temperature",
    "geophysics",
    "Global temperature",
    "Thermometer",
    "temperature",
    "Global annual mean near-surface temperature anomaly relative to 1850–1900. WMO gives ±0.13°C uncertainty for 2025. Annual warming differs from long-term warming.",
    "A warm atmospheric shell indicates a global average. It is not a local temperature heatmap.",
    [20, -20],
    { source: "WMO", url: climate, sub: "Above 1850–1900" },
  ),
  M(
    "co2",
    "geophysics",
    "Atmospheric CO₂",
    "Cloud",
    "ppm",
    "Monthly global mean carbon dioxide, averaged over marine surface monitoring sites. Recent observations are preliminary; natural seasonality affects monthly values.",
    "A raised atmospheric shell represents the well-mixed atmosphere. Thickness is exaggerated.",
    [20, -30],
    {
      source: "NOAA GML",
      url: "https://gml.noaa.gov/ccgg/trends/global.html",
      sub: "Global monthly mean",
    },
  ),
  M(
    "sea",
    "geophysics",
    "Sea-level rise",
    "Waves",
    "mm",
    "Average annual global mean sea-level rise over 2016–2025, from the WMO update for COP30. This is a trend, not total sea-level change.",
    "Raised ocean rings illustrate rising seas. Height is exaggerated and does not model inundation.",
    [0, -30],
    {
      source: "WMO",
      url: "https://wmo.int/news/media-centre/2025-set-be-second-or-third-warmest-year-record-continuing-exceptionally-high-warming-trend",
      sub: "2016–2025 average rate",
    },
  ),
  M(
    "ice",
    "geophysics",
    "Arctic sea ice",
    "Snowflake",
    "ice",
    "Estimated annual minimum Arctic sea ice extent, reached on September 12, 2026. Extent counts ocean areas with at least 15% ice concentration; preliminary NSIDC estimate.",
    "A schematic Arctic cap highlights the region. Its circular edge is not an observed ice boundary.",
    [70, 0],
    {
      source: "NSIDC",
      url: "https://nsidc.org/news-analyses/news-stories/arctic-sea-ice-has-reached-minimum-extent-2026-antarctic-sea-ice-maximum-most-likely-reached-well",
      sub: "Annual minimum · preliminary",
    },
  ),
  M(
    "quakes",
    "geophysics",
    "Earthquakes",
    "Activity",
    "integer",
    "USGS earthquakes of magnitude 4.5 and above in the rolling past 24 hours. The catalog can be revised. A stale feed is never presented as a live count.",
    "Measured epicenters from the USGS feed. Marker size varies with magnitude; depth is omitted.",
    [15, 140],
    {
      source: "USGS",
      url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
      sub: "M ≥ 4.5 · past 24 hours",
    },
  ),
  M(
    "population",
    "geopolitics",
    "Global population",
    "UsersRound",
    "billion",
    "World Bank midyear population estimate. This is the latest published annual estimate, not a real-time population counter.",
    "Selected large population centers. Dots are illustrative; their sizes are not population estimates.",
    [25, 65],
    {
      code: "SP.POP.TOTL",
      source: "World Bank",
      url: wb("SP.POP.TOTL"),
      sub: "Annual population estimate",
    },
  ),
  M(
    "nations",
    "geopolitics",
    "UN member states",
    "Flag",
    "integer",
    "The 193 member states of the United Nations. The Holy See and the State of Palestine are non-member observer states; this is not a count of all claimed states.",
    "A marker at UN headquarters in New York. It denotes the institution, not a territorial claim.",
    [40.75, -73.97],
    {
      source: "United Nations",
      url: "https://www.un.org/en/about-us",
      sub: "United Nations membership",
    },
  ),
  M(
    "conflicts",
    "geopolitics",
    "Armed conflicts",
    "Swords",
    "integer",
    "UCDP recorded 65 state-based armed conflicts in 2025. Each involves a state on at least one side and at least 25 battle-related deaths in a calendar year. These are conflicts, not countries.",
    "Selected 2025 conflict locations described by UCDP, including Ukraine, Sudan and the Middle East. These examples are not an exhaustive event map.",
    [30, 35],
    {
      source: "UCDP",
      url: "https://www.uu.se/en/press/press-releases/2026/2026-06-09-ucdp-record-number-of-conflicts-between-states",
      sub: "State-based · annual total",
    },
  ),
  M(
    "displaced",
    "geopolitics",
    "Displaced people",
    "PersonStanding",
    "million",
    "People forcibly displaced by persecution, conflict, violence, human rights violations or events seriously disturbing public order, at the end of 2025.",
    "Selected countries with major displacement situations. The arcs are illustrative, not measured migration flows.",
    [20, 32],
    {
      source: "UNHCR",
      url: "https://www.unhcr.org/figures-at-a-glance",
      sub: "Forcibly displaced worldwide",
    },
  ),
  M(
    "lifespan",
    "geopolitics",
    "Life expectancy",
    "Heart",
    "years",
    "Expected years of life at birth if prevailing age-specific mortality rates remain constant. This is a global average, not a prediction for an individual.",
    "A global meridian represents a shared human measure. No local health outcomes are encoded.",
    [20, 15],
    {
      code: "SP.DYN.LE00.IN",
      source: "World Bank",
      url: wb("SP.DYN.LE00.IN"),
      sub: "At birth · global average",
    },
  ),
  M(
    "electricity",
    "infrastructure",
    "Electricity access",
    "Lightbulb",
    "percent",
    "Share of the world population with access to electricity. Access does not guarantee reliable or affordable service.",
    "City lights and illustrative connections highlight electrification. The texture is a historical composite, not a current access map.",
    [30, 30],
    {
      code: "EG.ELC.ACCS.ZS",
      source: "World Bank",
      url: wb("EG.ELC.ACCS.ZS"),
      sub: "Share of population",
    },
  ),
  M(
    "internet",
    "infrastructure",
    "Internet access",
    "Wifi",
    "percent",
    "Share of people who used the internet in the past three months. Includes use from any location or device.",
    "Illustrative intercontinental network arcs, not actual submarine cable alignments or coverage.",
    [25, -25],
    {
      code: "IT.NET.USER.ZS",
      source: "World Bank / ITU",
      url: wb("IT.NET.USER.ZS"),
      sub: "Share of population",
    },
  ),
  M(
    "urban",
    "infrastructure",
    "Urban population",
    "Building2",
    "percent",
    "Population living in areas classified as urban by national statistical offices. Definitions differ between countries.",
    "Selected cities represented by small extruded blocks. Blocks do not encode urban land area or population.",
    [20, 55],
    {
      code: "SP.URB.TOTL.IN.ZS",
      source: "World Bank",
      url: wb("SP.URB.TOTL.IN.ZS"),
      sub: "Share of population",
    },
  ),
  M(
    "water",
    "infrastructure",
    "Drinking water",
    "Droplets",
    "percent",
    "Share of people using safely managed drinking water: an improved source on premises, available when needed and free from contamination.",
    "Schematic blue water markers at selected population centers. These are not observations of local water access.",
    [5, 25],
    {
      code: "SH.H2O.SMDW.ZS",
      source: "World Bank / JMP",
      url: wb("SH.H2O.SMDW.ZS"),
      sub: "Safely managed access",
    },
  ),
  M(
    "renewables",
    "infrastructure",
    "Renewable capacity",
    "Leaf",
    "gw",
    "Maximum net generating capacity of renewable power installations worldwide at year end. Capacity in GW differs from actual annual electricity generation.",
    "Illustrative renewable-energy columns in several regions. Locations and heights do not encode a plant inventory.",
    [30, 65],
    {
      source: "IRENA",
      url: "https://www.irena.org/News/pressreleases/2026/Apr/Near-700-GW-Surge-in-2025-Proves-Renewable-Energy-Resilience",
      sub: "Installed generation capacity",
    },
  ),
];
export const metricById = Object.fromEntries(metrics.map((m) => [m.id, m]));
export function formatValue(metric, observation) {
  if (!observation || !Number.isFinite(observation.value))
    return { value: "—", unit: "" };
  const n = observation.value;
  const f = (v, digits = 1) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  switch (metric.format) {
    case "trillion":
      return { value: `$${f(n / 1e12)}`, unit: "trillion" };
    case "billion":
      return { value: f(n / 1e9, 2), unit: "billion" };
    case "million":
      return { value: f(n / 1e6), unit: "million" };
    case "percent":
      return { value: `${f(n)}%`, unit: "" };
    case "temperature":
      return { value: `${n >= 0 ? "+" : ""}${f(n, 2)}°`, unit: "C" };
    case "ppm":
      return { value: f(n, 2), unit: "ppm" };
    case "mm":
      return { value: f(n), unit: "mm / yr" };
    case "ice":
      return { value: f(n, 2), unit: "M km²" };
    case "years":
      return { value: f(n), unit: "years" };
    case "gw":
      return { value: f(n, 0), unit: "GW" };
    default:
      return { value: f(n, 0), unit: "" };
  }
}
