# Smart Doorbell with Notifications

FlowBits makes it easy to create a smart doorbell system that sends notifications but prevents spam when visitors press the button multiple times. By combining events and no-repeat windows, you can track doorbell activity and control how often notifications are sent.

## What you'll get

Your doorbell will:

- Send a notification when someone presses the doorbell
- Prevent repeated notifications if the doorbell is pressed multiple times within 2 minutes
- Track how many times the doorbell was pressed today
- Send an alert if the doorbell is pressed more than 5 times in 10 minutes (potential spam or issue)

## Requirements

- A doorbell device connected to Homey (smart doorbell, button, or contact sensor)
- The **Notifications** app for push notifications
- An [Event](/guide/events) to track doorbell presses
- A [No-repeat window](/guide/no-repeat-windows) to prevent notification spam

## Flow

### Step 1: Send notification on doorbell press

When the doorbell is pressed, send a notification but only if it hasn't been pressed in the last 2 minutes.

<FlowCards>
    <FlowCard type="trigger" id="a1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="condition" id="a2" connect-to-id="a1">No repeat of <strong>Doorbell</strong> within <strong>2</strong> <strong>minutes</strong></FlowCard>
    <FlowCard type="action" id="a3" connect-to-id="a2">Trigger event <strong>Doorbell Pressed</strong></FlowCard>
    <FlowCard type="action" id="a4" connect-to-id="a2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Someone is at the door!</strong></FlowCard>
</FlowCards>

::: tip
The no-repeat window ensures that even if someone presses the doorbell multiple times, you only get one notification every 2 minutes. This prevents your phone from being flooded with alerts.
:::

### Step 2: Track all doorbell presses

Even when notifications are suppressed, you still want to track every doorbell press for analysis or security purposes.

<FlowCards>
    <FlowCard type="trigger" id="b1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Trigger event <strong>All Doorbell Presses</strong></FlowCard>
</FlowCards>

### Step 3: Detect suspicious activity

If the doorbell is pressed more than 5 times within 10 minutes, send a special alert—this might indicate someone repeatedly ringing or a malfunction.

<FlowCards>
    <FlowCard type="trigger" id="c1">Event <strong>All Doorbell Presses</strong> is triggered</FlowCard>
    <FlowCard type="condition" id="c2" connect-to-id="c1">Event <strong>All Doorbell Presses</strong> happened <strong>5</strong> times within <strong>10</strong> <strong>minutes</strong></FlowCard>
    <FlowCard type="action" id="c3" connect-to-id="c2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>⚠️ Doorbell pressed 5+ times in 10 minutes</strong></FlowCard>
    <FlowCard type="action" id="c4" connect-to-id="c2">Clear event <strong>All Doorbell Presses</strong></FlowCard>
</FlowCards>

::: tip
After sending the alert, the event is cleared to reset the counter. This prevents continuous alerts if the situation persists.
:::

### Step 4: Optional - Daily summary

At the end of each day, check if the doorbell was pressed and send a summary notification.

<FlowCards>
    <FlowCard type="trigger" id="d1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>22:00</strong></FlowCard>
    <FlowCard type="condition" id="d2" connect-to-id="d1">Event <strong>Doorbell Pressed</strong> happened today</FlowCard>
    <FlowCard type="action" id="d3" connect-to-id="d2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Your doorbell was pressed today</strong></FlowCard>
</FlowCards>

## Tips

- **Adjust the no-repeat window** — Change the 2-minute window to suit your needs. A shorter duration is more responsive, while longer prevents more spam.

- **Different notifications for time of day** — Use mode conditions to send different notifications during the day versus night:

<FlowCards>
    <FlowCard type="trigger" id="e1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="condition" id="e2" connect-to-id="e1">No repeat of <strong>Doorbell</strong> within <strong>2</strong> <strong>minutes</strong></FlowCard>
    <FlowCard type="condition" id="e3" connect-to-id="e2"><strong>Night</strong> is active</FlowCard>
    <FlowCard type="action" id="e4" connect-to-id="e3" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>🌙 Late visitor at the door</strong></FlowCard>
</FlowCards>

- **Trigger lights or cameras** — Add actions to turn on lights, activate security cameras, or play a chime when the doorbell is pressed.

- **Manual reset** — If you need to manually reset the no-repeat window (for example, after testing), use the reset action card in a flow.

## Used FlowBits features

- [Events](/guide/events)
- [No-repeat windows](/guide/no-repeat-windows)
