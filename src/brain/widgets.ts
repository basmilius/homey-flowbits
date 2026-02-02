import { Shortcuts } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../types';
import { createFilterAutocomplete, searchIcons } from '../util';

export default class Widgets extends Shortcuts<FlowBitsApp> {
    async initialize(): Promise<void> {
        await this.#initializeEvent();
        await this.#initializeFlagOnOff();
        await this.#initializeFlags();
        await this.#initializeLabel();
        await this.#initializeModes();
        await this.#initializeSetStates();
        await this.#initializeSetStatus();
        await this.#initializeSlider();
        await this.#initializeTimer();
    }

    async #initializeEvent(): Promise<void> {
        const widget = this.dashboards.getWidget('event');

        widget.registerSettingAutocompleteListener('event', async () => {
            const events = await this.app.api.getEvents();

            return events.map(event => ({
                name: event.name
            }));
        });
    }

    async #initializeFlagOnOff(): Promise<void> {
        const widget = this.dashboards.getWidget('flag_onoff');

        widget.registerSettingAutocompleteListener('flag', async () => {
            const flags = await this.app.api.getFlags();

            return flags.map(flag => ({
                name: flag.name
            }));
        });
    }

    async #initializeFlags(): Promise<void> {
        const widget = this.dashboards.getWidget('flags');

        widget.registerSettingAutocompleteListener('filter', async (query: string) => {
            const flags = await this.app.flags.findAll();
            const allNames = Array
                .from(new Set(flags.map(f => f.name.trim())))
                .toSorted((a, b) => a.localeCompare(b));

            return createFilterAutocomplete(allNames, query, {
                itemsField: 'flags'
            });
        });
    }

    async #initializeLabel(): Promise<void> {
        const widget = this.dashboards.getWidget('label');

        widget.registerSettingAutocompleteListener('label', async () => {
            const labels = await this.app.api.getLabels();

            return labels.map(label => ({
                name: label.name
            }));
        });
    }

    async #initializeModes(): Promise<void> {
        const widget = this.dashboards.getWidget('modes');

        widget.registerSettingAutocompleteListener('filter', async (query: string) => {
            const modes = await this.app.modes.findAll();
            const allNames = Array
                .from(new Set(modes.map(f => f.name.trim())))
                .toSorted((a, b) => a.localeCompare(b));

            return createFilterAutocomplete(allNames, query, {
                itemsField: 'modes'
            });
        });
    }

    async #initializeSetStates(): Promise<void> {
        const widget = this.dashboards.getWidget('set_states');

        widget.registerSettingAutocompleteListener('set', async () => {
            const sets = await this.app.api.getSets();

            return sets.map(set => ({
                name: set.name
            }));
        });
    }

    async #initializeSetStatus(): Promise<void> {
        const widget = this.dashboards.getWidget('set_status');

        widget.registerSettingAutocompleteListener('set', async () => {
            const sets = await this.app.api.getSets();

            return sets.map(set => ({
                name: set.name
            }));
        });
    }

    async #initializeSlider(): Promise<void> {
        const widget = this.dashboards.getWidget('slider');

        widget.registerSettingAutocompleteListener('slider', async (query) => {
            const sliders = await this.app.api.getSliders();

            return sliders.map(slider => ({
                name: slider.name
            }));
        });

        widget.registerSettingAutocompleteListener('icon', searchIcons);
    }

    async #initializeTimer(): Promise<void> {
        const widget = this.dashboards.getWidget('timer');

        widget.registerSettingAutocompleteListener('timer', async () => {
            const timers = await this.app.api.getTimers();

            return timers.map(timer => ({
                name: timer.name
            }));
        });
    }
}
