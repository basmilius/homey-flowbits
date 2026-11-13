<template>
    <Overlay
        :label="item.name"
        @close="close()">
        <Icon
            :class="$style.editIcon"
            :icon="form.icon"
            :style="{
                '--color': form.color
            }"/>

        <div :class="$style.editName">
            {{ item.name }}
        </div>

        <FormGroup :title="t('settings.edit.color')">
            <ColorPicker v-model="form.color"/>
        </FormGroup>

        <FormGroup :title="t('settings.edit.icon')">
            <IconPicker v-model="form.icon"/>
        </FormGroup>

        <ButtonPrimary
            :is-loading="isSaving"
            :label="t('settings.save')"
            @click="save()"/>

        <ButtonTransparent
            :label="t('settings.close')"
            @click="close()"/>
    </Overlay>
</template>

<script
    lang="ts"
    setup>
    import { reactive } from 'vue';
    import { useTranslate } from '../composables';
    import type { FormLook, Item } from '../types';
    import ButtonPrimary from './ButtonPrimary.vue';
    import ButtonTransparent from './ButtonTransparent.vue';
    import ColorPicker from './ColorPicker.vue';
    import FormGroup from './FormGroup.vue';
    import Icon from './Icon.vue';
    import IconPicker from './IconPicker.vue';
    import Overlay from './Overlay.vue';

    const emit = defineEmits<{
        close: [];
        save: [string, FormLook];
    }>();

    const {
        item
    } = defineProps<{
        readonly isSaving: boolean;
        readonly item: Item;
    }>();

    const t = useTranslate();

    const form = reactive<FormLook>({
        color: item.color ?? '#204ef6',
        icon: item.icon ?? ''
    });

    function close(): void {
        emit('close');
    }

    function save(): void {
        emit('save', item.name, form);
    }
</script>

<style
    lang="scss"
    module>
    .editIcon {
        --size: 48px;

        margin-top: 30px;
        align-self: center;
    }

    .editName {
        margin-top: 6px;
        margin-bottom: 0;
        align-self: center;
        font-size: 21px;
        font-weight: 700;
    }
</style>
