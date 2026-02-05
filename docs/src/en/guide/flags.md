---
outline: deep
---

# Flags <VPBadge type="info" text="1.0.0+"/>

Flags are simple boolean markers that represent a certain state in your home.  
A flag is always either **on** (true) or **off** (false), and you can get, set, or toggle it from any flow.

Typical examples include:

- A **vacation** flag.
- A **guest mode** flag.
- A **quiet hours** flag.
- A **heating override** flag.

Flags make it easy to model small pieces of household state without needing variables or complex logic.

## How it works

A flag is a named state indicator.  
You set it to reflect the situation in your home, and your flows can react accordingly.

Flags are ideal for:

- Marking whether a situation is active.
- Representing temporary household states.
- Coordinating behavior across multiple flows.
- Providing a single source of truth for simple on/off conditions.

## Flow cards

These flow cards allow you to set, clear, toggle, or evaluate flags from within your flows, giving you a simple way to mark and use boolean state.

### Actions

<FlowCards>
    <FlowCardExplainer content="Activate a flag, but only if it is not already active.">
        <FlowCard type="action">Activate flag <strong>Partytime</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a flag for a specified duration, then automatically deactivate it.">
        <FlowCard type="action">Activate flag <strong>Guest mode</strong> for <strong>3</strong> <strong>hours</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivate a flag, but only if it is active.">
        <FlowCard type="action">Deactivate flag <strong>Cleaning</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Toggle a flag, regardless of its current state.">
        <FlowCard type="action">Toggle flag <strong>Vacation</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Check if a flag is active.">
        <FlowCard type="condition">Flag <strong>Cleaning</strong> is active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Check if a flag has been active for at least the specified duration.">
        <FlowCard type="condition">Flag <strong>Vacation</strong> is active for at least <strong>2</strong> <strong>days</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Check if a flag has been inactive for at least the specified duration.">
        <FlowCard type="condition">Flag <strong>Partytime</strong> is inactive for at least <strong>30</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when a flag is activated.">
        <FlowCard type="trigger">Flag <strong>Partytime</strong> is activated</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a flag is activated or deactivated.">
        <FlowCard type="trigger">Flag <strong>Vacation</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a flag is deactivated.">
        <FlowCard type="trigger">Flag <strong>Cleaning</strong> is deactivated</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Vacation mode**

Turn the “vacation” flag on when you leave home.  
Other flows can react by adjusting heating, disabling routines, or activating security automations.

### **Guest mode**

Use a “guest_mode” flag to temporarily override automations like motion lighting or door alerts.

### **Quiet hours**

Enable a “quiet_hours” flag at night to reduce notifications or dim lights.

## Notes

- Flags are global and can be used in any flow.
- Flags persist across reboots.
- Use descriptive names to keep your system organized.
- The duration-based conditions can be inverted (using the condition's invert option) to check for "less than" instead of "at least".
