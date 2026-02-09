# Settings UI

This is a Vue 3 application for the FlowBits settings page.

## Development

```bash
npm install
npm run dev
```

## Building

The build output is directed to the `../settings` directory:

```bash
npm run build
```

This will:
- Compile the Vue application
- Bundle all dependencies (including Vue) for offline use
- Output to `/settings` directory with relative paths
- Include all necessary assets

## Structure

- `src/main.js` - Application entry point
- `src/App.vue` - Main application component
- `src/components/` - Reusable Vue components
- `src/composables/` - Vue composables for data management
- `src/assets/` - CSS and static assets

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
