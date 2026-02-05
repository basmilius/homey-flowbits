# Smart Thermostat Override

FlowBits sliders make it easy to create a temperature override system for your smart thermostat. By using a slider to control a temperature offset, you can quickly adjust your home's temperature without changing your thermostat's schedule, and combine it with modes for intelligent heating control.

## What you'll get

A flexible temperature control system that:

- Provides manual temperature offset control via a slider widget
- Applies the offset to your thermostat setpoint
- Respects your normal heating schedules
- Resets to normal when switching modes
- Allows both positive and negative adjustments

## Requirements

- A smart thermostat connected to Homey
- A [Slider](/guide/sliders) called **Temperature Offset**
- [Modes](/guide/modes) for different times of day (optional but recommended)
- The **Better Logic** app or built-in logic cards for calculations

## Setup

Create a **Temperature Offset** slider with the following settings:

- **Step size:** 1 (for whole-degree adjustments)
- **Default value:** 50 (representing 0° offset)

The slider will work as follows:
- 0–49: Negative offset (-5° to -1°)
- 50: No offset (0°)
- 51–100: Positive offset (+1° to +5°)

::: tip
You can customize the range to suit your needs. This example uses a ±5° range, but you could make it smaller (±3°) or larger (±10°) by adjusting the calculations.
:::

## Flow

### Step 1: Define base temperatures for each mode

Set your desired base temperature for each mode. These will be adjusted by the slider offset.

**Morning mode base temperature:**

<FlowCards>
    <FlowCard type="trigger" id="a1"><strong>Morning</strong> is activated</FlowCard>
    <FlowCard type="action" id="a2" connect-to-id="a1">Set label <strong>Base Temperature</strong> to <strong>21</strong></FlowCard>
    <FlowCard type="action" id="a3" connect-to-id="a1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

**Day mode base temperature:**

<FlowCards>
    <FlowCard type="trigger" id="b1"><strong>Day</strong> is activated</FlowCard>
    <FlowCard type="action" id="b2" connect-to-id="b1">Set label <strong>Base Temperature</strong> to <strong>20</strong></FlowCard>
    <FlowCard type="action" id="b3" connect-to-id="b1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

**Evening mode base temperature:**

<FlowCards>
    <FlowCard type="trigger" id="c1"><strong>Evening</strong> is activated</FlowCard>
    <FlowCard type="action" id="c2" connect-to-id="c1">Set label <strong>Base Temperature</strong> to <strong>22</strong></FlowCard>
    <FlowCard type="action" id="c3" connect-to-id="c1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

**Night mode base temperature:**

<FlowCards>
    <FlowCard type="trigger" id="d1"><strong>Night</strong> is activated</FlowCard>
    <FlowCard type="action" id="d2" connect-to-id="d1">Set label <strong>Base Temperature</strong> to <strong>18</strong></FlowCard>
    <FlowCard type="action" id="d3" connect-to-id="d1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

### Step 2: Update thermostat when slider changes

When the user adjusts the slider, recalculate the target temperature and update the thermostat.

<FlowCards>
    <FlowCard type="trigger" id="e1">Slider <strong>Temperature Offset</strong> changed</FlowCard>
    <FlowCard type="action" id="e2" connect-to-id="e1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

### Step 3: Calculate and apply temperature

When the update signal is received, calculate the final temperature and apply it to the thermostat.

<FlowCards>
    <FlowCard type="trigger" id="f1">Receive signal <strong>Update Thermostat</strong></FlowCard>
    <FlowCard type="action" id="f2" connect-to-id="f1" app="Better Logic" color="#8B4513" logo="/assets/logos/better-logic.svg">Set variable <strong>slider_value</strong> from slider <strong>Temperature Offset</strong></FlowCard>
    <FlowCard type="action" id="f3" connect-to-id="f1" app="Better Logic" color="#8B4513" logo="/assets/logos/better-logic.svg">Set variable <strong>base_temp</strong> from label <strong>Base Temperature</strong></FlowCard>
    <FlowCard type="action" id="f4" connect-to-id="f1" app="Better Logic" color="#8B4513" logo="/assets/logos/better-logic.svg">Calculate <strong>offset</strong> as <strong>(slider_value - 50) / 10</strong></FlowCard>
    <FlowCard type="action" id="f5" connect-to-id="f1" app="Better Logic" color="#8B4513" logo="/assets/logos/better-logic.svg">Calculate <strong>target_temp</strong> as <strong>base_temp + offset</strong></FlowCard>
    <FlowCard type="action" id="f6" connect-to-id="f1" app="Thermostat" color="#FF5733" logo="/assets/logos/thermostat.svg">Set temperature from variable <strong>target_temp</strong></FlowCard>
