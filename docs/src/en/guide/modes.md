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

Inside a group the rules are the same as before: only one mode can be active at a time, and switching replaces the previous one.

Every mode card has a grouped counterpart that takes a group as its first argument. Type a new group name into the group field to create it, the same way you create a mode.

<FlowCards>
    <FlowCardExplainer content="Activate a mode inside a group. The other groups keep whatever mode they had.">
        <FlowCard type="action">Activate <strong>Evening</strong> in <strong>Lighting</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activate a mode in a group for a while, then revert to the mode that was active before.">
        <FlowCard type="action">Activate <strong>Away</strong> in <strong>House state</strong> for <strong>2</strong> <strong>hours</strong> and revert</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks the mode of one group, ignoring the others.">
        <FlowCard type="condition"><strong>Sleeping</strong> is active in <strong>Lighting</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the mode of one group changes. The mode token holds the new mode.">
        <FlowCard type="trigger">The current mode changed in <strong>Lighting</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

The cards without a group field keep working as they always have. They act on the modes that are not in a group, which is where your existing modes live. Nothing needs to move.

Colors and icons are set per group in the app settings, so the same mode name can look different in two groups. The Modes and Current mode widgets each take a group in their settings; leave it empty for the ungrouped modes.

## Tags

FlowBits keeps a global tag with the current mode, so you can use it in any flow card, for example to write it to a log or include it in a notification.

- **Current mode** holds the mode that is active outside a group.
- **Current mode (*group*)** holds the mode that is active in that group. There is one for every group that is used on a flow card.

When no mode is active, the tag holds `-`. The tags are updated before any mode trigger fires, so a flow started by a mode change already sees the new mode.

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
