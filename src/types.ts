import type App from './index';

export type FlowBitsApp = App;

export type ClockState =
    | 'finished'
    | 'running'
    | 'paused'
    | 'stopped';

export type ClockUnit =
    | 'seconds'
    | 'minutes'
    | 'hours'
    | 'days';

export interface Feature<TInstance> {
    cleanup(): Promise<void>;

    count(): Promise<number>;

    find(name: string): Promise<TInstance | null>;

    findAll(): Promise<TInstance[]>;
}

export interface Styleable {
    get looks(): Record<string, Look>;

    set looks(looks: Record<string, Look>);

    getLook(name: string): Promise<Look>;

    setLook(name: string, look: Look): Promise<void>;
}

export type WithLook<T> = T & {
    readonly color: string | undefined;
    readonly icon: string | undefined;
};

export type BitSet = WithLook<{
    readonly name: string;
    readonly states: BitSetState[];
    readonly allActive: boolean;
    readonly anyActive: boolean;
}>;

export type BitSetState = {
    readonly name: string;
    readonly active: boolean;
    readonly lastUpdate: string | undefined;
    readonly expiresAt: string | undefined;
};

export type Cycle = {
    readonly name: string;
    readonly step: number;
};

export type Event = WithLook<{
    readonly lastUpdate: string | undefined;
    readonly name: string;
}>;

export type Flag = WithLook<{
    readonly active: boolean;
    readonly name: string;
}>;

export type Label = WithLook<{
    readonly lastUpdate: string | undefined;
    readonly name: string;
    readonly value: string | undefined;
}>;

export type Mode = WithLook<{
    readonly active: boolean;
    readonly name: string;
}>;

export type NoRepeatWindow = {
    readonly name: string;
    readonly lastUpdate: string | undefined;
};

export type Slider = {
    readonly name: string;
    readonly value: number;
};

export type Timer = WithLook<{
    readonly name: string;
    readonly remaining: number;
    readonly status: ClockState;
    readonly target: number;
}>;

export type Look = [color: string, icon: string];

export type Statistics = {
    readonly currentFlags: string[];
    readonly currentMode: string | null;
    readonly numberOfCycles: number;
    readonly numberOfEvents: number;
    readonly numberOfFlags: number;
    readonly numberOfLabels: number;
    readonly numberOfModes: number;
    readonly numberOfNoRepeats: number;
    readonly numberOfSets: number;
    readonly numberOfSliders: number;
    readonly numberOfTimers: number;
    readonly runsPerFlowCard: Record<string, [string, number]>;
    readonly usagePerFlowCard: Record<string, [string, number]>;
};
