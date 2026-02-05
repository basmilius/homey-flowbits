# Guest Mode Automation

FlowBits flags make it perfect for creating a guest mode that temporarily adjusts your home's behavior when you have visitors. By activating a single flag, you can disable privacy-sensitive automations, adjust lighting preferences, and ensure your guests have a comfortable stay.

## What you'll get

A guest mode system that:

- Activates with a single button press or voice command
- Disables motion-activated announcements in guest areas
- Keeps certain lights on longer than usual
- Adjusts notification settings
- Automatically deactivates after a set duration (optional)
- Provides visual feedback through a widget

## Requirements

- A [Flag](/guide/flags) called **Guest mode**
- Optional: A button or wall switch to activate guest mode
- Optional: A flag widget for manual control

## Flow

### Step 1: Activate guest mode

Create multiple ways to activate guest mode for convenience.

**Via voice command:**

<FlowCards>
    <FlowCard type="trigger" id="a1" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Text is <strong>activate guest mode</strong></FlowCard>
    <FlowCard type="action" id="a2" connect-to-id="a1">Activate flag <strong>Guest mode</strong></FlowCard>
    <FlowCard type="action" id="a3" connect-to-id="a1" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Speak <strong>Guest mode activated</strong></FlowCard>
</FlowCards>

**Via button press:**

<FlowCards>
    <FlowCard type="trigger" id="b1" app="Wall switch - Hall" color="#F4AF2E" logo="/assets/logos/hue.svg">Button <strong>2</strong> pressed</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Toggle flag <strong>Guest mode</strong></FlowCard>
</FlowCards>

**Activate for specific duration:**

<FlowCards>
    <FlowCard type="trigger" id="c1" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Text is <strong>guests arriving</strong></FlowCard>
    <FlowCard type="action" id="c2" connect-to-id="c1">Activate flag <strong>Guest mode</strong> for <strong>8</strong> <strong>hours</strong></FlowCard>
    <FlowCard type="action" id="c3" connect-to-id="c1" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Speak <strong>Guest mode activated for 8 hours</strong></FlowCard>
</FlowCards>

### Step 2: Adjust behavior when guest mode is active

Modify your existing automations to check for guest mode and behave differently.

**Keep guest room lights on longer:**

<FlowCards>
    <FlowCard type="trigger" id="d1" app="Motion sensor - Guest room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned off</FlowCard>
    <FlowCard type="condition" id="d2" connect-to-id="d1">Flag <strong>Guest mode</strong> is active</FlowCard>
    <FlowCard type="action" id="d3" connect-to-id="d2">Start timer <strong>Guest room lights</strong> with <strong>15</strong> <strong>minutes</strong></FlowCard>
</FlowCards>

<FlowCards>
    <FlowCard type="trigger" id="e1" app="Motion sensor - Guest room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned off</FlowCard>
    <FlowCard type="condition" id="e2" connect-to-id="e1" invert="true">Flag <strong>Guest mode</strong> is active</FlowCard>
    <FlowCard type="action" id="e3" connect-to-id="e2">Start timer <strong>Guest room lights</strong> with <strong>3</strong> <strong>minutes</strong></FlowCard>
</FlowCards>

::: tip
This creates two flows: one for guest mode (15 minute timeout) and one for normal operation (3 minute timeout). The lights stay on much longer when guests are present.
:::

**Disable presence announcements:**

<FlowCards>
    <FlowCard type="trigger" id="f1" app="Motion sensor - Bathroom" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="condition" id="f2" connect-to-id="f1" invert="true">Flag <strong>Guest mode</strong> is active</FlowCard>
    <FlowCard type="action" id="f3" connect-to-id="f2" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Speak <strong>Bathroom occupied</strong></FlowCard>
</FlowCards>

**Suppress doorbell notifications at night:**

<FlowCards>
    <FlowCard type="trigger" id="g1" app="Doorbell" color="#4A90E2" logo="/assets/logos/generic.svg">Button pressed</FlowCard>
    <FlowCard type="condition" id="g2" connect-to-id="g1"><strong>Night</strong> is active</FlowCard>
    <FlowCard type="condition" id="g3" connect-to-id="g2" invert="true">Flag <strong>Guest mode</strong> is active</FlowCard>
    <FlowCard type="action" id="g4" connect-to-id="g3" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Someone at the door</strong></FlowCard>
</FlowCards>

::: tip
This prevents you from being woken up when guests come home late, while still alerting you during normal nights.
:::

### Step 3: Welcome guests with lighting adjustments

When guest mode is activated, prepare the guest areas.

<FlowCards>
    <FlowCard type="trigger" id="h1">Flag <strong>Guest mode</strong> is activated</FlowCard>
    <FlowCard type="action" id="h2" connect-to-id="h1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Guest room welcome</strong> scene</FlowCard>
    <FlowCard type="action" id="h3" connect-to-id="h1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Guest bathroom bright</strong> scene</FlowCard>
    <FlowCard type="action" id="h4" connect-to-id="h1" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Guest mode activated</strong></FlowCard>
</FlowCards>

### Step 4: Restore normal behavior when deactivated

When guest mode ends, return to normal settings.

<FlowCards>
    <FlowCard type="trigger" id="i1">Flag <strong>Guest mode</strong> is deactivated</FlowCard>
    <FlowCard type="action" id="i2" connect-to-id="i1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Turn all lights off in <strong>Guest room</strong></FlowCard>
    <FlowCard type="action" id="i3" connect-to-id="i1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Turn all lights off in <strong>Guest bathroom</strong></FlowCard>
    <FlowCard type="action" id="i4" connect-to-id="i1" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Guest mode deactivated</strong></FlowCard>
</FlowCards>

## Tips

- **Widget control** — Add a flag widget to your Homey dashboard for easy one-tap guest mode activation.

- **Multiple guest scenarios** — Create different flags for different types of guests:
  - `Guest mode - Overnight` for guests staying the night
  - `Guest mode - Party` for gatherings where you want different lighting
  - `Guest mode - Kids` for when children are visiting

- **Combine with modes** — Check both the guest flag and current mode for even more control:

<FlowCards>
    <FlowCard type="trigger" id="j1" app="Motion sensor - Living room" color="#F4AF2E" logo="/assets/logos/hue.svg">The motion alarm turned on</FlowCard>
    <FlowCard type="condition" id="j2" connect-to-id="j1"><strong>Evening</strong> is active</FlowCard>
    <FlowCard type="condition" id="j3" connect-to-id="j2">Flag <strong>Guest mode</strong> is active</FlowCard>
    <FlowCard type="action" id="j4" connect-to-id="j3" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Living room bright</strong> scene</FlowCard>
</FlowCards>

- **Auto-deactivate in the morning** — Set up a flow to automatically turn off guest mode at a specific time:

<FlowCards>
    <FlowCard type="trigger" id="k1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>09:00</strong></FlowCard>
    <FlowCard type="condition" id="k2" connect-to-id="k1">Flag <strong>Guest mode</strong> is active for at least <strong>12</strong> <strong>hours</strong></FlowCard>
    <FlowCard type="action" id="k3" connect-to-id="k2">Deactivate flag <strong>Guest mode</strong></FlowCard>
</FlowCards>

- **Disable smart speaker listening** — If you have privacy-sensitive smart speakers, you could trigger a flow to disable their microphones during guest mode.

## Used FlowBits features

- [Flags](/guide/flags)
