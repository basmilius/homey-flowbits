# Refactoring Opportunities

This document outlines code patterns that could be simplified in future refactoring efforts.

## 1. Flow Action Files (42 files, ~1,000 LOC)

### Pattern: Simple CRUD Operations

Many action files follow nearly identical patterns:

**Example: Activate actions**
- `src/flow/action/flagActivate.ts`
- `src/flow/action/modeActivate.ts`
- `src/flow/action/setActivateState.ts`

All follow this structure:
```typescript
@action('entity_action')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('entity', AutocompleteProviders.Entity);
        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.entities.action(args.entity.name);
    }

    async onUpdate(): Promise<void> {
        await this.app.entities.update();
        await super.onUpdate();
    }
}
```

**Similar patterns exist for:**
- Deactivate actions (flagDeactivate, modeDeactivate, setDeactivateState)
- Toggle actions (flagToggle, modeToggle, setToggleState)
- Timed actions (flagActivateFor, modeActivateFor, setActivateStateFor)

### Refactoring Approach

Consider creating a factory function or generic class:

```typescript
function createSimpleAction<T>(
    actionId: string,
    entityType: string,
    method: string,
    autocompleteProvider: AutocompleteProvider
) {
    @action(actionId)
    return class extends FlowActionEntity<FlowBitsApp, T> {
        async onInit(): Promise<void> {
            this.registerAutocomplete(entityType, autocompleteProvider);
            await super.onInit();
        }

        async onRun(args: T): Promise<void> {
            await this.app[entityType][method](args[entityType].name);
        }

        async onUpdate(): Promise<void> {
            await this.app[entityType].update();
            await super.onUpdate();
        }
    };
}
```

**Estimated reduction:** ~600-800 lines of code

## 2. Flow Condition Files (29 files, ~700 LOC)

Similar patterns exist in condition files:

- `src/flow/condition/flagIs.ts`
- `src/flow/condition/modeIs.ts`
- `src/flow/condition/eventHappened.ts`

These also follow predictable patterns that could be generated from configuration.

**Estimated reduction:** ~400-500 lines of code

## 3. Widget API Duplication

### Modes vs Flags Widgets

The following widget pairs are nearly identical (only entity names differ):

**widgets/flags/api.ts vs widgets/modes/api.ts**
```diff
- export async function list(...): Promise<Flag[]> {
+ export async function list(...): Promise<Mode[]> {
-     return await app.api.getFlags();
+     return await app.api.getModes();
  }

- export async function toggle(..., body): Promise<boolean> {
+ export async function toggle(..., body): Promise<boolean> {
-     return await app.api.toggleFlag(body.flag);
+     return await app.api.toggleMode(body.mode);
  }
```

**HTML files** (widgets/*/public/index.html) also follow identical patterns:
- Different entity names (flags vs modes vs sets)
- Same event handling structure
- Same DOM manipulation logic

### Refactoring Approach

Create a generic widget template or factory:

```typescript
export function createToggleWidget<T>(config: {
    entityType: string;
    getMethod: string;
    toggleMethod: string;
    eventName: string;
}) {
    return {
        async list({homey: {app}}: WidgetApiRequest<FlowBitsApp>): Promise<T[]> {
            return await app.api[config.getMethod]();
        },
        async toggle({homey: {app}, body}: WidgetApiRequest<FlowBitsApp, any>): Promise<boolean> {
            return await app.api[config.toggleMethod](body[config.entityType]);
        }
    };
}
```

**Estimated reduction:** ~150-200 lines across widget files

## 4. Locale Files (.homeycompose/locales/)

11 JSON files containing translations for all flows. These are part of the Homey framework and should remain as-is, but note:

- Total: ~120 files in .homeycompose/
- These are SOURCE files (app.json is GENERATED from them)
- Required by Homey app development process

## Total Potential Reduction

Through factory pattern refactoring:
- **Flow actions:** ~800 lines
- **Flow conditions:** ~500 lines  
- **Widget APIs:** ~200 lines
- **Total:** ~1,500 lines of boilerplate code

## Implementation Considerations

⚠️ **Important:** These refactorings should be done carefully:

1. **Type Safety:** Ensure TypeScript types are properly maintained
2. **Testing:** Full test coverage required before and after
3. **Decorators:** The `@action`, `@condition` decorators must work with factory pattern
4. **Homey Framework:** Changes must be compatible with Homey app requirements
5. **Incremental:** Refactor one pattern at a time, verify functionality

## Already Completed Simplifications

✅ **Removed icons.ts** (26 lines)
   - Build script with hardcoded local path
   - One-time use, output already committed

✅ **Replaced vendored Vue.js** (681KB → CDN link)
   - Removed 18,324 lines from repository
   - Now uses unpkg CDN for Vue 3.5.24
