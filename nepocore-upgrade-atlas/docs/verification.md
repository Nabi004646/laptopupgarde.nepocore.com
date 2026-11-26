# Verification report · version 1.0.0

## Completed on 2026-11-26

| Area | Result |
|---|---|
| Research | Six Lenovo ThinkPad hardware platforms checked against their linked PSREF Memory and Storage sections. Conditional soldered capacity totals, CPU speed limits, drive restrictions and regional options were carried through to the relevant pages. See [source register](source-register.md). |
| Build and automated checks | `npm test` passed five suites covering schema rejection, machine-type aliases and variant isolation, combined filters and unknown handling, comparison limits and caveats, and the built pages’ routes, assets, anchors, metadata and conditional text. |
| Desktop Chrome | Search from the homepage, filters, empty results and reset focus. Comparison at zero, one, two and three selections including removal and cap. Bookmark persistence and clearing. Correct model link copied to the clipboard. No application console errors in the main flows. |
| Narrow layout and keyboard | At a 360 px frame width, checked containment on model detail and comparison. Verified keyboard scrolling within the comparison region and focus after catalogue reset and manual copy. |
| Browser fallbacks | Verified a model page with scripts disabled, shortlist toggling with browser storage blocked, comparison navigation using a validated URL selection, and manual copy with Clipboard API unavailable. |
| Print | Exercised the print control and applied the print declarations in Chrome at A4 content width. The caveat, manufacturer source, source URL styling and check date are in the printable content, with navigation and action controls suppressed. Native PDF pagination was not captured. |

The optional Python Playwright script is included for rerunning browser workflows locally. The standalone Chromium binary was unavailable in this execution environment, so the completed browser checks above used the managed Chrome preview.

## Known limitations

- The catalogue covers six Lenovo platforms and the verified machine types shown. It has no full-SKU lookup, independent hardware tests or absolute storage capacity claims.
- The X280 drive lengths and optional T480 secondary drive length are unknown in the checked platform documents. The source register describes the affected sources and access gaps.
- Production hosting, declared deployment URL and the correction email are owner settings. No live publication, corrections destination or advertising is configured.
- Accessibility checks were limited to semantic structure, keyboard focus, responsive overflow and readability checks. No third-party WCAG certification or cross-browser device audit was performed.

## Deploy-ready packaging

The GitHub Pages workflow and Cloudflare Pages build settings are included. Local checks covered the root build and a GitHub-style repository subpath, including recovery links in the nested 404 case. Provider deployments and custom DNS were not exercised.
