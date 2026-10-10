import { createHash } from 'node:crypto';
import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { DEFAULT_MODE_GROUP, MAX_TIMEOUT_MS, REALTIME_MODE_UPDATE, SETTING_MODE, SETTING_MODE_EXPIRES_AT, SETTING_MODE_GROUPS_MIGRATED, SETTING_MODE_LAST_UPDATES, SETTING_MODE_LOOKS, SETTING_MODE_REVERT_TO, TOKEN_MODE_CURRENT, TOKEN_MODE_GROUP_CURRENT_PREFIX } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Mode, ModeGroup } from '../types';
import { convertDurationToMs } from '../util';
import type Homey from 'homey';

export default class Modes extends Shortcuts<FlowBitsApp> implements Feature<Mode> {
    readonly #expirationTimeouts: Map<string, NodeJS.Timeout> = new Map();
    readonly #tokens: Map<string, Promise<Homey.FlowToken>> = new Map();

    get current(): Record<string, string | null> {
        return this.settings.get(SETTING_MODE) ?? {};
    }

    set current(value: Record<string, string | null>) {
        this.settings.set(SETTING_MODE, value);
    }

    /** The mode active in the default group, which is what the ungrouped flow cards act on. */
    get currentMode(): string | null {
        return this.currentModeIn(DEFAULT_MODE_GROUP);
    }

    get expiresAt(): Record<string, DateTime | null> {
        return Object.fromEntries(
            Object.entries<string | null>(this.settings.get(SETTING_MODE_EXPIRES_AT) ?? {})
                .map(([group, value]) => [
                    group,
                    value ? DateTime.fromISO(value) : null
                ])
        );
    }

    set expiresAt(value: Record<string, DateTime | null>) {
        this.settings.set(SETTING_MODE_EXPIRES_AT, Object.fromEntries(
            Object.entries(value)
                .map(([group, dateTime]) => [
                    group,
                    dateTime?.toISO() ?? null
                ])
        ));
    }

    get revertTo(): Record<string, string | null> {
        return this.settings.get(SETTING_MODE_REVERT_TO) ?? {};
    }

    set revertTo(value: Record<string, string | null>) {
        this.settings.set(SETTING_MODE_REVERT_TO, value);
    }

    get looks(): Record<string, Record<string, Look>> {
        return this.settings.get(SETTING_MODE_LOOKS) ?? {};
    }

    set looks(value: Record<string, Record<string, Look>>) {
        this.settings.set(SETTING_MODE_LOOKS, value);
    }

    get lastUpdates(): Record<string, Record<string, DateTime>> {
        return Object.fromEntries(
            Object.entries<Record<string, string>>(this.settings.get(SETTING_MODE_LAST_UPDATES) ?? {})
                .map(([group, modes]) => [
                    group,
                    Object.fromEntries(
                        Object.entries(modes)
                            .map(([name, value]) => [name, DateTime.fromISO(value)])
                    )
                ])
        );
    }

    set lastUpdates(value: Record<string, Record<string, DateTime>>) {
        this.settings.set(SETTING_MODE_LAST_UPDATES, Object.fromEntries(
            Object.entries(value)
                .map(([group, modes]) => [
                    group,
                    Object.fromEntries(
                        Object.entries(modes)
                            .map(([name, dateTime]) => [name, dateTime.toISO()])
                    )
                ])
        ));
    }

    async initialize(): Promise<void> {
        this.#migrateUngroupedSettings();

        for (const group of this.#storedGroups()) {
            await this.#scheduleExpiration(group);
        }

        await this.#syncTokens();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused modes...');

        const defined = await this.#definedModes();
        const current = this.current;
        const expiresAt = this.expiresAt;
        const revertTo = this.revertTo;
        const looks = this.looks;
        const lastUpdates = this.lastUpdates;

        for (const group of this.#storedGroups()) {
            const modes = defined.get(group) ?? new Set<string>();

            // The default group outlives its cards: it is where ungrouped flow cards act.
            if (modes.size === 0 && group !== DEFAULT_MODE_GROUP) {
                this.log(`Deleting unused mode group ${group}...`);

                delete current[group];
                delete expiresAt[group];
                delete revertTo[group];
                delete looks[group];
                delete lastUpdates[group];

                continue;
            }

            if (current[group] && !modes.has(current[group]!)) {
                current[group] = null;
                expiresAt[group] = null;
                revertTo[group] = null;
            }

            if (revertTo[group] && !modes.has(revertTo[group]!)) {
                revertTo[group] = null;
            }

            const groupLooks = looks[group] ?? {};
            const groupUpdates = lastUpdates[group] ?? {};

            for (const name of Object.keys(groupLooks)) {
                if (modes.has(name)) {
                    continue;
                }

                this.log(`Deleting unused mode look ${group}/${name}...`);
                delete groupLooks[name];
            }

            for (const name of Object.keys(groupUpdates)) {
                if (modes.has(name)) {
                    continue;
                }

                this.log(`Deleting unused mode last update ${group}/${name}...`);
                delete groupUpdates[name];
            }
        }

        this.current = current;
        this.expiresAt = expiresAt;
        this.revertTo = revertTo;
        this.looks = looks;
        this.lastUpdates = lastUpdates;

        for (const group of this.#storedGroups()) {
            await this.#scheduleExpiration(group);
        }

        await this.#syncTokens();
    }

