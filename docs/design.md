# World Dashboard

Visual concept: `design-concept.png`, generated with the built-in Image Gen tool.

Prompt: Create a complete white editorial scientific dashboard with a header, twenty global indicators around a textured daylight globe, the original seven-track counterclockwise Orbit Week Calendar, and a three-dimensional Sun–Earth–Moon orbit strip. Use open horizontal bands, fine gray rules, charcoal text, teal accents, serif headings, compact sans-serif labels. All app text and controls are native UI. Preserve positions and tilts in the actual orbital model; exaggerate sizes and distances for legibility.

## Design system

- True white canvas, #17262c text, #647579 secondary text, #dce4e5 rules, #2c7480 accent, #edf5f5 selection.
- Georgia display headings, locally hosted Inter UI; body 13px, labels 11px, metric values 24px, section headings 30px.
- Open bands and compact ruled metric rows, 36px desktop outer gutters, 16px mobile gutters. No nested cards.
- Globe: economy above; geophysics left; geopolitics right; infrastructure below. Controls below the globe. Clicking an indicator reveals its definition/source and highlights a corresponding spatial annotation.
- Calendar: selected date and seasons left, unchanged original circular week geometry center, selected week right. White background; enlarge and keyboard navigation preserved.
- Astronomy: white WebGL canvas, perspective orbital paths, exaggerated body sizes, computed positions, axial orientation, real Earth and Moon textures. Readout beneath.
- Responsive: horizontal strips remain in order; globe precedes paired metric columns on small screens. Calendar and orbital model expand vertically as needed.

The generated statistics and geography are composition references. The implementation uses verified observations, explicit measurement periods, actual ephemerides, and the repository's calendar geometry. These factual corrections take precedence over the mockup's illustrative numbers, orbital positions, and day ordering.
