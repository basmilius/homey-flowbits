# Room Presence Tracking

FlowBits sets make it easy to track which rooms in your home are occupied. By creating a presence set with states for each room, you can build smart automations that respond to where people are, coordinate lighting across rooms, and know when everyone has left the house.

## What you'll get

A presence tracking system that:

- Tracks occupancy for each room using motion sensors
- Knows when someone is home (any room occupied)
- Knows when the house is empty (all rooms unoccupied)
- Automatically times out room presence after periods of no motion
- Enables room-specific automations based on occupancy

## Requirements

- Motion sensors in each room you want to track
- A [Set](/guide/sets) called **Presence** with states for each room
- [Timers](/guide/timers) for automatic room timeout

## Setup

Create a **Presence** set with the following states:

- `Living room`
- `Kitchen`
- `Bedroom`
- `Bathroom`
- `Office`

Add or remove states based on the rooms in your home.

## Flow

### Step 1: Detect presence in each room

When motion is detected in a room, activate that room's state in the presence set and stop its timeout timer.

**Living room:**

<FlowCards>
    <FlowCard type="trigger" id="a1" app="Motion sensor - Living room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="action" id="a2" connect-to-id="a1">Activate state <strong>Living room</strong> in set <strong>Presence</strong></FlowCard>
    <FlowCard type="action" id="a3" connect-to-id="a1">Stop timer <strong>Living room presence</strong></FlowCard>
</FlowCards>

**Kitchen:**

<FlowCards>
    <FlowCard type="trigger" id="b1" app="Motion sensor - Kitchen" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Activate state <strong>Kitchen</strong> in set <strong>Presence</strong></FlowCard>
    <FlowCard type="action" id="b3" connect-to-id="b1">Stop timer <strong>Kitchen presence</strong></FlowCard>
</FlowCards>

::: tip
Create similar flows for each room in your home. The pattern is the same: when motion is detected, activate the room state and stop its timeout timer.
:::

### Step 2: Start timeout when motion stops

When motion stops in a room, start a timer that will deactivate the room's presence state after a period of inactivity.

**Living room:**

<FlowCards>
    <FlowCard type="trigger" id="c1" app="Motion sensor - Living room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned off</FlowCard>
    <FlowCard type="action" id="c2" connect-to-id="c1">Start timer <strong>Living room presence</strong> with <strong>5</strong> <strong>minutes</strong></FlowCard>
</FlowCards>

**Kitchen:**

<FlowCards>
    <FlowCard type="trigger" id="d1" app="Motion sensor - Kitchen" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned off</FlowCard>
    <FlowCard type="action" id="d2" connect-to-id="d1">Start timer <strong>Kitchen presence</strong> with <strong>3</strong> <strong>minutes</strong></FlowCard>
</FlowCards>

::: tip
Adjust timeout durations based on room usage. Kitchens and bathrooms can have shorter timeouts (3 minutes), while living rooms and bedrooms might need longer timeouts (5-10 minutes).
:::

### Step 3: Deactivate presence when timeout expires

When a room's timeout timer finishes, deactivate that room's presence state.

**Living room:**

<FlowCards>
    <FlowCard type="trigger" id="e1">Timer <strong>Living room presence</strong> finished</FlowCard>
    <FlowCard type="action" id="e2" connect-to-id="e1">Deactivate state <strong>Living room</strong> in set <strong>Presence</strong></FlowCard>
</FlowCards>

**Kitchen:**

<FlowCards>
    <FlowCard type="trigger" id="f1">Timer <strong>Kitchen presence</strong> finished</FlowCard>
    <FlowCard type="action" id="f2" connect-to-id="f1">Deactivate state <strong>Kitchen</strong> in set <strong>Presence</strong></FlowCard>
</FlowCards>

### Step 4: React to presence changes

Now you can create automations that react to presence states.

**When someone arrives home:**

<FlowCards>
    <FlowCard type="trigger" id="g1">Any state in set <strong>Presence</strong> becomes active</FlowCard>
    <FlowCard type="action" id="g2" connect-to-id="g1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Welcome home</strong> scene</FlowCard>
    <FlowCard type="action" id="g3" connect-to-id="g1">Deactivate <strong>Away</strong></FlowCard>
</FlowCards>

**When everyone leaves:**

<FlowCards>
    <FlowCard type="trigger" id="h1">Set <strong>Presence</strong> becomes inactive</FlowCard>
    <FlowCard type="action" id="h2" connect-to-id="h1">Activate <strong>Away</strong></FlowCard>
    <FlowCard type="action" id="h3" connect-to-id="h1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Turn all lights off</FlowCard>
    <FlowCard type="action" id="h4" connect-to-id="h1">Set temperature to <strong>16°C</strong></FlowCard>
</FlowCards>

**Room-specific lighting:**

<FlowCards>
    <FlowCard type="trigger" id="i1">State <strong>Kitchen</strong> in set <strong>Presence</strong> is activated</FlowCard>
    <FlowCard type="condition" id="i2" connect-to-id="i1"><strong>Evening</strong> is active</FlowCard>
    <FlowCard type="action" id="i3" connect-to-id="i2" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Kitchen evening</strong> scene</FlowCard>
</FlowCards>

## Tips

- **Check if someone is home in other flows** — Use the condition card to make flows behave differently when home versus away:

<FlowCards>
    <FlowCard type="trigger" id="j1" app="Front door" color="#4A90E2" logo="/assets/logos/generic.svg">The contact alarm turned on</FlowCard>
    <FlowCard type="condition" id="j2" connect-to-id="j1">Set <strong>Presence</strong> is inactive</FlowCard>
    <FlowCard type="action" id="j3" connect-to-id="j2" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>🚨 Front door opened while away!</strong></FlowCard>
</FlowCards>

- **Combine with other modes** — Use presence tracking with modes like Night or Away for more sophisticated automations.

- **Multiple people** — If you have individual presence detection (like phone presence), you can create separate sets or states for each person.

- **Add more rooms** — Simply add new states to the set and create the corresponding flows. The structure remains the same.

- **Adjust timeouts dynamically** — You could use different timeout durations based on the current mode (shorter timeouts during the day, longer at night).

## Used FlowBits features

- [Sets](/guide/sets)
- [Timers](/guide/timers)
- [Modes](/guide/modes) (optional)
