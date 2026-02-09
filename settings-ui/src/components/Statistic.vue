<template>
    <div :class="$style.statistic">
        <Icon
            :class="$style.statisticIcon"
            :icon="icon"/>

        <div :class="$style.statisticValue">
            {{ formattedValue }}
        </div>

        <div :class="$style.statisticName">
            {{ name }}
        </div>
    </div>
</template>

<script
    lang="ts"
    setup>
    import { computed, unref } from 'vue';
    import Icon from './Icon.vue';

    const formatter = new Intl.NumberFormat(navigator.language, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });

    const {
        value
    } = defineProps<{
        readonly icon: string;
        readonly name: string;
        readonly value: string | number;
    }>();

    const formattedValue = computed(() => {
        const _value = unref(value);

        if (typeof _value === 'number') {
            return formatter.format(_value);
        }

        return _value;
    });
</script>

<style
    lang="scss"
    module>
    .statistic {
        display: grid;
        gap: 6px 15px;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        line-height: 1;
    }

    .statisticIcon {
        --color: var(--homey-color-mono-70);
        --size: 24px;

        grid-column: 1;
        grid-row: 1 / span 2;
    }

    .statisticName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .statisticValue {
        font-size: var(--homey-font-size-medium);
        font-weight: var(--homey-font-weight-bold);
    }
</style>
