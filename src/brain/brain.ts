import { Shortcuts } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../types';
import Api from './api';
import Cycles from './cycles';
import Events from './events';
import Flags from './flags';
import Labels from './labels';
import Modes from './modes';
import NoRepeat from './noRepeat';
import Sets from './sets';
import Signals from './signals';
import Sliders from './sliders';
import Timers from './timers';
import Tokens from './tokens';
import Widgets from './widgets';

export default class Brain extends Shortcuts<FlowBitsApp> {
    get api(): Api {
        return this.#api;
    }

    get cycles(): Cycles {
        return this.#cycles;
    }

    get events(): Events {
        return this.#events;
    }

    get flags(): Flags {
        return this.#flags;
    }

    get labels(): Labels {
        return this.#labels;
    }

    get modes(): Modes {
        return this.#modes;
    }

    get noRepeat(): NoRepeat {
        return this.#noRepeat;
    }

    get sets(): Sets {
        return this.#sets;
    }

    get signals(): Signals {
        return this.#signals;
    }

    get sliders(): Sliders {
        return this.#sliders;
    }

    get timers(): Timers {
        return this.#timers;
    }

    get tokens(): Tokens {
        return this.#tokens;
    }

    get widgets(): Widgets {
        return this.#widgets;
    }

    readonly #api: Api;
    readonly #cycles: Cycles;
    readonly #events: Events;
    readonly #flags: Flags;
    readonly #labels: Labels;
    readonly #modes: Modes;
    readonly #noRepeat: NoRepeat;
    readonly #sets: Sets;
    readonly #signals: Signals;
    readonly #sliders: Sliders;
    readonly #timers: Timers;
    readonly #tokens: Tokens;
    readonly #widgets: Widgets;

    constructor(app: FlowBitsApp) {
        super(app);

        this.#api = new Api(app);
        this.#cycles = new Cycles(app);
        this.#events = new Events(app);
        this.#flags = new Flags(app);
        this.#labels = new Labels(app);
        this.#modes = new Modes(app);
        this.#noRepeat = new NoRepeat(app);
        this.#sets = new Sets(app);
        this.#signals = new Signals(app);
        this.#sliders = new Sliders(app);
        this.#timers = new Timers(app);
        this.#tokens = new Tokens(app);
        this.#widgets = new Widgets(app);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up...');

        await Promise.allSettled([
            this.cycles.cleanup(),
            this.events.cleanup(),
            this.flags.cleanup(),
            this.labels.cleanup(),
            this.modes.cleanup(),
            this.noRepeat.cleanup(),
            this.sets.cleanup(),
            this.sliders.cleanup(),
            this.timers.cleanup()
        ]);

        this.log('Cleanup done.');
    }

    async welcome(): Promise<void> {
        const welcomeId = this.settings.getKeys().includes('welcomeId')
            ? this.settings.get('welcomeId')
            : 0;

        if (welcomeId >= 1) {
            return;
        }

        await this.homey.notifications.createNotification({
            excerpt: this.translate('notification.welcome')
        });

        this.settings.set('welcomeId', 1);
    }
}
