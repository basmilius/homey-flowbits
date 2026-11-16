# Modes in groups

Modes answer one question at a time: only one of them can be active. Most homes have more than one question, though. Is anyone home? What part of the day is it? With plain modes you have to pick, because activating *Night* switches off *Home*.

Mode groups (1.20.0+) fix that. Each group has its own active mode, so you can track presence and the time of day next to each other, and combine them in your flows.

This example builds two groups and a few flows that use both.

## What you'll get

| Group    | Modes                        | Changes when              |
|----------|------------------------------|---------------------------|
| Presence | Home, Away, Guests           | People arrive or leave    |
| Daypart  | Morning, Day, Evening, Night | The clock or the sun says so |

The groups never touch each other. Leaving the house at night sets *Presence* to *Away*, and *Daypart* stays on *Night*.

## Requirements

- FlowBits 1.20.0 or newer
- The **Presence** app installed on Homey
- The **Date & Time** app installed on Homey

## Presence group

There is no separate step to create a group. Type *Presence* into the group field of the first card and the group exists.

**When someone comes home:**

<FlowCards>
    <FlowCard type="trigger" id="a1" app="Presence" color="#b9df49" logo="/assets/logos/presence.svg">The first person came home</FlowCard>
    <FlowCard type="action" id="a2" connect-to-id="a1">Activate <strong>Home</strong> in <strong>Presence</strong></FlowCard>
</FlowCards>

**When the last person leaves:**

<FlowCards>
    <FlowCard type="trigger" id="b1" app="Presence" color="#b9df49" logo="/assets/logos/presence.svg">The last person left</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Activate <strong>Away</strong> in <strong>Presence</strong></FlowCard>
</FlowCards>

**Guests for the evening:**

Start this flow from a button or a voice command. After four hours the group goes back to whatever it was before, usually *Home*.

<FlowCards>
    <FlowCard type="action" id="c1">Activate mode <strong>Guests</strong> for <strong>4</strong> <strong>hours</strong>, then revert in <strong>Presence</strong></FlowCard>
</FlowCards>

## Daypart group

The same idea, with time-based triggers. See [Daypart-based modes](/examples/daypart-based-modes) for a fuller schedule with separate weekday and weekend times.

<FlowCards>
    <FlowCard type="trigger" id="d1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>07:00</strong></FlowCard>
    <FlowCard type="action" id="d2" connect-to-id="d1">Activate <strong>Morning</strong> in <strong>Daypart</strong></FlowCard>
</FlowCards>

<FlowCards>
    <FlowCard type="trigger" id="e1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>09:00</strong></FlowCard>
    <FlowCard type="action" id="e2" connect-to-id="e1">Activate <strong>Day</strong> in <strong>Daypart</strong></FlowCard>
</FlowCards>

<FlowCards>
    <FlowCard type="trigger" id="f1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The sun is setting in <strong>0</strong> minutes</FlowCard>
    <FlowCard type="action" id="f2" connect-to-id="f1">Activate <strong>Evening</strong> in <strong>Daypart</strong></FlowCard>
</FlowCards>

<FlowCards>
    <FlowCard type="trigger" id="g1" app="Date & Time" color="#f3282f" logo="/assets/logos/date-time.svg">The time is <strong>23:00</strong></FlowCard>
    <FlowCard type="action" id="g2" connect-to-id="g1">Activate <strong>Night</strong> in <strong>Daypart</strong></FlowCard>
</FlowCards>

## Combining the groups

This is where groups pay off. A trigger from one group, a condition on the other.

**Evening lights, but only when someone is home:**

<FlowCards>
    <FlowCard type="trigger" id="h1">Mode <strong>Evening</strong> is activated in <strong>Daypart</strong></FlowCard>
    <FlowCard type="condition" id="h2" connect-to-id="h1">Mode <strong>Home</strong> is active in <strong>Presence</strong></FlowCard>
    <FlowCard type="action" id="h3" connect-to-id="h2" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Living room Relax</strong> scene</FlowCard>
</FlowCards>

**Coming home after dark:**

The flow above only runs at sunset. If you get home later, this one catches it.

<FlowCards>
    <FlowCard type="trigger" id="i1">Mode <strong>Home</strong> is activated in <strong>Presence</strong></FlowCard>
    <FlowCard type="condition" id="i2" connect-to-id="i1">Mode <strong>Evening</strong> is active in <strong>Daypart</strong></FlowCard>
    <FlowCard type="action" id="i3" connect-to-id="i2" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Activate the <strong>Living room Relax</strong> scene</FlowCard>
</FlowCards>

**Everything off when the house is empty:**

<FlowCards>
    <FlowCard type="trigger" id="j1">Mode <strong>Away</strong> is activated in <strong>Presence</strong></FlowCard>
    <FlowCard type="action" id="j2" connect-to-id="j1" app="Philips Hue" color="#F4AF2E" logo="/assets/logos/hue.svg">Turn all lights off in <strong>Downstairs</strong></FlowCard>
</FlowCards>

## Tips

- **One question per group.** If two modes can be true at the same time, they belong in different groups.
- **Mode names belong to their group.** *Night* in *Daypart* and *Night* in a *Heating* group are separate modes with their own state.
- **One widget per group.** The Modes and Current mode widgets have a group setting. Add one for *Presence* and one for *Daypart* to see both on your dashboard.
- **Existing modes stay where they are.** Cards without a group field keep acting on the modes you had before 1.20.0. You can add groups next to them at your own pace.

## Used FlowBits features

- [Modes](/guide/modes#groups)
