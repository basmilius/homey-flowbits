---
outline: deep
---

# Events <VPBadge type="info" text="1.7.0+"/>

Events let you track when something happens in your home.  
Unlike flags or modes, events maintain a history—you can check whether an event happened today, within a certain time window, or a specific number of times.

Events are ideal for tracking occurrences that you want to analyze over time, such as motion detections, door openings, or custom triggers.

## How it works

When an event is triggered, a timestamped entry is added to its history.  
You can then check this history using various conditions to build smarter automations.

Events are useful for:

- Limiting actions based on how often something has happened
- Detecting patterns like "door opened three times in 5 minutes"
- Checking if something happened at all today
- Building conditional logic based on recent activity

Events are not tied to any specific device. They track custom occurrences you define.

## Flow cards

These flow cards let you trigger, clear, and check events directly from your flows.

### Actions

<FlowCards>
    <FlowCardExplainer content="Trigger an event, adding a new timestamped entry to its history.">
        <FlowCard type="action">Trigger event <strong>Doorbell Pressed</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Trigger an event with a value, adding a new timestamped entry to its history. The value is available as a tag in the trigger.">
        <FlowCard type="action">Trigger event <strong>Doorbell Pressed</strong> with value <strong>Front door</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Clear all stored history for a specific event.">
        <FlowCard type="action">Clear event <strong>Motion Detected</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Clear the history of all events at once.">
        <FlowCard type="action">Clear all events</FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if the event has ever happened (has any history).">
        <FlowCard type="condition">Event <strong>Doorbell Pressed</strong> happened</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the event happened at least once today.">
        <FlowCard type="condition">Event <strong>Mail Delivered</strong> happened today</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the event happened within a specific time window.">
        <FlowCard type="condition">Event <strong>Motion Detected</strong> happened within <strong>10</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the event happened a specific number of times today.">
        <FlowCard type="condition">Event <strong>Door Opened</strong> happened <strong>3</strong> times today</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the event happened a specific number of times within a time window.">
        <FlowCard type="condition">Event <strong>Button Pressed</strong> happened <strong>5</strong> times within <strong>1</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when an event is triggered. If the event was triggered with a value, it is available as the 'Event value' tag.">
        <FlowCard type="trigger">Event <strong>Doorbell Pressed</strong> is triggered</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when an event's history is cleared.">
        <FlowCard type="trigger">Event <strong>Motion Detected</strong> is cleared</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Limit notifications**

Only send a notification if the doorbell hasn't been pressed in the last 5 minutes. This prevents spam when someone presses the bell multiple times.

### **Detect suspicious activity**

If the front door opens more than five times within 10 minutes, send an alert. Useful for detecting unusual entry patterns.

### **Daily digest**

Check if mail was delivered today before sending a reminder notification in the evening.

## Notes

- Events maintain a limited history of recent occurrences.
- Clearing an event removes all its history—it will no longer pass the "happened" condition.
- Use descriptive names to make your automations easy to understand.
