---
outline: deep
---

# Labels <VPBadge type="info" text="1.7.0+"/>

Labels let you store and retrieve custom text values in your flows.  
A label is a named container that holds a single string value, which you can set, check, or clear from any flow.

Labels are ideal for passing dynamic information between flows or storing state that doesn't fit into simple on/off logic.

## How it works

Each label stores one text value at a time.  
Setting a new value replaces the previous one. You can also clear a label to remove its value entirely.

Labels are useful for:

- Storing the last person who triggered a motion sensor
- Keeping track of which device was used most recently
- Passing messages or context between different flows
- Creating dynamic notifications based on stored information

Labels are not tied to any specific device. They hold arbitrary text values you define.

## Flow cards

These flow cards let you set, clear, and check labels directly from your flows.

### Actions

<FlowCards>
    <FlowCardExplainer content="Set a label to a specific text value.">
        <FlowCard type="action">Set label <strong>Last Motion</strong> to <strong>Living Room</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Clear a label, removing its stored value.">
        <FlowCard type="action">Clear label <strong>Last Motion</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if a label has a specific value.">
        <FlowCard type="condition">Label <strong>Last Motion</strong> has value <strong>Kitchen</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when a label is set to a specific value.">
        <FlowCard type="trigger">Label <strong>Active Room</strong> becomes <strong>Bedroom</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers only when a label's value is set. Does not trigger when the label is cleared. Provides the new value as a token.">
        <FlowCard type="trigger">Label <strong>Current User</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers only when a label is cleared (value removed).">
        <FlowCard type="trigger">Label <strong>Current User</strong> is cleared</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a label's value is set or when it is cleared. Provides the new value as a token, or the literal string '-' when the label is cleared. Use this if you need to react to any change, including clears.">
        <FlowCard type="trigger">Label <strong>Current User</strong> changed or cleared</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Track last motion location**

When motion is detected in any room, set a label to the room name. Other flows can then use this information to determine where someone is.

### **Dynamic greetings**

Store the name of the last person who arrived home. Use this label in a greeting notification to personalize the message.

### **Device context**

Track which remote or button was pressed last. Use this information to determine which device should respond to a follow-up action.

## Notes

- Labels store text values only—use sliders for numeric values.
- Clearing a label removes its value; it will no longer pass the "has value" condition.
- Use descriptive names to keep your automations easy to understand.
