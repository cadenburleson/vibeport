# VibePort

A lightweight desktop app that auto-discovers dev servers running on your local ports and gives you a clean UI to monitor and manage them.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_v2-FFC131?style=flat&logo=tauri&logoColor=black)
![License](https://img.shields.io/github/license/cadenburleson/vibeport)

## Features

- **Auto-discovery** — finds dev servers listening on local ports
- **Start/Stop** — manage services directly from the UI
- **Memory details** — click to see RSS vs Virtual memory breakdown
- **Hide services** — declutter your view, hidden services sort to the bottom
- **Smart dedup** — collapses parent/worker processes on the same port

## Install

### Download (macOS Apple Silicon)

Grab the latest `.dmg` from [Releases](https://github.com/cadenburleson/vibeport/releases/latest), open it, and drag VibePort to your Applications folder.

### Build from source

Requires [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/cadenburleson/vibeport.git
cd vibeport
npm install
npm run tauri build
```

The built app will be at `src-tauri/target/release/bundle/macos/VibePort.app`.

## Development

```bash
npm install
npm run tauri dev
```

## Tech Stack

- **Tauri v2** (Rust) — port scanning, process management
- **React + TypeScript** — frontend
- **Vite** — bundler
- **ShadCN UI + Tailwind CSS v4** — styling

## License

MIT
