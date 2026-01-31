import { App, Luxon } from '@basmilius/homey-common';
import type { Api, Cycles, Events, Flags, Labels, Modes, NoRepeat, Sets, Signals, Sliders, Timers, Tokens, Widgets } from './brain';
import { Brain } from './brain';
import { Actions, AutocompleteProviders, Conditions, Triggers } from './flow';
import { roundStep } from './util';

export default class FlowBitsApp extends App<FlowBitsApp> {
    get api(): Api {
        return this.#brain.api;
    }

    get cycles(): Cycles {
        return this.#brain.cycles;
    }

    get events(): Events {
        return this.#brain.events;
    }

    get flags(): Flags {
        return this.#brain.flags;
    }

    get labels(): Labels {
        return this.#brain.labels;
    }

    get modes(): Modes {
        return this.#brain.modes;
    }

    get noRepeat(): NoRepeat {
        return this.#brain.noRepeat;
    }

    get sets(): Sets {
        return this.#brain.sets;
    }

    get signals(): Signals {
        return this.#brain.signals;
    }

    get sliders(): Sliders {
        return this.#brain.sliders;
    }

    get timers(): Timers {
        return this.#brain.timers;
    }

    get tokens(): Tokens {
        return this.#brain.tokens;
    }

    get widgets(): Widgets {
        return this.#brain.widgets;
    }

    readonly #brain: Brain;

    constructor(...args: any[]) {
        super(...args);

        this.#brain = new Brain(this);
    }

    async onInit(): Promise<void> {
        try {
            Luxon.defaultZone = this.homey.clock.getTimezone();

            this.#registerAutocompleteProviders();
            this.#registerActions();
            this.#registerConditions();
            this.#registerTriggers();
            this.#registerActionFunctions();

            for (const provider of this.registry.autocompleteProviders) {
                await provider.onInit();
            }

            await this.sets.initialize();
            await this.timers.initialize();
            await this.tokens.initialize();
            await this.widgets.initialize();

            await this.#brain.cleanup();
            await this.#brain.welcome();

            this.log('FlowBits has been initialized!');
        } catch (err) {
            this.error('Failed initializing FlowBits.', err);
        }
    }

