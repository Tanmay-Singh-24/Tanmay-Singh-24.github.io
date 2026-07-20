# TANMAY SINGH — CASE #01 · v2.1

Experimental portfolio. Engineered-white minimalism with an interactive
**pixel heat field** hero, per-project **particle flow figures**, and a
**pixel-text marquee**, inspired by craft.wild.as; type in the
PP Neue Montreal register.

Pure HTML/CSS/JS — no frameworks, no build step.

## The playground (SEC.02·B)

**SNAKE://RETRIEVAL** — a playable game in the About section. The snake
is a heat trail (lime head cooling through aqua → ultramarine → cold);
paper cells are context chunks (+10 tokens), red cells are hallucinations
(fatal). An autopilot plays the game until the visitor presses an arrow /
WASD or swipes — then they're driving. Wrap-around walls, speed ramps
with score, best score persists in localStorage.

## The flow figures (SEC.01)

Each project gets a particle story on graph paper, staged left → right
(navy → ultramarine → aqua → lime), with rejects in signal red. The
cursor stirs the field; clicking detonates a shockwave.

- FIG.01 CourseLens — chaos → embed band → converging retrieval → answer
  burst; red = chunks rejected by the relevance gate
- FIG.02 OMS — intake chaos → validate rows → commit lanes → settled
  ledger; red = rollbacks falling out
- FIG.03 SeatLock — racing threads → single-file mutex funnel → seat
  grid locking lime; red = racers that lost the lock (real collisions:
  a seat can only be claimed once)

## Run locally

```sh
python3 -m http.server 4173
# → http://localhost:4173
```

## Deploy

Static site — drop the folder on GitHub Pages, Netlify, Vercel, or
Cloudflare Pages as-is.

## The hero field

Your cursor deposits gaussian "heat" into a grid of cells; each cell's
temperature picks its color from the band ramp below and cools back down.
Click spawns an expanding wave. The headline is rendered into a mask and
kept as a safe zone, revealed with a block-dissolve sweep after the
preloader. Cell size and brush size are adjustable bottom-left.

## The warp (SEQ.00)

A pinned, scroll-scrubbed pixel hyperspace between the hero and the
marquee (340vh of travel). Cells stream outward from center through the
heat bands (cold → blue → aqua → lime by depth), gaining trails as the
tunnel accelerates — driven by scroll progress *and* scroll velocity.
The center message is a glitch syllogism — it decodes through
AGENTS RUN ON SYSTEMS. → SYSTEMS RUN ON METAL. → ∴ I LEARNED THE METAL.
with aqua/lime ghost slices during transitions and random micro-glitch
bursts between them; manifesto fragments and lime ellipse rings arrive
in the final third. Reduced motion: unpinned static frame.

## Scroll cinematography

No scroll library — one rAF-driven module (`scrollFrames`):

- Hero field zooms out (scale 1→1.35) and fades as you scroll past it
- Each project title slides in from alternating sides with a slight skew,
  scrubbed by scroll position (not a one-shot reveal)
- Each figure wipes open (clip-path inset, alternating direction) tracking
  its own viewport entry
- Scroll velocity feeds the flow figures — scroll fast and every particle
  stream rushes, then settles
- Header shows a live cursor-coordinates readout (0000 X · 0000 Y) beside
  the UTC clock

## The Observer (SEC.02)

The About figure is two pixel eyes with heat-band irises that track the
cursor anywhere on the page — eased pursuit, randomized blinks (with
double-blinks), pupil dilation on approach, idle wandering after 4s of
stillness, and a wink on click.

## Palette — "cold circuit", concrete pressing

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#181817` | concrete charcoal — the site background (plus 5% static grain) |
| `--paper` | `#f1f2ee` | bone white — text + the light ABOUT panel |
| `--ink` | `#0c0c0e` | near-black |
| `--muted` | `#85878f` | cool gray secondary text |
| `--cold` | `#2a3163` | coldest visible heat band on dark |
| `--blue` | `#2333ff` | ultramarine — primary accent |
| `--blue-hi` | `#5060ff` | lifted ultramarine for small text on dark |
| `--aqua` | `#37e0c8` | electric aqua — heat band 3, hover accent |
| `--lime` | `#d4ff3f` | acid lime — hottest band |
| `--alert` | `#ff5230` | signal red — rejects/rollbacks only |

Heat ramp (cold → hot): cold → ultramarine → aqua → lime.

## Type

- Display & body: **PP Neue Montreal** if present, else **Inter Tight** (Google Fonts).
- Metadata voice: **IBM Plex Mono**.

PP Neue Montreal is a commercial typeface by Pangram Pangram. If you have
a license (they offer a free personal-use download at pangrampangram.com),
drop the files in `fonts/` as:

```
fonts/PPNeueMontreal-Book.woff2      (400)
fonts/PPNeueMontreal-Medium.woff2    (500)
fonts/PPNeueMontreal-Bold.woff2      (700)
```

The `@font-face` rules at the top of `style.css` pick them up
automatically; until then the site uses Inter Tight.

## TODO before publishing

- [ ] Real LinkedIn URL in SEC.03 (GitHub is wired to Tanmay-Singh-24;
      project titles link to their repos)
- [ ] Optional: licensed PP Neue Montreal files in `fonts/` (see above)
- [ ] Read the ABOUT / WORKS copy once more
