export type {
    BitSet,
    BitSetState,
    ClockState,
    ClockUnit,
    Cycle,
    Event,
    Flag,
    Label,
    Look,
    Mode,
    NoRepeatWindow,
    Slider,
    Statistics,
    Timer
} from '../../src/types';

export type FeatureType =
    | 'event'
    | 'flag'
    | 'label'
    | 'mode'
    | 'mode_set'
    | 'set'
    | 'timer';

export type FormLook = {
    readonly color: string;
    readonly icon: string;
};

export type Item = {
    name: string;
    color: string | undefined;
    icon: string | undefined;
};
