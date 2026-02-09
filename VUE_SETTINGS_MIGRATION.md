# Vue Settings UI Migration

## Overview

The FlowBits settings page has been migrated from a single-file Vue application (using CDN) to a modern Vue 3 project with Vite, supporting fully offline operation.

## What Changed

### Before
- Single HTML file with inline Vue app
- Vue.js loaded from CDN (required internet)
- 1,016 lines of JavaScript in one file
- Styles in separate CSS file

### After
- Modern Vue 3 project with Vite
- All dependencies bundled (works offline)
- Modular component architecture
- Source code in `settings-ui/`
- Built output in `settings/`

## Project Structure

```
settings-ui/
├── README.md                      # Project documentation
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Build configuration
├── index.html                     # HTML template
└── src/
    ├── main.js                    # Application entry point
    ├── App.vue                    # Main application component
    ├── assets/
    │   ├── style.css              # Main styles
    │   └── app/                   # Homey base styles and icons
    ├── components/
    │   ├── CategorySection.vue    # Reusable category list
    │   ├── EditDialog.vue         # Color/icon editor modal
    │   └── Statistics.vue         # Usage statistics display
    └── composables/
        └── useHomeyApi.js         # API data management

settings/                          # Build output (deployed to Homey)
├── index.html                     # Compiled HTML
└── assets/
    ├── index-[hash].js            # Bundled JavaScript (~74KB)
    ├── index-[hash].css           # Bundled CSS (~6KB)
    └── icons-[hash].woff2         # Icon font (~469KB)
```

## Building

### Development
```bash
cd settings-ui
npm install
npm run dev
```

### Production Build
```bash
# From project root
npm run build:settings

# Or from settings-ui directory
cd settings-ui
npm run build
```

The build process:
1. Compiles Vue components to JavaScript
2. Bundles all dependencies (including Vue 3)
3. Optimizes and minifies code
4. Outputs to `../settings/` directory
5. Uses relative paths for offline compatibility

## Configuration

### .homeyignore
Added `settings-ui/` to prevent the source code from being included in the Homey app package.

### .gitignore
Added:
- `/settings-ui/node_modules` - Dependencies
- `/settings-ui/dist` - Build artifacts (though we build to ../settings)

### package.json
Added script: `"build:settings": "cd settings-ui && npm install && npm run build"`

## Features Preserved

All original functionality has been maintained:

✅ **Edit Modes** - Change color and icon for modes
✅ **Edit Flags** - Change color and icon for flags  
✅ **Edit Timers** - Change color and icon for timers
✅ **Edit Labels** - Change color and icon for labels
✅ **Edit Events** - Change color and icon for events
✅ **Edit Sets** - Change color and icon for sets
✅ **Statistics** - View usage statistics
✅ **Card Statistics** - View flow card usage

## Technical Details

### Vue 3 Features Used
- Composition API (setup script)
- Single File Components (SFC)
- Reactive refs and computed
- Component communication (props/emits)

### Vite Configuration
- `base: './'` - Use relative paths for offline compatibility
- `outDir: '../settings'` - Output to Homey settings directory
- `emptyOutDir: true` - Clean build directory

### Homey Integration
- Listens for `onHomeyReady` callback
- Uses Homey API for data operations
- Integrates with Homey translation system
- Follows Homey UI styling conventions

## Bundle Size

| Asset | Size | Gzipped |
|-------|------|---------|
| JavaScript | 74.32 KB | 28.07 KB |
| CSS | 6.23 KB | 1.82 KB |
| Icon Font | 468.85 KB | N/A |
| **Total** | **549.40 KB** | **29.89 KB** |

All assets are bundled locally, no CDN required.

## Development Workflow

1. **Make changes** in `settings-ui/src/`
2. **Test locally** with `npm run dev` (from settings-ui/)
3. **Build for production** with `npm run build:settings` (from root)
4. **Verify** the output in `settings/` directory
5. **Test in Homey** environment

## Migration Notes

### API Calls
All Homey API calls are preserved:
- `GET /colors` - Fetch available colors
- `GET /icons` - Fetch available icons
- `GET /modes` - Fetch modes
- `GET /flags` - Fetch flags
- `GET /timers` - Fetch timers
- `GET /labels` - Fetch labels
- `GET /events` - Fetch events
- `GET /sets` - Fetch sets
- `GET /statistics` - Fetch statistics
- `POST /{type}s/look` - Update color/icon

### Styling
- All Homey base styles preserved
- Icon font included in bundle
- CSS scoped to components where appropriate
- Global styles in `assets/style.css`

### Internationalization
Uses Homey's `Homey.__()` function for translations, accessed via:
```javascript
app.config.globalProperties.t = (key) => Homey.__(key)
```

## Troubleshooting

### Build Fails
- Ensure `settings-ui/node_modules` exists (run `npm install`)
- Check Node.js version (requires Node 18+)

### Settings Don't Load
- Verify `/homey.js` is available
- Check browser console for errors
- Ensure `onHomeyReady` callback is triggered

### Assets Not Found
- Verify relative paths in build output
- Check `vite.config.js` has `base: './'`

## Future Enhancements

Possible improvements:
- Add TypeScript for type safety
- Add unit tests with Vitest
- Add E2E tests with Playwright
- Split larger components further
- Add loading states
- Add error handling UI
