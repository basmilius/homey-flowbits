---
outline: deep
---

# Timers <VPBadge type="info" text="1.0.0+"/>

Timers let you delay actions, schedule follow-ups, and build flows that react to time passing rather than immediate events.  
They are simple, self-contained countdowns that start, expire, and reset without storing additional data.

A timer always has two states: **running** or **not running**.  
When it reaches zero, it fires a flow card once and then stops automatically.

## How it works

Timers operate independently of other features:

1. You start a timer with a chosen duration.
2. The timer counts down in the background.
3. When it finishes, it emits a single “timer finished” event.
4. The timer turns off until you start it again.

Timers can also be stopped or cleared at any moment.

## Why use Timers?

Timers are useful whenever you need delayed automation or cooldown periods.  
Common uses include:

- Turn off a light after a delay.
- Run a reminder 10 minutes after an event.
- Create cooldowns between two actions.
- Trigger follow-up steps in routines.
- Auto-reset modes or flags after a while.

Timers help keep flows clean by centralizing timing logic.

## Flow cards

These flow cards allow you to start, stop, reset, or check timers, enabling precise time-based control in your flows.

### Actions

<FlowCards>
    <FlowCardExplainer content="Pauses the timer, if it is running.">
        <FlowCard type="action">Pause timer <strong>Hall lights</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Resumes the timer, if it is paused.">
        <FlowCard type="action">Resume timer <strong>Alarm cooldown</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Sets the timer to a new duration.">
        <FlowCard type="action">Set timer <strong>Hall lights</strong> to <strong>5</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Sets the timer to a random duration between the specified minimum and maximum.">
        <FlowCard type="action">Set timer <strong>Hall lights</strong> between <strong>3</strong> <strong>minutes</strong> and <strong>10</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Starts the timer with the provided duration. Replaces any existing timer with the same name.">
        <FlowCard type="action">Start timer <strong>Hall lights</strong> with <strong>5</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Starts the timer with a random duration between the specified minimum and maximum.">
        <FlowCard type="action">Start timer <strong>Delay</strong> between <strong>30</strong> <strong>seconds</strong> and <strong>2</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Stops the timer, if it is running.">
        <FlowCard type="action">Stop timer <strong>Hall lights</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if the timer has the specified duration left.">
        <FlowCard type="condition">Timer <strong>Alarm cooldown</strong> has more than <strong>30</strong> <strong>seconds</strong> left</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the timer is finished.">
        <FlowCard type="condition">Timer <strong>Hall lights</strong> is finished</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the timer is paused.">
        <FlowCard type="condition">Timer <strong>Alarm cooldown</strong> is paused</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if the timer is running.">
        <FlowCard type="condition">Timer <strong>Hall lights</strong> is running</FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when the timer finishes.">
        <FlowCard type="trigger">Timer <strong>Hall lights</strong> finished</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the timer is paused.">
        <FlowCard type="trigger">Timer <strong>Hall lights</strong> paused</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the timer is running and has reached the specified duration.">
        <FlowCard type="trigger"><strong>30</strong> <strong>seconds</strong> remaining for timer <strong>Hall lights</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the timer is resumed after being paused.">
        <FlowCard type="trigger">Timer <strong>Hall lights</strong> resumed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the timer starts.">
        <FlowCard type="trigger">Timer <strong>Hall lights</strong> started</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when the timer stops.">
        <FlowCard type="trigger">Timer <strong>Hall lights</strong> stopped</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Light auto-off**

Start a `kitchen_light` timer for 5 minutes when motion is detected.  
When the timer expires, turn the light off.

### **Cooldown period**

After turning on the heating, start a `heating_cooldown` timer for 30 minutes.  
During this period, block additional heating changes.

### **Follow-up reminder**

Emit a reminder 10 minutes after someone arrives home by starting an `arrival_delay` timer and listening for its expiration.

## Notes

- Timers are stateless aside from their running/paused state.
- You can create as many timers as you need, each identified by name.
- Starting a timer again resets the countdown.
- Only the expiration event triggers a flow — not each passing second.  
