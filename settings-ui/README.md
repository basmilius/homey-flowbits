# Settings UI

This is a Vue 3 + TypeScript application for the FlowBits settings page.

## Development

```bash
bun install
bun run dev
```

## Building

The build output is directed to the `../settings` directory:

```bash
bun run build
```

This will:
- Compile the Vue + TypeScript application
- Bundle all dependencies (including Vue) for offline use
- Output to `/settings` directory with relative paths
- Include all necessary assets

## Structure

- `src/main.ts` - Application entry point
- `src/App.vue` - Main application component
- `src/components/` - Reusable Vue components (TypeScript)
- `src/composables/` - Vue composables for data management (TypeScript)
- `src/assets/` - CSS and static assets

## Code Style

- **Language**: TypeScript
- **Indentation**: 4 spaces
- **Package Manager**: Bun

## Features

- Fully offline-capable (all dependencies bundled)
- Edit colors and icons for:
    - Modes
    - Flags
    - Timers
    - Labels
    - Events
    - Sets
- View statistics
- Responsive UI using Homey styling
