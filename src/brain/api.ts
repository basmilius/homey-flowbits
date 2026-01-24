import { Shortcuts } from '@basmilius/homey-common';
import type { BitSet, Cycle, Event, Flag, FlowBitsApp, Label, Mode, NoRepeatWindow, Slider, Statistics, Timer } from '../types';

export default class extends Shortcuts<FlowBitsApp> {
    async getCycles(): Promise<Cycle[]> {
        return await this.app.cycles.findAll();
    }

    async getEvents(): Promise<Event[]> {
        return await this.app.events.findAll();
    }

    async setEventLook(eventName: string, color: string, icon: string): Promise<boolean> {
        const event = await this.app.events.find(eventName);

        if (!event) {
            return false;
        }

        await this.app.events.setLook(event.name, [color, icon]);

        return true;
    }

    async activateFlag(flagName: string): Promise<boolean> {
        const flag = await this.app.flags.find(flagName);

        if (!flag || flag.active) {
            return false;
        }

        await this.app.flags.activate(flag.name);

        return true;
    }

    async deactivateFlag(flagName: string): Promise<boolean> {
        const flag = await this.app.flags.find(flagName);

        if (!flag || !flag.active) {
            return false;
        }

        await this.app.flags.deactivate(flag.name);

        return true;
    }

    async toggleFlag(flagName: string): Promise<boolean> {
        const flag = await this.app.flags.find(flagName);

        if (!flag) {
            return false;
        }

        if (flag.active) {
            await this.app.flags.deactivate(flag.name);
        } else {
            await this.app.flags.activate(flag.name);
        }

        return true;
    }

    async getFlags(): Promise<Flag[]> {
        return await this.app.flags.findAll();
    }

    async setFlagLook(flagName: string, color: string, icon: string): Promise<boolean> {
        const flag = await this.app.flags.find(flagName);

        if (!flag) {
            return false;
        }

        await this.app.flags.setLook(flag.name, [color, icon]);

        return true;
    }

    async getLabels(): Promise<Label[]> {
        return await this.app.labels.findAll();
    }

    async setLabelLook(labelName: string, color: string, icon: string): Promise<boolean> {
        const label = await this.app.labels.find(labelName);

        if (!label) {
            return false;
        }

        await this.app.labels.setLook(label.name, [color, icon]);

        return true;
    }

    async activateMode(modeName: string): Promise<boolean> {
        const mode = await this.app.modes.find(modeName);

        if (!mode || mode.active) {
            return false;
        }

        await this.app.modes.activate(mode.name);

        return true;
    }

    async deactivateMode(modeName: string): Promise<boolean> {
        const mode = await this.app.modes.find(modeName);

        if (!mode || !mode.active) {
            return false;
        }

        await this.app.modes.deactivate(mode.name);

        return true;
    }

    async toggleMode(modeName: string): Promise<boolean> {
        const mode = await this.app.modes.find(modeName);

        if (!mode) {
            return false;
        }

        if (mode.active) {
            await this.app.modes.deactivate(mode.name);
        } else {
            await this.app.modes.activate(mode.name);
        }

        return true;
    }

    async getCurrentMode(): Promise<string | null> {
        return this.app.modes.currentMode;
    }

    async getModes(): Promise<Mode[]> {
        return await this.app.modes.findAll();
    }

    async setModeLook(modeName: string, color: string, icon: string): Promise<boolean> {
        const mode = await this.app.modes.find(modeName);

        if (!mode) {
            return false;
        }

        await this.app.modes.setLook(mode.name, [color, icon]);

        return true;
    }

    async getNoRepeatWindows(): Promise<NoRepeatWindow[]> {
        return await this.app.noRepeat.findAll();
    }

    async getSets(): Promise<BitSet[]> {
        return await this.app.sets.findAll();
    }

    async setSetLook(setName: string, color: string, icon: string): Promise<boolean> {
        const set = await this.app.sets.find(setName);

        if (!set) {
            return false;
        }

        await this.app.sets.setLook(set.name, [color, icon]);

        return true;
    }

    async getSliders(): Promise<Slider[]> {
        return await this.app.sliders.findAll();
    }

    async getTimers(): Promise<Timer[]> {
        return await this.app.timers.findAll();
    }

    async setTimerLook(timerName: string, color: string, icon: string): Promise<boolean> {
        const timer = await this.app.timers.find(timerName);

        if (!timer) {
            return false;
        }

        await this.app.timers.setLook(timer.name, [color, icon]);

        return true;
    }

    async getStatistics(): Promise<Statistics> {
        const flags = await this.app.flags.findAll();
        const modes = await this.app.modes.findAll();

        return {
            currentFlags: flags.filter(flag => flag.active).map(flag => flag.name),
            currentMode: modes.find(mode => mode.active)?.name ?? null,

            numberOfCycles: await this.app.cycles.count(),
            numberOfEvents: await this.app.events.count(),
            numberOfFlags: await this.app.flags.count(),
            numberOfLabels: await this.app.labels.count(),
            numberOfModes: await this.app.modes.count(),
            numberOfNoRepeats: await this.app.noRepeat.count(),
            numberOfSets: await this.app.sets.count(),
            numberOfSliders: await this.app.sliders.count(),
            numberOfTimers: await this.app.timers.count(),

            runsPerFlowCard: {},
            usagePerFlowCard: await this.#getStatisticsUsagePerFlowCard()
        };
    }

    async #getStatisticsUsagePerFlowCard(): Promise<Record<string, [string, number]>> {
        const result: Record<string, [string, number]> = {};

        for (const action of this.registry.actions) {
            const values = await action.card.getArgumentValues();
            result[action.id] = [action.card.manifest.titleFormatted[this.language], values.length];
        }

        for (const condition of this.registry.conditions) {
            const values = await condition.card.getArgumentValues();
            result[condition.id] = [condition.card.manifest.titleFormatted[this.language], values.length];
        }

        for (const trigger of this.registry.triggers) {
            const values = await trigger.card.getArgumentValues();
            result[trigger.id] = [trigger.card.manifest.titleFormatted[this.language], values.length];
        }

        return Object.fromEntries(
            Object.entries(result)
                .sort(([a], [b]) => a.localeCompare(b))
        );
    }
}
