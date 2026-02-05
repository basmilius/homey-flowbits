# Miscellaneous flow cards

FlowBits also provides a collection of standalone utility flow cards.  
These cards do not belong to a specific feature but offer useful tools you can use anywhere in your flows.  
They cover math operations, context-aware checks, and probability-based logic.

## Flow cards

These flow cards provide various utility functions that you can apply directly within any flow.

### Actions

<FlowCards>
    <FlowCardExplainer content="Calculate the percentage of time elapsed between two timestamps. Useful for time-based interpolation and automation.">
        <FlowCard type="action">Calculate percentage between <strong>07:00</strong> and <strong>22:00</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Increment a number by the given step.">
        <FlowCard type="action">Increment <strong>Number</strong> by <strong>Step</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Decrement a number by the given step.">
        <FlowCard type="action">Decrement <strong>Number</strong> by <strong>Step</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Multiply a number by a factor.">
        <FlowCard type="action">Multiply <strong>Number</strong> by <strong>Factor</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Divide a number by a divisor.">
        <FlowCard type="action">Divide <strong>Number</strong> by <strong>Divisor</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Make a number positive.">
        <FlowCard type="action">Make <strong>Number</strong> positive</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Make a number negative.">
        <FlowCard type="action">Make <strong>Number</strong> negative</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Round a number to the nearest integer.">
        <FlowCard type="action">Round <strong>Number</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Round a number up to the nearest integer.">
        <FlowCard type="action">Round <strong>Number</strong> up</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Round a number down to the nearest integer.">
        <FlowCard type="action">Round <strong>Number</strong> down</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Round a number to the nearest step.">
        <FlowCard type="action">Round <strong>Number</strong> to <strong>Step</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if the current day period is either morning, afternoon, evening or night.">
        <FlowCard type="condition">It is <strong>Morning</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if it is currently a school holiday in the Netherlands. The region can either be North, Middle or South.">
        <FlowCard type="condition">It is <strong>Spring vacation</strong> in region <strong>Middle</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Continues with the given percentage chance.">
        <FlowCard type="condition">Continue with <strong>Chance%</strong> change</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Rolls a dice and checks if the result is equal to the given number.">
        <FlowCard type="condition">Dice rolls <strong>Result</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks the current moon phase.">
        <FlowCard type="condition">The moon phase is <strong>First Quarter</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks the current zodiac sign.">
        <FlowCard type="condition">The zodiac sign is <strong>Pisces</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Calculate percentage between timestamps**

The percentage utility card calculates how far through a time period you currently are.  
It takes two timestamps (in HH:mm format) and returns both a percentage (0-100) and a fraction (0-1).

**Use cases:**
- Gradually adjust lighting brightness from sunrise to sunset
- Create smooth transitions between day and night modes
- Calculate dynamic thermostat offsets based on time of day
- Interpolate between two values over a time period

**Example:** Between 07:00 and 22:00 (7 AM to 10 PM):
- At 07:00, the percentage is 0%
- At 14:30 (halfway through), the percentage is 50%
- At 22:00, the percentage is 100%

If the "from" time is later than the "to" time, the card handles overnight periods automatically.  
For example, from 22:00 to 07:00 spans midnight correctly.
