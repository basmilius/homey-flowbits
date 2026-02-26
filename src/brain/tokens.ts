import { DateTime, Shortcuts, Trigger } from '@basmilius/homey-common';
import { Triggers } from '../flow';
import type { FlowBitsApp } from '../types';
import { getDayPeriod, getMoonPhase, getZodiacSign } from '../util';
import type Homey from 'homey';

type Provider<T extends string | boolean | number> = (state: State) => T;
type Translator<T> = (value: T) => string;

type State = {
    readonly now: DateTime;
};

type RawToken = [Homey.FlowToken, Provider<string | boolean | number>];
type TranslatedToken = [...RawToken, Homey.FlowToken, Translator<any>];
type Token = RawToken | TranslatedToken;

const TRIGGERS: Record<string, Trigger<FlowBitsApp, any>[]> = {
    day_period: [
        Triggers.DayPeriodBecomes,
        Triggers.DayPeriodOver
    ]
};

export default class Tokens extends Shortcuts<FlowBitsApp> {
    readonly #tokens: Record<string, Token> = {};
    readonly #values: Record<string, string | boolean | number> = {};

    async initialize(): Promise<void> {
        const state = this.#state();

        await this.#create('day_period', 'string', state, ({now}) => getDayPeriod(now), value => this.translate(`day_period.${value}`));
        await this.#create('moon_phase', 'string', state, ({now}) => getMoonPhase(now), value => this.translate(`moon_phase.${value}`));
        await this.#create('zodiac_sign', 'string', state, ({now}) => getZodiacSign(now), value => this.translate(`zodiac_sign.${value}`));

        this.setInterval(async () => await this.#update(), 15 * 1000);
    }

    async #create<T extends string | boolean | number>(id: string, type: string, state: State, provider: Provider<T>, translator?: Translator<T>): Promise<void> {
        const value = provider(state);
        this.#values[id] = value;

        const token = await this.homey.flow.createToken(id, {
            title: this.translate(`token.${id}`),
            type,
            value
        });

        if (translator) {
            const translated = await this.homey.flow.createToken(`${id}_translated`, {
                title: this.translate(`token.${id}_translated`),
                type: 'string',
                value: translator(value)?.toString() ?? ''
            });

            this.#tokens[id] = [token, provider, translated, translator];
        } else {
            this.#tokens[id] = [token, provider];
        }
    }

    #state(): State {
        return {
            now: DateTime.now()
        };
    }

    async #update(): Promise<void> {
        const state = this.#state();

        for (const [id, [token, provider, translated, translator]] of Object.entries(this.#tokens)) {
            const value = provider(state);
            const previousValue = this.#values[id];

            if (value === previousValue) {
                continue;
            }

            if (id in TRIGGERS) {
                const triggers = TRIGGERS[id];

                for (const trigger of triggers) {
                    this.registry
                        .findTrigger(trigger)
                        ?.trigger({
                            value,
                            previousValue
                        });
                }
            }

            this.#values[id] = value;
            await token.setValue(value);

            translated && translator && await translated.setValue(translator(value)?.toString() ?? '');
        }

        this.log('Global tokens updated.');
    }
}
