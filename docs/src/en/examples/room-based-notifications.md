# Room-Based Notifications

FlowBits labels and signals work together to create a smart notification system that adapts based on context. By tracking which room you're in and using signals to communicate between flows, you can ensure notifications are delivered to the right place at the right time.

## What you'll get

A notification system that:

- Tracks which room you're currently in
- Announces messages in the appropriate room
- Routes doorbell alerts to your current location
- Sends device status updates to the room you're in
- Falls back to phone notifications when you're not home

## Requirements

- Motion sensors in different rooms
- Smart speakers or devices that can announce messages (like Sonos, Google Home, or Alexa)
- A [Label](/guide/labels) to track your current room
- [Signals](/guide/signals) to trigger announcements
- A [Set](/guide/sets) for presence tracking (optional, for determining if you're home)

## Flow

### Step 1: Track current room location

Update the label whenever motion is detected to reflect your current location.

**Living room:**

<FlowCards>
    <FlowCard type="trigger" id="a1" app="Motion sensor - Living room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="action" id="a2" connect-to-id="a1">Set label <strong>Current Room</strong> to <strong>Living room</strong></FlowCard>
</FlowCards>

**Kitchen:**

<FlowCards>
    <FlowCard type="trigger" id="b1" app="Motion sensor - Kitchen" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Set label <strong>Current Room</strong> to <strong>Kitchen</strong></FlowCard>
</FlowCards>

**Bedroom:**

<FlowCards>
    <FlowCard type="trigger" id="c1" app="Motion sensor - Bedroom" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="action" id="c2" connect-to-id="c1">Set label <strong>Current Room</strong> to <strong>Bedroom</strong></FlowCard>
</FlowCards>

::: tip
Create similar flows for each room with a motion sensor and speaker. The label will always reflect the last room where motion was detected.
:::

### Step 2: Create a centralized announcement system

Use a signal to trigger announcements, which will be routed to the appropriate speaker based on the current room label.

**Send announcement signal from any flow:**

<FlowCards>
    <FlowCard type="trigger" id="d1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="action" id="d2" connect-to-id="d1">Set label <strong>Announcement Text</strong> to <strong>Someone is at the door</strong></FlowCard>
    <FlowCard type="action" id="d3" connect-to-id="d1">Send signal <strong>Make announcement</strong></FlowCard>
</FlowCards>

### Step 3: Route announcements to the correct speaker

When the announcement signal is received, check the current room and play the message on the corresponding speaker.

**Announce in living room:**

<FlowCards>
    <FlowCard type="trigger" id="e1">Receive signal <strong>Make announcement</strong></FlowCard>
    <FlowCard type="condition" id="e2" connect-to-id="e1">Label <strong>Current Room</strong> has value <strong>Living room</strong></FlowCard>
    <FlowCard type="action" id="e3" connect-to-id="e2" app="Sonos - Living room" color="#000000" logo="/assets/logos/sonos.svg">Say (text) <strong>{{Announcement Text}}</strong></FlowCard>
</FlowCards>

**Announce in kitchen:**

<FlowCards>
    <FlowCard type="trigger" id="f1">Receive signal <strong>Make announcement</strong></FlowCard>
    <FlowCard type="condition" id="f2" connect-to-id="f1">Label <strong>Current Room</strong> has value <strong>Kitchen</strong></FlowCard>
    <FlowCard type="action" id="f3" connect-to-id="f2" app="Google Home - Kitchen" color="#4285F4" logo="/assets/logos/google-home.svg">Say (text) <strong>{{Announcement Text}}</strong></FlowCard>
</FlowCards>

**Announce in bedroom:**

<FlowCards>
    <FlowCard type="trigger" id="g1">Receive signal <strong>Make announcement</strong></FlowCard>
    <FlowCard type="condition" id="g2" connect-to-id="g1">Label <strong>Current Room</strong> has value <strong>Bedroom</strong></FlowCard>
    <FlowCard type="action" id="g3" connect-to-id="g2" app="Alexa - Bedroom" color="#FF9900" logo="/assets/logos/alexa.svg">Say (text) <strong>{{Announcement Text}}</strong></FlowCard>
</FlowCards>

::: tip
Use logic tokens like `{{Announcement Text}}` to insert the message stored in the label. This creates a flexible system where any flow can trigger an announcement by setting the label and sending the signal.
:::

### Step 4: Fallback to phone notification when away

If no current room is set (meaning you're not home), send a phone notification instead.

<FlowCards>
    <FlowCard type="trigger" id="h1">Receive signal <strong>Make announcement</strong></FlowCard>
    <FlowCard type="condition" id="h2" connect-to-id="h1">Set <strong>Presence</strong> is inactive</FlowCard>
    <FlowCard type="action" id="h3" connect-to-id="h2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>{{Announcement Text}}</strong></FlowCard>
</FlowCards>

## More examples

### Washing machine finished

Announce when the washing machine is done, routing to your current location:

<FlowCards>
    <FlowCard type="trigger" id="i1" app="Smart plug - Washer" color="#4A90E2" logo="/assets/logos/generic.svg">Power changed to less than <strong>5</strong> <strong>W</strong></FlowCard>
    <FlowCard type="action" id="i2" connect-to-id="i1">Set label <strong>Announcement Text</strong> to <strong>The washing machine has finished</strong></FlowCard>
    <FlowCard type="action" id="i3" connect-to-id="i1">Send signal <strong>Make announcement</strong></FlowCard>
</FlowCards>

### Reminder system

Create time-based reminders that follow you around:

<FlowCards>
    <FlowCard type="trigger" id="j1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>14:00</strong></FlowCard>
    <FlowCard type="action" id="j2" connect-to-id="j1">Set label <strong>Announcement Text</strong> to <strong>Don't forget your afternoon medication</strong></FlowCard>
    <FlowCard type="action" id="j3" connect-to-id="j1">Send signal <strong>Make announcement</strong></FlowCard>
</FlowCards>

### Package delivery notification

Different messages based on where you are:

<FlowCards>
    <FlowCard type="trigger" id="k1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="condition" id="k2" connect-to-id="k1"><strong>Away</strong> is active</FlowCard>
    <FlowCard type="action" id="k3" connect-to-id="k2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>📦 Someone at the door - possible delivery</strong></FlowCard>
</FlowCards>

<FlowCards>
    <FlowCard type="trigger" id="l1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="condition" id="l2" connect-to-id="l1" invert="true"><strong>Away</strong> is active</FlowCard>
    <FlowCard type="action" id="l3" connect-to-id="l2">Set label <strong>Announcement Text</strong> to <strong>Someone is at the front door</strong></FlowCard>
    <FlowCard type="action" id="l4" connect-to-id="l2">Send signal <strong>Make announcement</strong></FlowCard>
</FlowCards>

## Tips

- **Timeout current room** — Clear the current room label after extended periods without motion to force fallback to phone notifications:

<FlowCards>
    <FlowCard type="trigger" id="m1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">Every <strong>10</strong> <strong>minutes</strong></FlowCard>
    <FlowCard type="condition" id="m2" connect-to-id="m1">Set <strong>Presence</strong> is inactive</FlowCard>
    <FlowCard type="action" id="m3" connect-to-id="m2">Clear label <strong>Current Room</strong></FlowCard>
</FlowCards>

- **Priority announcements** — Create different signals for different priority levels (`urgent-announcement`, `info-announcement`) with different behaviors.

- **Multi-language support** — Store language preference in a label and use it to select appropriate announcements.

- **Volume adjustment** — Adjust speaker volume based on time of day before making announcements.

- **Custom text-to-speech voices** — Some smart speaker apps allow voice selection, which you can customize per room or situation.

## Used FlowBits features

- [Labels](/guide/labels)
- [Signals](/guide/signals)
- [Sets](/guide/sets) (optional for presence detection)