    async count(): Promise<number> {
        const modes = await this.findAll();

        return modes.length;
    }

    /**
     * Returns the number of modes across every group.
     */
    async countAll(): Promise<number> {
        const groups = await this.findAllGroups();

        return groups.reduce((total, group) => total + group.modes.length, 0);
    }

    async find(name: string): Promise<Mode | null> {
        return this.findIn(DEFAULT_MODE_GROUP, name);
    }

    async findAll(): Promise<Mode[]> {
        return this.findAllIn(DEFAULT_MODE_GROUP);
    }

    /**
     * Returns every group that has modes defined on a flow card, plus the default group.
     */
    async findAllGroups(): Promise<ModeGroup[]> {
        const defined = await this.#definedModes();

        return [...defined.entries()]
            .map(([name, modes]) => ({
                name,
                currentMode: this.currentModeIn(name),
                modes: this.#mapModes(name, modes)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    async findAllIn(group: string): Promise<Mode[]> {
        const defined = await this.#definedModes();

        return this.#mapModes(group, defined.get(group));
    }

    async findIn(group: string, name: string): Promise<Mode | null> {
        const modes = await this.findAllIn(group);

        return modes.find(mode => mode.name === name) ?? null;
    }

    currentModeIn(group: string): string | null {
        return this.current[group] ?? null;
    }

    async activate(group: string, name: string): Promise<void> {
        const current = this.currentModeIn(group);

        if (!name) {
            return;
        }

        // An open-ended activation cancels any pending timed deactivation or revert.
        this.#clearExpiration(group);

        if (current === name) {
            return;
        }

        this.#setCurrent(group, name);
        this.#touch(group, name, current);

        this.log(`Activate mode ${name} in group ${group}.`);

        // Update the tag before any trigger fires, so triggered flows read the new mode.
        await this.#updateToken(group, name);

        // Emit the UI update first so widgets reflect the switch immediately,
        // instead of waiting on the (potentially slow) timeline notifications below.
        await this.#triggerRealtime();

        if (current !== null) {
            await this.#triggerDeactivated(group, current);
        }

        const triggers = [
            this.#triggerCurrentChanged(group, name),
            this.#triggerActivated(group, name),
            this.#triggerChanged(group, name, true)
        ];

        if (current !== null) {
            triggers.push(this.#triggerChanged(group, current, false));
        }

        await Promise.allSettled(triggers);
    }

    async deactivate(group: string, name: string): Promise<void> {
        const current = this.currentModeIn(group);

        if (!name || current !== name) {
            return;
        }

        this.#clearExpiration(group);
        this.#setCurrent(group, null);
        this.#touch(group, name);

        this.log(`Deactivate mode ${name} in group ${group}.`);

        await this.#updateToken(group, null);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(group, name),
            this.#triggerChanged(group, name, false),
            this.#triggerCurrentChanged(group, null)
        ]);
    }

    async reactivate(group: string, name: string): Promise<void> {
        if (!name) {
            return;
        }

        this.#clearExpiration(group);
        this.#setCurrent(group, name);
        this.#touch(group, name);

        this.log(`Reactivate mode ${name} in group ${group}.`);

        await this.#updateToken(group, name);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(group, name),
            this.#triggerChanged(group, name, true),
            this.#triggerCurrentChanged(group, name)
        ]);
    }

