# VibePort

Local dev server manager — auto-discovers dev servers running on local ports, filters out system processes, and provides a visual UI to start/stop services and view their commands.

## Tech Stack

- **Tauri v2** (Rust backend) — port scanning, process management
- **React 18 + TypeScript** — frontend UI
- **Vite** — bundler
- **ShadCN UI + Tailwind CSS v4** — component library & styling

## Development

```bash
npm install
npm run tauri dev
```

## Docker (Build Environment)

```bash
docker compose run build
```

## License

MIT
