---
outline: deep
---

# Sliders <VPBadge type="info" text="1.5.0+"/>

Sliders let you work with adjustable numeric values inside your flows.  
They behave like virtual dials: users can drag the slider in the UI, and flows can read or update its value at any time.

A slider always holds a single number between **0 and 100**.  
This fixed range keeps sliders predictable and easy to use for percentages, intensities, or any normalized value.

## How it works

Sliders can be controlled both from the user interface and from flow cards.  
When the value changes, a flow card triggers so you can respond to that update.

Sliders are useful for:

- User-driven numeric input
- Flow-driven updates
- Optional real-time updates during sliding
- Fine-tuned control with a consistent 0–100 range

## Flow cards

These flow cards let you set or react to slider values, enabling simple numeric control within a fixed 0–100 range.

### Actions

<FlowCards>
    <FlowCardExplainer content="Updates the value of a slider.">
        <FlowCard type="action">Set slider <strong>Volume</strong> to <strong>75%</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when the value of a slider changes.">
        <FlowCard type="trigger">Slider <strong>Volume</strong> changed</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Brightness control**

Let a user pick a brightness level with a slider; flows apply that percentage to one or more devices.

### **Thermostat offset or scaling**

While a thermostat might use actual temperatures, a slider can control offsets, intensities, or automation weighting.

### **General percentages**

Use sliders for fan speed, transition duration scaling, media volume, or any percentage-based setting.

## Notes

- Sliders always use a 0–100 range.
- Sliders hold the value; flows remain stateless.
- You can create any number of sliders, each identified by name.
- Step size controls how precise the user input can be. For example, a step size of 5 means the slider will snap to values like 0, 5, 10, 15, etc. The default step size is 1.