    async reactivateCurrent(group: string): Promise<void> {
        const current = this.currentModeIn(group);

        if (current === null) {
            this.log(`No current mode to reactivate in group ${group}.`);
            return;
        }

        await this.reactivate(group, current);
    }

    async toggle(group: string, name: string): Promise<void> {
        if (this.currentModeIn(group) === name) {
            await this.deactivate(group, name);
        } else {
            await this.activate(group, name);
        }
    }

    async activateFor(group: string, name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        // Activate the mode (clears any previous expiration/revert)
        await this.activate(group, name);

        // Schedule plain deactivation; no mode is restored afterwards.
        this.#setExpiresAt(group, DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)}));
        this.#setRevertTo(group, null);

        await this.#scheduleExpiration(group);

        this.log(`Activated mode ${name} in group ${group} for ${duration} ${unit}.`);
    }

    async activateForRevert(group: string, name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        // Remember the mode that was active before switching, so it can be restored.
        const previous = this.currentModeIn(group);

        // Activate the mode (clears any previous expiration/revert)
        await this.activate(group, name);

        if (previous === name) {
            this.log(`Mode ${name} was already active in group ${group}, so there is nothing to revert to.`);
            return;
        }

        this.#setExpiresAt(group, DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)}));
        this.#setRevertTo(group, previous);

        await this.#scheduleExpiration(group);

        this.log(`Activated mode ${name} in group ${group} for ${duration} ${unit}, reverting to ${previous ?? 'no mode'} afterwards.`);
    }

