<template>
    <Top
        :title="t('settings.title')"
        :subtitle="t('settings.subtitle')"/>

    <Form>
        <Documentation/>

        <Category
            :title="t('settings.modes.title')"
            :description="t('settings.modes.description')"
            :empty="t('settings.modes.empty')"
            :items="modeItems"
            @edit="onEditModeItem"/>

        <Category
            :title="t('settings.flags.title')"
            :description="t('settings.flags.description')"
            :empty="t('settings.flags.empty')"
            :items="flags"
            @edit="onEditFlag"/>

        <Category
            :title="t('settings.timers.title')"
            :description="t('settings.timers.description')"
            :empty="t('settings.timers.empty')"
            :items="timers"
            @edit="onEditTimer"/>

        <Category
            :title="t('settings.labels.title')"
            :description="t('settings.labels.description')"
            :empty="t('settings.labels.empty')"
            :items="labels"
            @edit="onEditLabel"/>

        <Category
            :title="t('settings.sets.title')"
            :description="t('settings.sets.description')"
            :empty="t('settings.sets.empty')"
            :items="sets"
            @edit="onEditSet"/>

        <Category
            :title="t('settings.events.title')"
            :description="t('settings.events.description')"
            :empty="t('settings.events.empty')"
            :items="events"
            @edit="onEditEvent"/>

        <Statistics/>

        <ButtonTransparent
            :label="t('settings.card_statistics.open')"
            @click="isShowingCardStatistics = true"/>
    </Form>

    <Transition name="overlay">
        <Edit
            v-if="editingItem"
            :is-saving="isSaving"
            :item="editingItem"
            @close="onCloseEdit()"
            @save="onSaveItem"/>
    </Transition>

    <Transition name="overlay">
        <Overlay
            v-if="isShowingCardStatistics"
            :label="t('settings.card_statistics.title')"
            @close="isShowingCardStatistics = false">
            <CardStatistics/>

            <ButtonTransparent
                :label="t('settings.close')"
                @click="isShowingCardStatistics = false"/>
        </Overlay>
    </Transition>
</template>

<script
    lang="ts"
    setup>
    import { computed, onMounted, ref, unref } from 'vue';
    import { ButtonTransparent, CardStatistics, Category, Documentation, Edit, Form, Overlay, Statistics, Top } from './components';
    import { composeEdit, composeSave, useColors, useEvents, useFlags, useIcons, useLabels, useModeGroups, useSets, useTimers, useTranslate } from './composables';
    import { DEFAULT_MODE_GROUP } from '../../src/const';
    import type { FeatureType, FormLook, Item } from './types';

    const t = useTranslate();
    const {load: loadColors} = useColors();
    const {load: loadIcons} = useIcons();
    const {items: events, load: loadEvents} = useEvents();
    const {items: flags, load: loadFlags} = useFlags();
    const {items: labels, load: loadLabels} = useLabels();
    const {items: modeGroups, load: loadModeGroups} = useModeGroups();
    const {items: sets, load: loadSets} = useSets();
    const {items: timers, load: loadTimers} = useTimers();

    // The default group comes first, the named ones alphabetically after it.
    const modeItems = computed<ModeItem[]>(() => [...modeGroups.value]
        .sort((a, b) => {
            if (a.name === b.name) {
                return 0;
            }

            if (a.name === DEFAULT_MODE_GROUP) {
                return -1;
            }

            return b.name === DEFAULT_MODE_GROUP ? 1 : a.name.localeCompare(b.name);
        })
        .flatMap(group => group.modes.map(mode => ({
            ...mode,
            caption: group.name === DEFAULT_MODE_GROUP ? undefined : group.name,
            group: group.name
        })))
    );

    const editingItem = ref<Item | null>(null);
    const editingType = ref<FeatureType | null>(null);

    /** The group the mode being edited belongs to. Always set, so saving never has to guess. */
    const editingGroup = ref<string>(DEFAULT_MODE_GROUP);
    const isSaving = ref(false);
    const isShowingCardStatistics = ref(false);

    const onEditEvent = composeEdit('event', editingItem, editingType);
    const onEditFlag = composeEdit('flag', editingItem, editingType);
    const onEditLabel = composeEdit('label', editingItem, editingType);
    const onEditMode = composeEdit('mode', editingItem, editingType);
    const onEditSet = composeEdit('set', editingItem, editingType);
    const onEditTimer = composeEdit('timer', editingItem, editingType);

    const onSaveEvent = composeSave('/events/look', editingItem, editingType, isSaving, loadEvents);
    const onSaveFlag = composeSave('/flags/look', editingItem, editingType, isSaving, loadFlags);
    const onSaveLabel = composeSave('/labels/look', editingItem, editingType, isSaving, loadLabels);
    const onSaveMode = composeSave('/modes/look', editingItem, editingType, isSaving, loadModeGroups, () => ({group: editingGroup.value}));
    const onSaveSet = composeSave('/sets/look', editingItem, editingType, isSaving, loadSets);
    const onSaveTimer = composeSave('/timers/look', editingItem, editingType, isSaving, loadTimers);

    onMounted(async () => {
        try {
            await Promise.allSettled([
                loadColors(),
                loadIcons()
            ]);

            await Promise.allSettled([
                loadEvents(),
                loadFlags(),
                loadLabels(),
                loadModeGroups(),
                loadSets(),
                loadTimers()
            ]);
        } finally {
            // Report ready whatever happened: an endpoint that never answers would otherwise
            // leave the page on its loading screen forever.
            Homey.ready();
        }
    });

    function onCloseEdit() {
        editingItem.value = null;
        editingType.value = null;
        editingGroup.value = DEFAULT_MODE_GROUP;
    }

    function onEditModeItem(item: Item): void {
        editingGroup.value = (item as ModeItem).group;
        onEditMode(item);
    }

    function onSaveItem(name: string, look: FormLook) {
        switch (unref(editingType)) {
            case 'event':
                return onSaveEvent(name, look);

            case 'flag':
                return onSaveFlag(name, look);

            case 'label':
                return onSaveLabel(name, look);

            case 'mode':
                return onSaveMode(name, look);

            case 'set':
                return onSaveSet(name, look);

            case 'timer':
                return onSaveTimer(name, look);

            default:
                return;
        }
    }

    type ModeItem = Item & {
        readonly group: string;
    };
</script>

<style
    lang="scss"
    module>
    :global(.overlay-enter-active),
    :global(.overlay-leave-active) {
        transition: opacity 420ms cubic-bezier(0.55, 0, 0.1, 1);
    }

    :global(.overlay-enter-from),
    :global(.overlay-leave-to) {
        opacity: 0;
    }
</style>
