# FlowBits — Homey App

FlowBits is a Homey SDK v3 app that provides flow automation primitives: flags, modes, sets, timers, cycles, labels, events, sliders, signals, and no-repeat windows. It has no device drivers — all functionality is exposed through flow cards and an API layer.

## Tech Stack

- **Language**: TypeScript (strict, `allowJs: false`)
- **Runtime**: Node 22 (Homey SDK v3, `>=12.4.0`)
- **Package manager**: Bun
- **Build**: `tsc` → `.homeybuild/`
- **Shared library**: `@basmilius/homey-common` (base classes, decorators, utilities)
- **Settings UI**: Vue.js app in `settings-ui/`, compiled output in `settings/`
- **Documentation**: VitePress site in `docs/`

## Commands

| Command | Description |
|---|---|
| `bun run build` | Compile TypeScript to `.homeybuild/` |
| `homey app build` | **Validation step** — always run before marking work as done |
| `homey app run` | Run the app on a connected Homey |
| `bun run docs:dev` | Start VitePress dev server |

## Project Structure

```
app.ts                  → Entry point, re-exports src/index.ts
api.ts                  → API endpoint handlers (root level)
src/
├── index.ts            → FlowBitsApp class (extends App<FlowBitsApp>)
├── types.ts            → All type definitions (Feature, Styleable, entity types)
├── const.ts            → Constants (SETTING_*, REALTIME_*, MAX_TIMEOUT_MS)
├── brain/              → Business logic modules
│   ├── brain.ts        → Brain class, aggregates all feature modules
│   ├── api.ts          → Api class, delegates to feature modules
│   ├── flags.ts        → Flag management
│   ├── modes.ts        → Mode management
│   ├── timers.ts       → Timer scheduling with pause/resume
│   ├── sets.ts         → BitSet state management
│   ├── events.ts       → Event occurrence tracking
│   ├── labels.ts       → Text value storage
│   ├── cycles.ts       → Step sequence counters
│   ├── sliders.ts      → Numeric value sliders
│   ├── signals.ts      → Inter-flow signal sending
│   ├── noRepeat.ts     → Debounce/no-repeat windows
│   ├── tokens.ts       → Flow token management
│   └── widgets.ts      → Widget data management
├── flow/
│   ├── action/         → Action card implementations
│   ├── condition/      → Condition card implementations
│   ├── trigger/        → Trigger card implementations
│   ├── autocomplete/   → Autocomplete argument providers
│   └── index.ts        → Barrel: Actions, Conditions, Triggers, AutocompleteProviders
├── util/               → Pure utility functions
└── data/               → Static data (facts, school holidays)
.homeycompose/
├── app.json            → Source app manifest (never edit root app.json)
├── flow/
│   ├── actions/        → Flow card JSON definitions
│   ├── conditions/
│   └── triggers/
└── locales/            → Translation files (13 languages)
widgets/                → Widget definitions (10 widgets)
```

## Architecture

### Brain Pattern
`FlowBitsApp` owns a single `Brain` instance. `Brain` aggregates all feature modules (Flags, Modes, Timers, etc.) and exposes them via getters. Each module extends `Shortcuts<FlowBitsApp>` for access to `this.app`, `this.homey`, `this.settings`, `this.log`, etc.

### Feature Interface
All data modules implement `Feature<T>`:
```typescript
interface Feature<TInstance> {
    cleanup(): Promise<void>;
    count(): Promise<number>;
    find(name: string): Promise<TInstance | null>;
    findAll(): Promise<TInstance[]>;
}
```

Modules with visual customization also implement `Styleable` (manages `Look` tuples of `[color, icon]`).

### Persistence
Data is stored via Homey's settings API using prefixed keys defined in `src/const.ts` (e.g. `SETTING_FLAGS`, `SETTING_TIMER_PREFIX`). There is no database.

### Realtime Events
Modules broadcast state changes via `this.realtime(REALTIME_*_UPDATE, data)` so the settings UI and widgets stay in sync.

## Flow Cards

Each flow card has **two parts**:
1. **JSON definition** in `.homeycompose/flow/{actions,conditions,triggers}/` — defines title, args, hints in all 13 languages
2. **TypeScript implementation** in `src/flow/{action,condition,trigger}/`

### Adding a New Flow Card

**1. Create the JSON definition** (e.g. `.homeycompose/flow/actions/flag_example.json`):
```json
{
    "id": "flag_example",
    "title": { "en": "Example action", "nl": "Voorbeeld actie", ... },
    "titleFormatted": { "en": "Do [[flag]] example", ... },
    "hint": { "en": "Description of what it does.", ... },
    "args": [
        {
            "type": "autocomplete",
            "name": "flag",
            "title": { "en": "Flag", "nl": "Flag", ... }
        }
    ]
}
```

**2. Create the TypeScript implementation** (e.g. `src/flow/action/flagExample.ts`):
```typescript
import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('flag_example')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('flag', AutocompleteProviders.Flag);
        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        // Implementation
    }
}

type Args = {
    readonly flag: { readonly name: string };
};
```

**3. Export from the barrel** (`src/flow/action/index.ts`):
```typescript
export { default as FlagExample } from './flagExample';
```

**4. Register in `FlowBitsApp`** (`src/index.ts`):
```typescript
this.registry.action(Actions.FlagExample);
```

### Flow Card Types

| Type | Decorator | Base Class | Return |
|---|---|---|---|
| Action | `@action('id')` | `FlowActionEntity<App, Args>` | `void` |
| Condition | `@condition('id')` | `FlowConditionEntity<App, Args, State>` | `boolean` |
| Trigger | `@trigger('id')` | `FlowTriggerEntity<App, Args, State>` | `boolean` (match) |
| Autocomplete | `@autocomplete('id')` | `FlowAutocompleteArgumentProvider<App>` | `Results[]` |

Simple math actions use `this.registry.actionFunction<Args>('id', fn)` inline in `src/index.ts` instead of separate files.

## Code Conventions

- **Private fields**: use `#` prefix (`#brain`, `#timers`)
- **Readonly**: prefer `readonly` on type properties and class fields
- **Default exports**: flow card files and brain modules use `export default class`
- **Barrel exports**: `index.ts` files re-export with named exports (`export { default as FlagActivate }`)
- **Namespace-style exports**: `export * as Actions from './action'`
- **Types**: local `Args` and `State` types at bottom of each flow card file
- **Constants**: `UPPER_SNAKE_CASE` in `src/const.ts`
- **Naming**: PascalCase classes, camelCase methods/properties, snake_case flow card IDs
- **Imports**: use `.js` extensions in import paths (TypeScript compiles to JS)

## Localization

13 languages: `en`, `nl`, `de`, `fr`, `it`, `sv`, `no`, `es`, `da`, `ru`, `pl`, `ko`, `ar`.

- **Translations live in** `.homeycompose/locales/`
- **Flow card titles/hints** are translated inline in each card's JSON definition
- All 13 languages must be present in every flow card JSON and locale file

## API Endpoints

Defined in root `api.ts` as exported async functions. Each receives `ApiRequest<FlowBitsApp, Body>` and delegates to `app.api.*` methods. The API class (`src/brain/api.ts`) wraps the brain modules for external consumption.

## Widgets

10 widgets in `widgets/` with their own HTML/JS/CSS. They communicate with the app via the realtime event system and API endpoints.