    async isActiveFor(group: string, name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[group]?.[name];

        if (!lastUpdate) {
            return false;
        }

        const isActive = this.currentModeIn(group) === name;

        if (!isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(group: string, name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[group]?.[name];

        if (!lastUpdate) {
            // If there's no lastUpdate, the mode has never been touched, so consider it inactive forever
            return true;
        }

        const isActive = this.currentModeIn(group) === name;

        if (isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    getLook(name: string): Look {
        return this.getLookIn(DEFAULT_MODE_GROUP, name);
    }

    getLookIn(group: string, name: string): Look {
        return this.looks[group]?.[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        await this.setLookIn(DEFAULT_MODE_GROUP, name, look);
    }

    async setLookIn(group: string, name: string, look: Look): Promise<void> {
        const looks = this.looks;

        this.looks = {
            ...looks,
            [group]: {
                ...looks[group] ?? {},
                [name]: look
            }
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#syncTokens();
        await this.#triggerRealtime();
    }

    #clearExpiration(group: string): void {
        const timeout = this.#expirationTimeouts.get(group);

        if (timeout) {
            this.clearTimeout(timeout);
            this.#expirationTimeouts.delete(group);
        }

        if (this.expiresAt[group] != null) {
            this.#setExpiresAt(group, null);
        }

        if (this.revertTo[group] != null) {
            this.#setRevertTo(group, null);
        }
    }

    /**
     * Collects the modes defined on flow cards, keyed by group. The default group is always
     * present, so its stored state survives even when no mode card mentions a mode yet.
     */
    async #definedModes(): Promise<Map<string, Set<string>>> {
        const ungrouped = await this.#autocompleteProvider().find('');
        const defined = new Map<string, Set<string>>();

        defined.set(DEFAULT_MODE_GROUP, new Set(ungrouped.map(mode => mode.name)));

        for (const [group, modes] of this.#groupedAutocompleteProvider().definedModes()) {
            const existing = defined.get(group);

            if (existing) {
                modes.forEach(mode => existing.add(mode));
                continue;
            }

            defined.set(group, new Set(modes));
        }

        return defined;
    }

    /**
     * Moves the pre-groups settings into the default group. Before groups every setting held a
     * single mode's worth of state; afterwards each one is keyed by group. Guarded by a flag
     * rather than by the shape of the data, because a home that never activated a mode still has
     * looks to move.
     */
    #migrateUngroupedSettings(): void {
        if (this.settings.get(SETTING_MODE_GROUPS_MIGRATED) === true) {
            return;
        }

        this.log('Migrating modes to the default group...');

        const current = this.settings.get(SETTING_MODE) as string | null;
        const expiresAt = this.settings.get(SETTING_MODE_EXPIRES_AT) as string | null;
        const revertTo = this.settings.get(SETTING_MODE_REVERT_TO) as string | null;
        const looks = this.settings.get(SETTING_MODE_LOOKS) ?? {};
        const lastUpdates = this.settings.get(SETTING_MODE_LAST_UPDATES) ?? {};

        this.settings.set(SETTING_MODE, {[DEFAULT_MODE_GROUP]: current ?? null});
        this.settings.set(SETTING_MODE_EXPIRES_AT, {[DEFAULT_MODE_GROUP]: expiresAt ?? null});
        this.settings.set(SETTING_MODE_REVERT_TO, {[DEFAULT_MODE_GROUP]: revertTo ?? null});
        this.settings.set(SETTING_MODE_LOOKS, {[DEFAULT_MODE_GROUP]: looks});
        this.settings.set(SETTING_MODE_LAST_UPDATES, {[DEFAULT_MODE_GROUP]: lastUpdates});
        this.settings.set(SETTING_MODE_GROUPS_MIGRATED, true);
    }

    async #processExpiration(group: string): Promise<void> {
        const current = this.currentModeIn(group);
        const expiresAt = this.expiresAt[group] ?? null;

        if (!current || !expiresAt) {
            return;
        }

        // Safety net: the timeout may have fired early due to the MAX_TIMEOUT_MS cap.
        if (expiresAt > DateTime.now()) {
            await this.#scheduleExpiration(group);
            return;
        }

        const revertTo = this.revertTo[group] ?? null;

        if (revertTo) {
            // Restore the previously active mode instead of leaving no mode active.
            await this.activate(group, revertTo);
        } else {
            await this.deactivate(group, current);
        }
    }

    async #scheduleExpiration(group: string): Promise<void> {
        const pending = this.#expirationTimeouts.get(group);

        if (pending) {
            this.clearTimeout(pending);
            this.#expirationTimeouts.delete(group);
        }

        const current = this.currentModeIn(group);
        const expiresAt = this.expiresAt[group] ?? null;

        if (!current || !expiresAt) {
            return;
        }

        const diff = expiresAt.diff(DateTime.now()).as('milliseconds');

        if (diff <= 0) {
            await this.#processExpiration(group);
            return;
        }

        const delay = Math.min(diff, MAX_TIMEOUT_MS);

        this.#expirationTimeouts.set(group, this.setTimeout(async () => {
            this.#expirationTimeouts.delete(group);
            await this.#processExpiration(group);
        }, delay));

        this.log(`Scheduled mode expiration check for group ${group} in ${Math.round(delay / 1000)}s.`);
    }

    #setCurrent(group: string, name: string | null): void {
        this.current = {...this.current, [group]: name};
    }

    #setExpiresAt(group: string, value: DateTime | null): void {
        this.expiresAt = {...this.expiresAt, [group]: value};
    }

    #setRevertTo(group: string, value: string | null): void {
        this.revertTo = {...this.revertTo, [group]: value};
    }

    /**
     * Returns the groups that have state on disk, which is not the same as the groups that are
     * defined on a flow card. Cleanup needs the stored ones so it can drop the leftovers.
     */
    #storedGroups(): string[] {
        return [...new Set([
            DEFAULT_MODE_GROUP,
            ...Object.keys(this.current),
            ...Object.keys(this.expiresAt),
            ...Object.keys(this.revertTo),
            ...Object.keys(this.looks),
            ...Object.keys(this.lastUpdates)
        ])];
    }

    #mapModes(group: string, names: Set<string> | undefined): Mode[] {
        if (!names || names.size === 0) {
            return [];
        }

        const current = this.currentModeIn(group);
        const lastUpdates = this.lastUpdates[group] ?? {};

        return [...names].map(name => {
            const look = this.getLookIn(group, name);

            return {
                active: current === name,
                color: look[0],
                icon: look[1],
                lastUpdate: lastUpdates[name]?.toISO() ?? undefined,
                name
            };
        });
    }

    /**
     * Stamps the mode as changed. The mode being switched away from is stamped too, so the
     * "inactive for" condition measures from the moment it actually went inactive.
     */
    #touch(group: string, name: string, previousName: string | null = null): void {
        const now = DateTime.now();
        const lastUpdates = this.lastUpdates;
        const groupUpdates = {...lastUpdates[group] ?? {}, [name]: now};

        if (previousName !== null) {
            groupUpdates[previousName] = now;
        }

        this.lastUpdates = {...lastUpdates, [group]: groupUpdates};
    }

    /**
     * Keeps one global tag per group that holds its current mode, so any flow card can read it
     * instead of only the current mode changed trigger. Tags follow the groups defined on flow
     * cards: new groups get one and the tags of groups that are gone are unregistered.
     */
    async #syncTokens(): Promise<void> {
        const groups = new Set((await this.#definedModes()).keys());

        for (const group of groups) {
            await this.#updateToken(group, this.currentModeIn(group));
        }

        for (const group of [...this.#tokens.keys()]) {
            if (groups.has(group)) {
                continue;
            }

            const token = this.#tokens.get(group)!;
            this.#tokens.delete(group);

            try {
                this.log(`Unregistering current mode tag for unused mode group ${group}...`);
                await (await token).unregister();
            } catch (err) {
                this.log(`Failed unregistering current mode tag for group ${group}.`, err);
            }
        }
    }

    /**
     * Returns the tag of a group, creating it the first time. The pending promise is cached
     * rather than the token, so concurrent callers never register the same id twice.
     */
    #ensureToken(group: string): Promise<Homey.FlowToken> {
        const existing = this.#tokens.get(group);

        if (existing) {
            return existing;
        }

        const token = this.homey.flow.createToken(this.#tokenId(group), {
            title: group === DEFAULT_MODE_GROUP
                ? this.translate('token.mode_current')
                : this.translate('token.mode_group_current', {group}),
            type: 'string',
            value: this.currentModeIn(group) ?? '-'
        });

        token.catch(() => this.#tokens.delete(group));
        this.#tokens.set(group, token);

        return token;
    }

    /**
     * A token id must stay the same for as long as the group exists, because flows reference
     * the tag by id. Group names are free text in any script, so they are hashed instead of
     * slugified, which would collapse names such as "Освещение" to an empty string.
     */
    #tokenId(group: string): string {
        if (group === DEFAULT_MODE_GROUP) {
            return TOKEN_MODE_CURRENT;
        }

        const hash = createHash('sha1').update(group).digest('hex').slice(0, 16);

        return `${TOKEN_MODE_GROUP_CURRENT_PREFIX}${hash}`;
    }

    async #updateToken(group: string, name: string | null): Promise<void> {
        try {
            const token = await this.#ensureToken(group);
            await token.setValue(name ?? '-');
        } catch (err) {
            this.log(`Failed updating current mode tag for group ${group}.`, err);
        }
    }

    async #triggerActivated(group: string, name: string): Promise<void> {
        if (group === DEFAULT_MODE_GROUP) {
            await this.registry.fireTrigger(Triggers.ModeActivated, {name});
            await this.notify(this.translate('notification.mode_activated', {name}));
            return;
        }

        await this.registry.fireTrigger(Triggers.ModeGroupActivated, {group, name});
        await this.notify(this.translate('notification.mode_group_activated', {name, group}));
    }

    async #triggerChanged(group: string, name: string, active: boolean): Promise<void> {
        if (group === DEFAULT_MODE_GROUP) {
            await this.registry.fireTrigger(Triggers.ModeChanged, {name}, {active});
            return;
        }

        await this.registry.fireTrigger(Triggers.ModeGroupChanged, {group, name}, {active});
    }

    async #triggerCurrentChanged(group: string, name: string | null): Promise<void> {
        if (group === DEFAULT_MODE_GROUP) {
            await this.registry.fireTrigger(Triggers.ModeCurrentChanged, {}, {mode: name ?? '-'});
            return;
        }

        await this.registry.fireTrigger(Triggers.ModeGroupCurrentChanged, {group}, {mode: name ?? '-'});
    }

    async #triggerDeactivated(group: string, name: string): Promise<void> {
        if (group === DEFAULT_MODE_GROUP) {
            await this.registry.fireTrigger(Triggers.ModeDeactivated, {name});
            await this.notify(this.translate('notification.mode_deactivated', {name}));
            return;
        }

        await this.registry.fireTrigger(Triggers.ModeGroupDeactivated, {group, name});
        await this.notify(this.translate('notification.mode_group_deactivated', {name, group}));
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_MODE_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Mode {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Mode);

        if (!provider) {
            throw new Error('Failed to get the mode autocomplete provider.');
        }

        return provider;
    }

    #groupedAutocompleteProvider(): AutocompleteProviders.ModeGroupMode {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.ModeGroupMode);

        if (!provider) {
            throw new Error('Failed to get the mode group mode autocomplete provider.');
        }

        return provider;
    }
}
