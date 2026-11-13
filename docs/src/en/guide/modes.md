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

## Groups <VPBadge type="info" text="1.20.0+"/>

A group holds its own modes, and every group runs independently of the others. One group can track *Home/Away/Night* while another tracks *Sleeping/Evening/Daytime*, without the two ever cancelling each other out.

Inside a group the rules are the same as before. Only one mode can be active at a time, and switching replaces the previous one.

### When to use a group

Without groups, every mode competes with every other mode. That works as long as your modes describe one thing. It breaks down once you want to track two things at the same time. Say you have *Home* and *Away* for presence, and *Day* and *Night* for the time of day. Activating *Night* would deactivate *Home*, and your presence flows would think nobody is home.

Put each of those questions in its own group, and they stop getting in each other's way:

| Group    | Modes                       |
|----------|-----------------------------|
| Presence | Home, Away, Vacation        |
| Daypart  | Morning, Day, Evening, Night |

A good rule of thumb: if two modes can be true at the same time, they belong in different groups.

### Creating a group

There is no separate step. Every grouped card has a group field as its first argument. Type a new name into that field and the group exists, the same way you create a mode by typing its name. The modes you activate in that group belong to it from then on.

Mode names are scoped to their group. *Night* in *Daypart* and *Night* in *Heating* are two different modes, each with its own state.

### Grouped flow cards

Every mode card has a grouped counterpart that ends with *in [group]*. They behave like the regular cards, but only look at the modes of that one group.

<FlowCards>
    <FlowCardExplainer content="Activate a mode inside a group. The other groups keep whatever mode they had.">
        <FlowCard type="action">Activate <strong>Evening</strong> in <strong>Daypart</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivate a mode inside a group, leaving the group without an active mode.">
        <FlowCard type="action">Deactivate <strong>Away</strong> in <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a mode for a while. When the time is up, the mode is deactivated.">
        <FlowCard type="action">Activate mode <strong>Guests</strong> for <strong>3</strong> <strong>hours</strong> in <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a mode for a while, then return to the mode that was active before.">
        <FlowCard type="action">Activate mode <strong>Away</strong> for <strong>2</strong> <strong>hours</strong>, then revert in <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Run the activation triggers of the current mode of a group again, for example after a restart.">
        <FlowCard type="action">Reactivate current mode in <strong>Daypart</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks the mode of one group, ignoring the others.">
        <FlowCard type="condition">Mode <strong>Night</strong> is active in <strong>Daypart</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks whether a group has an active mode at all.">
        <FlowCard type="condition">Any mode is active in <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks how long a mode has been active within its group.">
        <FlowCard type="condition">Mode <strong>Away</strong> is active for at least <strong>4</strong> <strong>hours</strong> in <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a specific mode in a group is activated.">
        <FlowCard type="trigger">Mode <strong>Evening</strong> is activated in <strong>Daypart</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers whenever a group switches to another mode. The mode token holds the new mode.">
        <FlowCard type="trigger">The current mode changed in <strong>Daypart</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

The toggle, reactivate, deactivated, changed and inactive-for cards also have a grouped version.

### Your existing modes

The cards without a group field keep working as they always have. They act on the modes that are not in a group, which is where all modes created before 1.20.0 live. Nothing needs to move, and you can add groups next to them whenever you need one.

There is no way to move an ungrouped mode into a group. To start using a group for modes you already have, switch your flows to the grouped cards and pick the group in each of them.

### Colors, icons and widgets

Colors and icons are set per group in the app settings, so the same mode name can look different in two groups.

The Modes and Current mode widgets each take a group in their settings. Leave it empty to show the ungrouped modes. Add one widget per group to see all of them on your dashboard.

::: tip
The [Modes in groups](/examples/modes-in-groups) example builds a presence group and a daypart group side by side, step by step.
:::

## Examples

### **Home / Away**

Switch to *Away* when everyone leaves the house.  
Flows can react by lowering heating, turning off lights, and arming alarms.

### **Night**

Switch to *Night* to dim lights, lock doors automatically, or silence notifications.

### **Party**

Activate *Party* mode for special lighting scenes or extended music playback.

## Notes

- Modes are mutually exclusive within their group: only one can be active at any time.
- Groups are independent: a mode in one group never deactivates a mode in another.
- Flows can both change modes and react to them.
- Use clear names to keep your automation logic readable.
- The duration-based conditions can be inverted (using the condition's invert option) to check for "less than" instead of "at least".
