---
outline: deep
---

# Sets <VPBadge type="info" text="1.12.0+"/>

Sets are collections of boolean states that can be evaluated as a group.  
A set is active when any of its states is active, making it easy to coordinate related conditions without complex logic.

Think of a set as a **named group of on/off switches** where you can check if *any* switch is on, if *all* switches are on, or trigger flows when specific switches change.

## How it works

Sets help you organize related boolean values into logical groups.  
Each set has a name, and within that set you define multiple states that are either active or inactive.

Sets are useful for:

- Grouping related conditions that you want to evaluate together
- Managing presence detection across multiple rooms
- Tracking which devices or zones are currently in use
- Coordinating multiple boolean states with a single check
- Building flexible automation without creating many individual flags

For example, a *presence* set could contain states for each room: `living_room`, `kitchen`, `bedroom`.  
You can then check if anyone is home by seeing if *any* state in the set is active, or check if everyone is home by seeing if *all* states are active.

## Flow cards

These flow cards let you activate, deactivate, toggle, or check states within your sets, enabling powerful group-based logic.

### Actions

<FlowCards>
    <FlowCardExplainer content="Activates all states in the set.">
        <FlowCard type="action">Activate all states in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activates a single state within the set.">
        <FlowCard type="action">Activate state <strong>Living room</strong> in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activates a state exclusively, deactivating all other states in the set.">
        <FlowCard type="action">Activate state <strong>Kitchen</strong> exclusively in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activates a state exclusively for a specified duration, then deactivates it.">
        <FlowCard type="action">Activate state <strong>Office</strong> exclusively in set <strong>Presence</strong> for <strong>30</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Activates a state for a specified duration, then automatically deactivates it.">
        <FlowCard type="action">Activate state <strong>Bathroom</strong> in set <strong>Presence</strong> for <strong>15</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivates all states in the set.">
        <FlowCard type="action">Deactivate all states in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Deactivates a single state within the set.">
        <FlowCard type="action">Deactivate state <strong>Bedroom</strong> in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Toggles a state between active and inactive.">
        <FlowCard type="action">Toggle state <strong>Garage</strong> in set <strong>Presence</strong></FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Toggles a state, and if activated, automatically deactivates it after the specified duration.">
        <FlowCard type="action">Toggle state <strong>Hall</strong> in set <strong>Presence</strong> for <strong>5</strong> <strong>minutes</strong></FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Conditions

<FlowCards>
    <FlowCardExplainer content="Checks if all states in the set are active.">
        <FlowCard type="condition">All states in set <strong>Presence</strong> are active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if any state in the set is active.">
        <FlowCard type="condition">Any state in set <strong>Presence</strong> is active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if all states in the set are inactive.">
        <FlowCard type="condition">Set <strong>Presence</strong> is inactive</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Checks if a specific state within the set is active.">
        <FlowCard type="condition">State <strong>Living room</strong> in set <strong>Presence</strong> is active</FlowCard>
    </FlowCardExplainer>
</FlowCards>

### Triggers

<FlowCards>
    <FlowCardExplainer content="Triggers when all states in the set become active.">
        <FlowCard type="trigger">All states in set <strong>Presence</strong> become active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when at least one state in the set becomes active (transitioning from all inactive to at least one active).">
        <FlowCard type="trigger">Any state in set <strong>Presence</strong> becomes active</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a previously active state becomes inactive.">
        <FlowCard type="trigger">State in set <strong>Presence</strong> becomes inactive</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when all states in the set become inactive (transitioning from at least one active to all inactive).">
        <FlowCard type="trigger">Set <strong>Presence</strong> becomes inactive</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when not all states in the set are active anymore.">
        <FlowCard type="trigger">Not all states in set <strong>Presence</strong> are active anymore</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when any state in the set changes.">
        <FlowCard type="trigger">Set <strong>Presence</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a specific state is activated.">
        <FlowCard type="trigger">State <strong>Living room</strong> in set <strong>Presence</strong> is activated</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a specific state changes.">
        <FlowCard type="trigger">State <strong>Kitchen</strong> in set <strong>Presence</strong> changed</FlowCard>
    </FlowCardExplainer>
    <FlowCardExplainer content="Triggers when a specific state is deactivated.">
        <FlowCard type="trigger">State <strong>Bedroom</strong> in set <strong>Presence</strong> is deactivated</FlowCard>
    </FlowCardExplainer>
</FlowCards>

## Examples

### **Room presence tracking**

Create a *presence* set with states for each room: `living_room`, `kitchen`, `bedroom`, `office`.  
Activate the corresponding state when motion is detected in a room.  
Check if *any* state is active to know if someone is home, or use *all states inactive* to trigger "away" mode.

### **Device status monitoring**

Use a *charging* set to track which devices are currently charging: `phone`, `tablet`, `laptop`.  
Activate states when devices start charging, deactivate when they finish.  
Get a notification when all devices are fully charged.

### **Zone management**

Create a *security* set with states for each zone: `ground_floor`, `first_floor`, `garage`, `garden`.  
Activate states when a zone is armed, deactivate when disarmed.  
Check if all zones are armed before activating full security mode.

### **Multi-room audio**

Use a *playing* set to track which rooms are playing audio: `living_room`, `kitchen`, `bedroom`.  
When music starts in a room, activate that state exclusively to pause other rooms automatically.

## Notes

- Sets are global and can be used in any flow.
- States persist across reboots.
- You can activate multiple states simultaneously or use exclusive activation for mutual exclusion.
- States can automatically deactivate after a duration, useful for temporary activations.
- Use descriptive names for both sets and states to keep your system organized.
- Customize set icons and colors from app settings for better visualization.
