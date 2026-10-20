# Childhood postcard design QA

final result: passed

## Scope and evidence

- Source: `C:/Users/gover/AppData/Local/Temp/codex-clipboard-3d15e5e2-8bc9-484a-903a-563a741120aa.jpg` (1280 × 2774 social-app screenshot).
- Target region: the two cream postcard panels over the repeated image background; social-app chrome, photography and travel branding are intentionally excluded per the user's childhood-illustration brief.
- Implementation: `http://127.0.0.1:8081/childhood?mine=sample-0`, isolated local fixture mounting the actual Childhood.vue and ChildhoodPostcard.vue components with local existing cartoon assets. No live writes or image-generation requests.
- Actual app: `http://localhost:8080/childhood`; real API requests are still rejected by the existing server middleware. Production data/auth/WeChat sharing remain unverified.
- Browser: Codex in-app browser, via cua_repl. Desktop 1280 × 720 and mobile 390 × 844; temporary viewport override reset after checks.
- Artifact directory: `C:/Users/gover/.codex/visualizations/2026/09/24/01a0d23c-fe2d-76e3-bd9a-abf82ca39887/`
- Full-resolution poster: `childhood-postcard-sample.png` (1080 × 1440).
- Browser captures: `childhood-postcard-desktop.png`, `childhood-postcard-mobile.png`, `childhood-sharing-mobile.png`.
- Compared source screenshot and full-resolution exported poster together in one image inspection tool call. Compared postcard content rather than unrelated source device/social chrome. The 3:4 output and taller story capacity are intentional adaptations, not pixel-for-pixel recreation.

## Required fidelity surfaces

- Typography: warm dark serif Chinese story, restrained italic English heading, small sans-serif labels. Date and QR caption remain distinct. Full-resolution poster inspection covers the fine text omitted by scaled browser screenshots.
- Spacing: cream upper image frame and separate lower correspondence card, aligned left/right margins, narrow inter-card gap, reserved footer zone. Hero illustration is larger than four supporting cutouts.
- Colors: cream paper, pale sage collage, muted brown text, blue-grey actions consistent with existing UI and illustrations.
- Image quality: actual source cutouts reused; transparent padding cropped before placement. The exact same collage canvas supplies the top image and enlarged full-bleed background.
- Copy: memory first, specific invitation question, real creation date where available, QR to the story, explicit excerpt notice for long text. No unsubstantiated daily participation count.

## Comparison history

1. Initial desktop dialog image extended beyond the viewport and global Element Plus styles overrode the cream modal background (P2). Increased selector specificity and capped desktop preview height relative to viewport; mobile keeps its full-width stacked poster. Re-captured desktop and mobile. No remaining actionable P0/P1/P2 visual mismatch.
2. Fixture setup initially lacked the Vue CLI environment define and selected macOS resource-fork files. Fixed fixture configuration and asset selection, then re-ran interactions. These were fixture-only errors, not product defects. No new application errors after correction.

## Functional checks

- Page identity, meaningful render, absence of framework overlays: passed in fixture and real local page (real page shows its existing API error state).
- Story-specific `mine` link renders matching memory and illustration.
- `我也写一段` scrolls and focuses the writing field.
- Topic inserts a starter into empty input; another topic does not overwrite existing text.
- Postcard dialog renders, shows loading/error/retry states, closes via native dialog controls.
- Save button invokes PNG download; visible download-start feedback checked. OS album integration is not claimed.
- Copy invitation shows confirmation; invitation includes the story link and can be edited. External sending was not performed.
- Missing story keeps writing available and displays an unavailable message.
- QR independently decoded with zxing-cpp at 1080, 750 and 540 px poster widths; all resolve to the intended story URL. Sample QR uses a fixture ID and is not a published story.
- Unit tests: 8 sharing tests + 10 existing matting tests passed.
- Changed-file ESLint and production build passed. Production build retains existing project warnings (331 lint warnings plus bundle-size warnings).

## Remaining gaps

Live story saving/generation, WeChat SDK sharing, physical phone album saving and real-user API integration were not exercised. No deployment or external sharing performed. Test fixtures and screenshots remain outside application source.