</FlowCards>

::: tip
This flow converts the slider value (0-100) into a temperature offset:
- Slider at 50 → offset = 0° → temperature = base temperature
- Slider at 60 → offset = +1° → temperature = base + 1°
- Slider at 40 → offset = -1° → temperature = base - 1°
- Slider at 100 → offset = +5° → temperature = base + 5°
- Slider at 0 → offset = -5° → temperature = base - 5°
:::

### Step 4: Reset slider to neutral on mode change (optional)

If you want the offset to reset when changing modes, add this flow:

<FlowCards>
    <FlowCard type="trigger" id="g1"><strong>Morning</strong> is activated</FlowCard>
    <FlowCard type="action" id="g2" connect-to-id="g1">Set slider <strong>Temperature Offset</strong> to <strong>50</strong></FlowCard>
</FlowCards>

Create similar flows for Day, Evening, and Night modes.

## Alternative: Simple implementation without calculations

If you don't want to use variables and calculations, here's a simpler approach using just the slider and direct temperature control:

### Configure slider for direct temperature control

Instead of an offset, make the slider represent the actual temperature:

- Configure slider with step size 1
- Map slider values directly to temperatures (e.g., 0 = 15°C, 100 = 25°C)

**Apply temperature directly:**

<FlowCards>
    <FlowCard type="trigger" id="h1">Slider <strong>Target Temperature</strong> changed</FlowCard>
    <FlowCard type="action" id="h2" connect-to-id="h1" app="Better Logic" color="#8B4513" logo="/assets/logos/better-logic.svg">Calculate <strong>temp</strong> as <strong>15 + (slider_value * 0.1)</strong></FlowCard>
    <FlowCard type="action" id="h3" connect-to-id="h1" app="Thermostat" color="#FF5733" logo="/assets/logos/thermostat.svg">Set temperature from variable <strong>temp</strong></FlowCard>
</FlowCards>

This maps slider 0-100 to temperature range 15-25°C.

## Tips

- **Visual feedback with widget** — Add the slider widget to your Homey dashboard for easy temperature adjustments.

- **Away mode override** — Set the slider to a low value automatically when away mode is activated:

<FlowCards>
    <FlowCard type="trigger" id="i1"><strong>Away</strong> is activated</FlowCard>
    <FlowCard type="action" id="i2" connect-to-id="i1">Set slider <strong>Temperature Offset</strong> to <strong>0</strong></FlowCard>
    <FlowCard type="action" id="i3" connect-to-id="i1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

- **Temporary boost** — Create a quick boost flow that temporarily increases temperature:

<FlowCards>
    <FlowCard type="trigger" id="j1" app="Voice Assistant" color="#4A90E2" logo="/assets/logos/generic.svg">Text is <strong>it's cold</strong></FlowCard>
    <FlowCard type="action" id="j2" connect-to-id="j1">Set slider <strong>Temperature Offset</strong> to <strong>70</strong></FlowCard>
    <FlowCard type="action" id="j3" connect-to-id="j1">Send signal <strong>Update Thermostat</strong></FlowCard>
</FlowCards>

- **Schedule-based adjustments** — Combine with time triggers to automatically adjust the offset at certain times (e.g., increase before wake-up time).

- **Multiple zones** — Create separate sliders for different heating zones if you have a multi-zone system.

- **Energy saving mode** — Create a flag that limits the maximum offset to save energy:

<FlowCards>
    <FlowCard type="trigger" id="k1">Slider <strong>Temperature Offset</strong> changed</FlowCard>
    <FlowCard type="condition" id="k2" connect-to-id="k1">Flag <strong>Energy Saving</strong> is active</FlowCard>
    <FlowCard type="condition" id="k3" connect-to-id="k2">Slider <strong>Temperature Offset</strong> is greater than <strong>60</strong></FlowCard>
    <FlowCard type="action" id="k4" connect-to-id="k3">Set slider <strong>Temperature Offset</strong> to <strong>60</strong></FlowCard>
    <FlowCard type="action" id="k5" connect-to-id="k3" app="Notifications" color="#26A65B" logo="/assets/logos/notifications.svg">Send notification <strong>Temperature offset limited by energy saving mode</strong></FlowCard>
</FlowCards>

## Used FlowBits features

- [Sliders](/guide/sliders)
- [Labels](/guide/labels)
- [Signals](/guide/signals)
- [Modes](/guide/modes)
- [Flags](/guide/flags) (optional)
