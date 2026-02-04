import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_MODE_UPDATE, SETTING_MODE, SETTING_MODE_LOOKS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Look, Mode, Styleable } from '../types';

export default class Modes extends Shortcuts<FlowBitsApp> implements Feature<Mode>, Styleable {
    get currentMode(): string | null {
        return this.settings.get(SETTING_MODE);
    }

    set currentMode(value: string | null) {
        this.settings.set(SETTING_MODE, value);
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_MODE_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_MODE_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused modes...');

        const defined = await this.findAll();
        const looks = this.looks;

        if (this.currentMode && !defined.find(d => d.name === this.currentMode)) {
            this.currentMode = null;
        }

        for (const key of Object.keys(this.looks)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused mode look ${key}...`);
            delete looks[key];
        }

        this.looks = looks;
    }

    async count(): Promise<number> {
        const modes = await this.findAll();

        return modes.length;
    }

    async find(name: string): Promise<Mode | null> {
        const modes = await this.findAll();
        const mode = modes.find(mode => mode.name === name);

        return mode ?? null;
    }

    async findAll(): Promise<Mode[]> {
        const provider = this.#autocompleteProvider();
        const current = this.currentMode;
        const modes = await provider.find('');

        if (modes.length === 0) {
            return [];
        }

        const results: Mode[] = [];

        for (const mode of modes) {
            const look = await this.getLook(mode.name);

            results.push({
                active: current === mode.name,
                color: look[0],
                icon: look[1],
                name: mode.name
            });
        }

        return results;
    }

    async activate(name: string): Promise<void> {
        const current = this.currentMode;

        if (current === name) {
            return;
        }

        if (current !== null) {
            await this.#triggerDeactivated(current);
        }

        this.currentMode = name;

        this.log(`Activate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        const current = this.currentMode;

        if (current !== name) {
            return;
        }

        this.currentMode = null;

        this.log(`Deactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async reactivate(name: string): Promise<void> {
        this.currentMode = name;

        this.log(`Reactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async reactivateCurrent(): Promise<void> {
        const current = this.currentMode;

        if (current === null) {
            this.log('No current mode to reactivate.');
            return;
        }

        await this.reactivate(current);
    }

    async toggle(name: string): Promise<void> {
        if (this.currentMode === name) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    async #triggerActivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeActivated)
            ?.trigger({name});

        await this.notify(this.translate('notification.mode_activated', {name}));
    }

    async #triggerChanged(name: string, active: boolean): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeCurrentChanged)
            ?.trigger({}, {mode: active ? name : '-'});

        this.registry
            .findTrigger(Triggers.ModeChanged)
            ?.trigger({name}, {active});
    }

    async #triggerDeactivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeDeactivated)
            ?.trigger({name});

        await this.notify(this.translate('notification.mode_deactivated', {name}));
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
}
