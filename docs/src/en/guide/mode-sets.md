---
outline: deep
---

# Mode sets <VPBadge type="info" text="1.20.0+"/>

Mode sets let you define named groups of modes, so that Modes can be used for more than one aspect of your home at once.
Where a regular mode is global, a mode set groups related modes together — for example a *House state* set with modes like *Home*, *Away*, *Night*, and a separate *Lighting* set with modes like *Sleeping*, *Evening*, *Daytime*.

Mode sets are ideal for representing multiple, independent household situations that each influence their own automations.

## How it works

Within a mode set, only one mode can be active at a time.
Activating a mode in a mode set deactivates all other modes in that same set, but has no effect on modes in other sets.

Mode sets are useful for:

- Adjusting lighting, heating, or notifications based on multiple independent contexts
- Creating consistent behavior across different rooms or areas
- Simplifying complex logic by grouping conditions under a single named set
- Making your automations easier to understand and maintain when a single "mode" isn't enough

Like regular modes, mode sets are not tied to any specific device. They represent one aspect of the state of your home.

## Flow cards

These flow cards let you manage modes within a mode set directly from your flows, enabling you to activate, deactivate, toggle, or check any mode in any set. Wherever a mode set argument is used, you can enter a new value or select an existing one, just like any other argument.

### Actions

<FlowCards>
    <FlowCardExplainer content="Activate a mode within a mode set, but only if it's not already active. Deactivates all other modes in that set.">
        <FlowCard type="action">Activate <strong>Away</strong> in mode set <strong>House state</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a mode within a mode set for a specified duration, then automatically deactivate it. Deactivates all other modes in that set.">
        <FlowCard type="action">Activate <strong>Evening</strong> in mode set <strong>Lighting</strong> for <strong>2</strong> <strong>hours</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivate a mode within a mode set, but only if it's active.">
        <FlowCard type="action">Deactivate <strong>Night</strong> in mode set <strong>House state</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Reactivate a mode within a mode set, even if it's already active. This will trigger any flows that have the mode activated trigger.">
        <FlowCard type="action">Reactivate <strong>Sleeping</strong> in mode set <strong>Lighting</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Reactivate the currently active mode within a mode set. This will trigger any flows that have the mode activated trigger for the current mode.">
        <FlowCard type="action">Reactivate current mode in mode set <strong>House state</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Toggle a mode within a mode set, regardless of its current state.">
        <FlowCard type="action">Toggle <strong>Daytime</strong> in mode set <strong>Lighting</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if a mode within a mode set is active.">
        <FlowCard type="condition"><strong>Night</strong> in mode set <strong>House state</strong> is active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if a mode within a mode set has been active for at least the specified duration.">
        <FlowCard type="condition"><strong>Away</strong> in mode set <strong>House state</strong> is active for at least <strong>4</strong> <strong>hours</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if a mode within a mode set has been inactive for at least the specified duration.">
        <FlowCard type="condition"><strong>Evening</strong> in mode set <strong>Lighting</strong> is inactive for at least <strong>1</strong> <strong>hour</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if any mode is currently active within a mode set.">
        <FlowCard type="condition">Any mode is active in mode set <strong>House state</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when a mode within a mode set is activated.">
        <FlowCard type="trigger"><strong>Evening</strong> in mode set <strong>Lighting</strong> is activated</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a mode within a mode set is activated or deactivated.">
        <FlowCard type="trigger"><strong>Night</strong> in mode set <strong>House state</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a mode within a mode set is deactivated.">
        <FlowCard type="trigger"><strong>Sleeping</strong> in mode set <strong>Lighting</strong> is deactivated</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the current mode within a mode set changes, useful for reading the new mode from a token.">
        <FlowCard type="trigger">The current mode in mode set <strong>House state</strong> changed</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Flow tokens

Every mode set exposes its own global flow token, **Mode set current mode (<em>set name</em>)**, which always holds the name of the currently active mode in that set (or `-` when no mode is active). Unlike the trigger tokens above, this token is available in any flow card that accepts tokens, not just ones following the "current mode changed" trigger.

The token is created automatically the first time a mode set is used in a flow, and removed again if the mode set is no longer referenced anywhere.

## Examples

### **House state / Lighting**

Use a *House state* set with modes *Home*, *Away*, *Night* to drive alarm and heating flows, and a separate *Lighting* set with modes *Sleeping*, *Evening*, *Daytime* to drive light scenes — independently of each other.

### **Per-room presets**

Create a mode set per room (`Living room`, `Bedroom`) each with modes like *Relax*, *Focus*, *Movie*, so every room can be in its own mode without interfering with the others.

## Notes

- Modes within the same mode set are mutually exclusive: only one can be active at any time.
- Modes in different mode sets are fully independent from each other.
- Use clear names for both the mode set and its modes to keep your automation logic readable.
- The duration-based conditions can be inverted (using the condition's invert option) to check for "less than" instead of "at least".
- Customize mode icons and colors per mode set from app settings for better visualization.
