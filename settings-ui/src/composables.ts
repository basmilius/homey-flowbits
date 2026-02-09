import type { Color, Icon } from '@basmilius/homey-common';
import { provide, type Ref, ref } from 'vue';
import { COLORS, ICONS } from './symbols';
import type { BitSet, Event, FeatureType, Flag, FormLook, Item, Label, Mode, Statistics, Timer } from './types';

const EMPTY_STATISTICS: Statistics = {
    currentFlags: [],
    currentMode: null,
    numberOfCycles: 0,
    numberOfEvents: 0,
    numberOfFlags: 0,
    numberOfLabels: 0,
    numberOfModes: 0,
    numberOfNoRepeats: 0,
    numberOfSets: 0,
    numberOfSliders: 0,
    numberOfTimers: 0,
    runsPerFlowCard: {},
    usagePerFlowCard: {}
};

export function useTranslate() {
    return (key: string) => Homey.__(key) ?? key;
}

export function useColors() {
    const items = ref<Color[]>([]);
    const isLoading = ref(false);

    async function load() {
        isLoading.value = true;
        items.value = await Homey.api('GET', '/colors');
        isLoading.value = false;
    }

    provide(COLORS, items);

    return {
        isLoading,
        items,

        load
    };
}

export function useIcons() {
    const items = ref<Icon[]>([]);
    const isLoading = ref(false);

    async function load() {
        isLoading.value = true;
        items.value = await Homey.api('GET', '/icons');
        isLoading.value = false;
    }

    provide(ICONS, items);

    return {
        isLoading,
        items,

        load
    };
}

export function useEvents() {
    return composeList<Event>('/events');
}

export function useFlags() {
    return composeList<Flag>('/flags');
}

export function useLabels() {
    return composeList<Label>('/labels');
}

export function useModes() {
    return composeList<Mode>('/modes');
}

export function useSets() {
    return composeList<BitSet>('/sets');
}

export function useTimers() {
    return composeList<Timer>('/timers');
}

export function useStatistics() {
    const result = ref<Statistics>(EMPTY_STATISTICS);
    const isLoading = ref(false);

    const load = async () => {
        isLoading.value = true;
        result.value = await Homey.api('GET', '/statistics');
        isLoading.value = false;
    };

    return {
        isLoading,
        result,
        load
    };
}

export function composeEdit(type: FeatureType, editingItem: Ref<Item | null>, editingType: Ref<FeatureType | null>) {
    return (item: Item) => {
        editingItem.value = item;
        editingType.value = type;
    };
}

export function composeList<T>(endpoint: string) {
    const items = ref<T[]>([]);
    const isLoading = ref(true);

    const load = async () => {
        isLoading.value = true;
        items.value = await Homey.api('GET', endpoint);
        isLoading.value = false;
    };

    return {
        isLoading,
        items,
        load
    };
}

export function composeSave(endpoint: string, editingItem: Ref<Item | null>, editingType: Ref<FeatureType | null>, isSaving: Ref<boolean>, fn: () => Promise<void>) {
    return async (name: string, look: FormLook) => {
        isSaving.value = true;

        await Homey.api('POST', endpoint, {
            name,
            color: look.color,
            icon: look.icon
        });

        await fn();

        editingItem.value = null;
        editingType.value = null;
        isSaving.value = false;
    };
}
