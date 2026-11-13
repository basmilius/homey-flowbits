<template>
    <div :class="$style.colorSelect">
        <button
            v-for="item of items"
            :key="item.hex"
            :aria-label="t(item.label)"
            :aria-pressed="modelValue === item.hex"
            :class="modelValue === item.hex ? $style.colorSelectItemActive : $style.colorSelectItem"
            :style="{'--color': item.hex}"
            :title="t(item.label)"
            type="button"
            @click="modelValue = item.hex"/>
    </div>
</template>

<script
    lang="ts"
    setup>
    import { inject, type Ref } from 'vue';
    import { useTranslate } from '../composables';
    import { COLORS } from '../symbols';

    const modelValue = defineModel<string>();

    const t = useTranslate();

    const items = inject<Ref<{
        readonly hex: string;
        readonly label: string;
    }[]>>(COLORS);
</script>

<style
    lang="scss"
    module>
    .colorSelect {
        display: flex;
        flex-flow: row wrap;
        gap: 9px;
    }

    .colorSelectItem {
        --color: black;

        height: 33px;
        width: 33px;
        padding: 0;
        background: var(--color);
        border: 0;
        border-radius: 99px;
        cursor: pointer;
        transition: opacity 120ms cubic-bezier(0.55, 0, 0.1, 1);

        &:hover {
            opacity: .8;
        }

        &:focus-visible {
            outline: 3px solid var(--homey-color-mono-90);
            outline-offset: 2px;
        }
    }

    .colorSelectItemActive {
        composes: colorSelectItem;

        outline: 3px solid white;
        outline-offset: -6px;
    }
</style>
