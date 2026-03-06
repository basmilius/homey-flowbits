---
outline: deep
---

# Modes <VPBadge type="info" text="1.0.0+"/>

Modes let you define named states that describe how your home should behave.  
A mode is a label such as *Home*, *Away*, *Night*, or *Party*, and flows can set or react to the current mode.

Modes are ideal for representing broad household situations that influence multiple automations at once.

## How it works

Only one mode can be active at a time.  
Switching to a new mode immediately replaces the previous one.

Modes are useful for:

- Adjusting lighting, heating, or notifications based on context
- Creating consistent behavior across different rooms
- Simplifying complex logic by grouping conditions under a single name
- Making your automations easier to understand and maintain

Modes are not tied to any specific device. They represent the state of your home as a whole.

## Flow cards

These flow cards let you manage modes directly from your flows, enabling you to activate, deactivate, toggle, or check any mode.

### Actions

<FlowCards>
    <FlowCardExplainer content="Activate a mode, but only if it's not already active.">
        <FlowCard type="action">Activate <strong>Morning</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a mode for a specified duration, then automatically deactivate it. Deactivates all other modes.">
        <FlowCard type="action">Activate <strong>Dinner</strong> for <strong>1</strong> <strong>hour</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivate a mode, but only if it's active.">
        <FlowCard type="action">Deactivate <strong>Night</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Reactivate a mode, even if it's already active. This will trigger any flows that have the mode activated trigger.">
        <FlowCard type="action">Reactivate <strong>Dinner</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Reactivate the currently active mode. This will trigger any flows that have the mode activated trigger for the current mode.">
        <FlowCard type="action">Reactivate current mode</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Toggle a mode, regardless of its current state.">
        <FlowCard type="action">Toggle <strong>Evening</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if a mode is active.">
        <FlowCard type="condition"><strong>Night</strong> is active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if a mode has been active for at least the specified duration.">
        <FlowCard type="condition"><strong>Away</strong> is active for at least <strong>4</strong> <strong>hours</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if a mode has been inactive for at least the specified duration.">
        <FlowCard type="condition"><strong>Morning</strong> is inactive for at least <strong>1</strong> <strong>hour</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if any mode is currently active.">
        <FlowCard type="condition">Any mode is active</FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when a mode is activated.">
        <FlowCard type="trigger"><strong>Evening</strong> is activated</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a mode is activated or deactivated.">
        <FlowCard type="trigger"><strong>Night</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a mode is deactivated.">
        <FlowCard type="trigger"><strong>Morning</strong> is deactivated</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Home / Away**

Switch to *Away* when everyone leaves the house.  
Flows can react by lowering heating, turning off lights, and arming alarms.

### **Night**

Switch to *Night* to dim lights, lock doors automatically, or silence notifications.

### **Party**

Activate *Party* mode for special lighting scenes or extended music playback.

## Notes

- Modes are mutually exclusive: only one can be active at any time.
- Flows can both change modes and react to them.
- Use clear names to keep your automation logic readable.
- The duration-based conditions can be inverted (using the condition's invert option) to check for "less than" instead of "at least".
