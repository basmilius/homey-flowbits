<template>
    <FormInput
        v-model="search"
        :label="t('settings.search')"
        type="text"/>

    <div :class="$style.iconSelect">
        <button
            v-for="item of filtered"
            :key="item.unicode"
            :aria-label="item.name"
            :aria-pressed="modelValue === item.unicode"
            :class="modelValue === item.unicode ? $style.iconSelectItemActive : $style.iconSelectItem"
            :title="item.name"
            type="button"
            @click="modelValue = item.unicode">
            <Icon
                aria-hidden="true"
                :icon="item.unicode"/>
        </button>
    </div>
</template>

<script
    lang="ts"
    setup>
    import { computed, inject, type Ref, ref, unref } from 'vue';
    import { useTranslate } from '../composables';
    import { ICONS } from '../symbols';
    import FormInput from './FormInput.vue';
    import Icon from './Icon.vue';

    const modelValue = defineModel<string>();

    const t = useTranslate();

    const items = inject<Ref<{
        readonly name: string;
        readonly unicode: string;
    }[]>>(ICONS)!;

    const search = ref('');

    const filtered = computed(() => {
        const normalizedQuery = unref(search).toLowerCase().trim();

        return unref(items)
            .filter(item => (normalizedQuery.length > 0 && item.name.toLowerCase().includes(normalizedQuery)) || (normalizedQuery.length === 0 && item.unicode === unref(modelValue)))
            .slice(0, 54);
    });
</script>

<style
    lang="scss"
    module>
    .iconSelect {
        display: flex;
        margin-top: 15px;
        flex-flow: row wrap;
        gap: 6px;
    }

    .iconSelectItem {
        --color: var(--homey-color-mono-70);
        --size: 24px;

        display: grid;
        height: 45px;
        width: 45px;
        padding: 0;
        place-items: center;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--homey-border-radius-small);
        cursor: pointer;

        &:focus-visible {
            outline: 3px solid var(--homey-color-mono-90);
            outline-offset: 2px;
        }

        &:hover {
            background: var(--homey-color-mono-02);
            border-color: var(--homey-color-mono-05);
        }
    }

    .iconSelectItemActive {
        composes: iconSelectItem;

        --color: var(--sky);

        background: rgb(from var(--color) r g b / .25);
        border-color: rgb(from var(--color) r g b / .25);
    }
</style>
