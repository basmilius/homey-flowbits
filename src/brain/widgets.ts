import { Shortcuts } from '@basmilius/homey-common';
import { DEFAULT_MODE_GROUP } from '../const';
import type { FlowBitsApp } from '../types';
import { createFilterAutocomplete, searchIcons } from '../util';

export default class Widgets extends Shortcuts<FlowBitsApp> {
    async initialize(): Promise<void> {
        await this.#initializeEvent();
        await this.#initializeFlagOnOff();
        await this.#initializeFlags();
        await this.#initializeLabel();
        await this.#initializeModeCurrent();
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

    async #initializeModeCurrent(): Promise<void> {
        const widget = this.dashboards.getWidget('mode_current');

        widget.registerSettingAutocompleteListener('group', async query => await this.#groupAutocomplete(query));
    }

    async #initializeModes(): Promise<void> {
        const widget = this.dashboards.getWidget('modes');

        widget.registerSettingAutocompleteListener('group', async query => await this.#groupAutocomplete(query));

        widget.registerSettingAutocompleteListener('filter', async (query: string, settings: Record<string, any>) => {
            const modes = await this.app.modes.findAllIn(settings?.group?.name || DEFAULT_MODE_GROUP);
            const allNames = Array
                .from(new Set(modes.map(f => f.name.trim())))
                .toSorted((a, b) => a.localeCompare(b));

            return createFilterAutocomplete(allNames, query, {
                itemsField: 'modes'
            });
        });
    }

    /**
     * Lists the named mode groups. The default group is left out: a widget picks it by leaving
     * the setting empty.
     */
    async #groupAutocomplete(query: string): Promise<{ name: string }[]> {
        const groups = await this.app.api.getModeGroups();
        const search = query.toLowerCase();

        return groups
            .filter(group => group.name !== DEFAULT_MODE_GROUP)
            .filter(group => group.name.toLowerCase().includes(search))
            .map(group => ({name: group.name}));
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
