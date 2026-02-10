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
            :items="modes"
            @edit="onEditMode"/>

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
    </Form>

    <Transition name="edit">
        <Edit
            v-if="editingItem"
            :is-saving="isSaving"
            :item="editingItem"
            @close="onCloseEdit()"
            @save="onSaveItem"/>
    </Transition>
</template>

<script
    lang="ts"
    setup>
    import { onMounted, ref, unref } from 'vue';
    import { Category, Documentation, Edit, Form, Statistics, Top } from './components';
    import { composeEdit, composeSave, useColors, useEvents, useFlags, useIcons, useLabels, useModes, useSets, useTimers, useTranslate } from './composables';
    import type { FeatureType, FormLook, Item } from './types';

    const t = useTranslate();
    const {load: loadColors} = useColors();
    const {load: loadIcons} = useIcons();
    const {items: events, load: loadEvents} = useEvents();
    const {items: flags, load: loadFlags} = useFlags();
    const {items: labels, load: loadLabels} = useLabels();
    const {items: modes, load: loadModes} = useModes();
    const {items: sets, load: loadSets} = useSets();
    const {items: timers, load: loadTimers} = useTimers();

    const editingItem = ref<Item | null>(null);
    const editingType = ref<FeatureType | null>(null);
    const isSaving = ref(false);

    const onEditEvent = composeEdit('event', editingItem, editingType);
    const onEditFlag = composeEdit('flag', editingItem, editingType);
    const onEditLabel = composeEdit('label', editingItem, editingType);
    const onEditMode = composeEdit('mode', editingItem, editingType);
    const onEditSet = composeEdit('set', editingItem, editingType);
    const onEditTimer = composeEdit('timer', editingItem, editingType);

    const onSaveEvent = composeSave('/events/look', editingItem, editingType, isSaving, loadEvents);
    const onSaveFlag = composeSave('/flags/look', editingItem, editingType, isSaving, loadFlags);
    const onSaveLabel = composeSave('/labels/look', editingItem, editingType, isSaving, loadLabels);
    const onSaveMode = composeSave('/modes/look', editingItem, editingType, isSaving, loadModes);
    const onSaveSet = composeSave('/sets/look', editingItem, editingType, isSaving, loadSets);
    const onSaveTimer = composeSave('/timers/look', editingItem, editingType, isSaving, loadTimers);

    onMounted(async () => {
        await Promise.allSettled([
            loadColors(),
            loadIcons()
        ]);

        await Promise.allSettled([
            loadEvents(),
            loadFlags(),
            loadLabels(),
            loadModes(),
            loadSets(),
            loadTimers()
        ]);

        Homey.ready();
    });

    function onCloseEdit() {
        editingItem.value = null;
        editingType.value = null;
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
</script>

<style
    lang="scss"
    module>
    :global(.edit-enter-active),
    :global(.edit-leave-active),
    :global(.edit-enter-active) :local(.edit),
    :global(.edit-leave-active) :local(.edit) {
        transition: 420ms cubic-bezier(0.55, 0, 0.1, 1);
        transition-property: opacity, translate;
    }

    :global(.edit-enter-from),
    :global(.edit-leave-to) {
        opacity: 0;
    }

    :global(.edit-enter-from) :local(.edit),
    :global(.edit-leave-to) :local(.edit) {
        opacity: 0;
        translate: 0 60px;
    }
</style>
