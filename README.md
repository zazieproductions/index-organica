# ⊛ AGON // SIGNAL ENGINE

**A cybernetic browser synthesizer and audiovisual signal laboratory — an infinite living archive that watches you back, and now it can sing.**

[![AGON // Signal Engine interface](docs/images/agon-signal-engine-preview.png)](https://zazieproductions.github.io/index-organica/)

<p align="center">
  <a href="https://zazieproductions.github.io/index-organica/">
    <img src="https://img.shields.io/badge/%E2%8A%9B%20Launch%20AGON%20%2F%2F%20Signal%20Engine-aaff00?style=for-the-badge&labelColor=050705&color=aaff00&logoColor=050705" alt="Launch AGON // Signal Engine" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%2019-050705?style=flat-square&logo=react&logoColor=c6ff4d" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-050705?style=flat-square&logo=typescript&logoColor=c6ff4d" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-050705?style=flat-square&logo=vite&logoColor=c6ff4d" alt="Vite" />
  <img src="https://img.shields.io/badge/Canvas-050705?style=flat-square&logo=html5&logoColor=c6ff4d" alt="Canvas" />
  <img src="https://img.shields.io/badge/Web%20Audio%20API-050705?style=flat-square&logo=webaudio&logoColor=c6ff4d" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-050705?style=flat-square&logo=tailwindcss&logoColor=c6ff4d" alt="Tailwind CSS" />
  <a href="https://github.com/zazieproductions/index-organica/actions/workflows/deploy.yml"><img src="https://github.com/zazieproductions/index-organica/actions/workflows/deploy.yml/badge.svg" alt="Deploy status" /></a>
</p>

> ⚠️ **HEARING ADVISORY** — the Signal Engine drives a resonant filter with teeth. It can get loud fast.
> **Begin at low volume**, then raise `OUTPUT PRESSURE` once you trust the machine. It does not trust you.

---

## Live Demo

**→ [zazieproductions.github.io/index-organica](https://zazieproductions.github.io/index-organica/)**

AGON // Signal Engine is a **browser-based audiovisual synthesizer** built with **React, TypeScript, Canvas, and the Web Audio API**. It fuses an endless procedurally generated specimen archive (seeded RNG, SVG filter mutations, draggable retro-lab windows, a custom particle cursor) with a live subtractive synth: three detuned drone voices, a pink-noise bed, a waveshaper, a screaming resonant low-pass filter, an LFO, and a limiter so the whole thing doesn't eat your speakers.

**Audio starts only after you interact with the page** — browsers enforce autoplay restrictions, so the machine boots mute. Press **`▶ TRANSMIT`** in the `AGON // SIGNAL ENGINE` panel to arm the audio engine. Everything is synthesized in real time in your browser tab; nothing is recorded, nothing is sampled, nothing leaves the page.

## Operating the machine

| Control | Effect |
| --- | --- |
| `▶ TRANSMIT / ◼ KILL SIGNAL` | Arm or silence the audio engine |
| `1` – `8` | Strike the signal ladder (pitched transmissions) |
| `M` | Mutate the color organism — retunes the drone |
| `R` | Regenerate the archive from a new seed — emits a transmission |
| `A` | Toggle the Signal Engine panel |
| `C` | Open the Chromatic Organ (live color surgery) |
| `G` | Summon a rotating spatial relic |
| `S` / `D` | Freeze time / diagnostic vision |
| `+` / double-click | Spawn more windows from the archive |
| scroll | Descend. The archive continues. |

The synth panel exposes the raw organs: root drone, voice spread, filter aperture, resonant scream, LFO pulse & depth, drive/teeth, static bed, output pressure — with a live oscilloscope and spectrum analyser painted in the current theme.

## Running it locally

```bash
npm install
npm run dev      # development server
npm run build    # production build (single self-contained HTML file)
npm run preview  # serve the production build
```

## Deployment

Every push to `main` triggers [`deploy.yml`](.github/workflows/deploy.yml), which builds the project and publishes `dist/` to **GitHub Pages** at the URL above. Vite's `base` is set to `/index-organica/` so all assets resolve under the project path, and the build is inlined into a single HTML file (with a `404.html` fallback) — refreshing any route always resolves back into the machine.

## Social preview

A 1280×640 social card lives at [`docs/images/agon-social-preview.png`](docs/images/agon-social-preview.png).
GitHub cannot set this automatically — upload it manually via **Repository Settings → General → Social preview**.

---

<p align="center"><sub>⊛ ZAZIE PRODUCTIONS · SYS://organism · the archive is watching. it can also sing. ⊛</sub></p>