    #registerActions(): void {
        this.registry.action(Actions.Cycle);
        this.registry.action(Actions.CycleBetween);
        this.registry.action(Actions.CycleTo);
        this.registry.action(Actions.EventClear);
        this.registry.action(Actions.EventClearAll);
        this.registry.action(Actions.EventTrigger);
        this.registry.action(Actions.FlagActivate);
        this.registry.action(Actions.FlagDeactivate);
        this.registry.action(Actions.FlagToggle);
        this.registry.action(Actions.LabelClear);
        this.registry.action(Actions.LabelSet);
        this.registry.action(Actions.ModeActivate);
        this.registry.action(Actions.ModeDeactivate);
        this.registry.action(Actions.ModeReactivate);
        this.registry.action(Actions.ModeToggle);
        this.registry.action(Actions.NoRepeatClear);
        this.registry.action(Actions.RandomFact);
        this.registry.action(Actions.SetActivateAll);
        this.registry.action(Actions.SetActivateState);
        this.registry.action(Actions.SetActivateStateExclusive);
        this.registry.action(Actions.SetActivateStateExclusiveFor);
        this.registry.action(Actions.SetActivateStateFor);
        this.registry.action(Actions.SetDeactivateAll);
        this.registry.action(Actions.SetDeactivateState);
        this.registry.action(Actions.SetToggleState);
        this.registry.action(Actions.SetToggleStateFor);
        this.registry.action(Actions.SignalSend);
        this.registry.action(Actions.SliderSet);
        this.registry.action(Actions.TimerPause);
        this.registry.action(Actions.TimerResume);
        this.registry.action(Actions.TimerSet);
        this.registry.action(Actions.TimerStart);
        this.registry.action(Actions.TimerStop);
        this.registry.action(Actions.UtilityPercentageBetweenTimestamps);
    }

    #registerActionFunctions(): void {
        this.registry.actionFunction('z_math_decrement', args => ({result: args.value - args.step}));
        this.registry.actionFunction('z_math_divide', args => ({result: args.value / args.divisor}));
        this.registry.actionFunction('z_math_increment', args => ({result: args.value + args.step}));
        this.registry.actionFunction('z_math_make_negative', args => ({result: args.value < 0 ? args.value : -args.value}));
        this.registry.actionFunction('z_math_make_positive', args => ({result: Math.abs(args.value)}));
        this.registry.actionFunction('z_math_multiply', args => ({result: args.value * args.factor}));
        this.registry.actionFunction('z_math_round', args => ({result: Math.round(args.value)}));
        this.registry.actionFunction('z_math_round_down', args => ({result: Math.floor(args.value)}));
        this.registry.actionFunction('z_math_round_step', args => ({result: roundStep(args.value, args.step)}));
        this.registry.actionFunction('z_math_round_up', args => ({result: Math.ceil(args.value)}));
    }

    #registerAutocompleteProviders(): void {
        this.registry.autocompleteProvider(AutocompleteProviders.Cycle);
        this.registry.autocompleteProvider(AutocompleteProviders.Event);
        this.registry.autocompleteProvider(AutocompleteProviders.Flag);
        this.registry.autocompleteProvider(AutocompleteProviders.Label);
        this.registry.autocompleteProvider(AutocompleteProviders.Mode);
        this.registry.autocompleteProvider(AutocompleteProviders.NoRepeat);
        this.registry.autocompleteProvider(AutocompleteProviders.SchoolVacation);
        this.registry.autocompleteProvider(AutocompleteProviders.Set);
        this.registry.autocompleteProvider(AutocompleteProviders.SetState);
        this.registry.autocompleteProvider(AutocompleteProviders.Signal);
        this.registry.autocompleteProvider(AutocompleteProviders.Slider);
        this.registry.autocompleteProvider(AutocompleteProviders.Timer);
    }

    #registerConditions(): void {
        this.registry.condition(Conditions.ContinueWithChance);
        this.registry.condition(Conditions.CycleHasValue);
        this.registry.condition(Conditions.DayPeriodIs);
        this.registry.condition(Conditions.DiceRolls);
        this.registry.condition(Conditions.EventHappened);
        this.registry.condition(Conditions.EventHappenedTimesToday);
        this.registry.condition(Conditions.EventHappenedTimesWithin);
        this.registry.condition(Conditions.EventHappenedToday);
        this.registry.condition(Conditions.EventHappenedWithin);
        this.registry.condition(Conditions.FlagIs);
        this.registry.condition(Conditions.LabelHasValue);
        this.registry.condition(Conditions.ModeIs);
        this.registry.condition(Conditions.MoonPhaseIs);
        this.registry.condition(Conditions.NoRepeatWindow);
        this.registry.condition(Conditions.SchoolHolidayIs);
        this.registry.condition(Conditions.SetActiveAll);
        this.registry.condition(Conditions.SetActiveAny);
        this.registry.condition(Conditions.SetInactive);
        this.registry.condition(Conditions.SetStateIs);
        this.registry.condition(Conditions.TimerDuration);
        this.registry.condition(Conditions.TimerFinished);
        this.registry.condition(Conditions.TimerPaused);
        this.registry.condition(Conditions.TimerRunning);
        this.registry.condition(Conditions.ZodiacSignIs);
    }

    #registerTriggers(): void {
        this.registry.trigger(Triggers.CycleBecomes);
        this.registry.trigger(Triggers.CycleUpdates);
        this.registry.trigger(Triggers.DayPeriodBecomes);
        this.registry.trigger(Triggers.DayPeriodOver);
        this.registry.trigger(Triggers.EventCleared);
        this.registry.trigger(Triggers.EventTriggered);
        this.registry.trigger(Triggers.FlagActivated);
        this.registry.trigger(Triggers.FlagChanged);
        this.registry.trigger(Triggers.FlagDeactivated);
        this.registry.trigger(Triggers.LabelBecomes);
        this.registry.trigger(Triggers.LabelChanged);
        this.registry.trigger(Triggers.ModeActivated);
        this.registry.trigger(Triggers.ModeChanged);
        this.registry.trigger(Triggers.ModeCurrentChanged);
        this.registry.trigger(Triggers.ModeDeactivated);
        this.registry.trigger(Triggers.SetBecomesActiveAll);
        this.registry.trigger(Triggers.SetBecomesActiveAny);
        this.registry.trigger(Triggers.SetBecomesInactive);
        this.registry.trigger(Triggers.SetBecomesInactiveAll);
        this.registry.trigger(Triggers.SetChanged);
        this.registry.trigger(Triggers.SetStateActivated);
        this.registry.trigger(Triggers.SetStateChanged);
        this.registry.trigger(Triggers.SetStateDeactivated);
        this.registry.trigger(Triggers.SignalReceive);
        this.registry.trigger(Triggers.SliderChanged);
        this.registry.trigger(Triggers.TimerFinished);
        this.registry.trigger(Triggers.TimerPaused);
        this.registry.trigger(Triggers.TimerRemaining);
        this.registry.trigger(Triggers.TimerResumed);
        this.registry.trigger(Triggers.TimerStarted);
        this.registry.trigger(Triggers.TimerStopped);
    }
}
