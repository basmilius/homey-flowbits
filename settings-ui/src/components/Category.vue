<template>
    <FormFieldset
        :title="title"
        :description="description">

        <div
            v-if="items.length > 0"
            :class="$style.categoryItems">
            <button
                v-for="item in items"
                :key="`${item.caption ?? ''}:${item.name}`"
                :class="$style.categoryItem"
                type="button"
                @click="edit(item)">
                <Icon
                    :class="$style.categoryItemIcon"
                    :icon="item.icon ?? ''"
                    :style="{
                        '--color': item.color
                    }"/>

                <span :class="$style.categoryItemCaption">
                    {{ item.name }}
                </span>

                <span
                    v-if="item.caption"
                    :class="$style.categoryItemCaptionSecondary">
                    {{ item.caption }}
                </span>

                <Icon
                    icon=""
                    style="--size: 16px"/>
            </button>
        </div>

        <template v-else>
            <div :class="$style.categoryEmpty">
                {{ empty }}
            </div>
        </template>

    </FormFieldset>
</template>

<script
    lang="ts"
    setup>
    import type { Item } from '../types';
    import FormFieldset from './FormFieldset.vue';
    import Icon from './Icon.vue';

    const emit = defineEmits<{
        readonly edit: [Item];
    }>();

    defineProps<{
        readonly description: string;
        readonly empty: string;
        readonly items: Item[];
        readonly title: string;
    }>();

    function edit(item: Item): void {
        emit('edit', item);
    }
</script>

<style
    lang="scss"
    module>
    .categoryEmpty {
        color: var(--rose);
        font-style: italic;
    }

    .categoryItems {
        display: flex;
        margin-left: calc(var(--homey-su-2) * -1);
        margin-right: calc(var(--homey-su-2) * -1);
        align-items: stretch;
        flex-flow: column;
    }

    .categoryItem {
        display: flex;
        padding: var(--homey-su-2);
        align-items: center;
        gap: 15px;
        justify-content: start;
        background: transparent;
        border: 1px solid var(--homey-color-mono-05);
        border-left: 0;
        border-right: 0;
        color: inherit;
        cursor: pointer;
        font: inherit;
        text-align: left;
        width: 100%;
    }

    .categoryItem:focus-visible {
        outline: 3px solid var(--homey-color-blue-500, #204ef6);
        outline-offset: -3px;
    }

    .categoryItem + .categoryItem {
        border-top: 0;
    }

    .categoryItem:hover {
        background: var(--homey-color-mono-01);
    }

    .categoryItemCaption {
        flex-grow: 1;
        font-weight: 500;
    }

    .categoryItemCaptionSecondary {
        color: var(--homey-color-mono-70);
        font-size: 0.875em;
    }

    .categoryItemIcon {
        --size: 20px;
    }
</style>
