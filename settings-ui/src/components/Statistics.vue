<template>
    <FormGroup
        :title="t('settings.statistics.title')"
        :description="t('settings.statistics.description')">
        <div :class="$style.statisticsGrid">
            <Statistic
                icon=""
                :name="t('settings.statistics.cycles')"
                :value="result.numberOfCycles"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.events')"
                :value="result.numberOfEvents"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.flags')"
                :value="result.numberOfFlags"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.labels')"
                :value="result.numberOfLabels"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.modes')"
                :value="result.numberOfModes"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.no_repeats')"
                :value="result.numberOfNoRepeats"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.sets')"
                :value="result.numberOfSets"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.sliders')"
                :value="result.numberOfSliders"/>

            <Statistic
                icon=""
                :name="t('settings.statistics.timers')"
                :value="result.numberOfTimers"/>
        </div>
    </FormGroup>

    <FormGroup
        :title="t('settings.card_statistics.title')"
        :description="t('settings.card_statistics.description')">
        <div :class="$style.statisticsTable">
            <div
                v-for="row of result.usagePerFlowCard"
                :class="$style.statisticsTableRow">
                <div :class="$style.statisticsTableRowName">{{ row[0] }}</div>
                <div :class="$style.statisticsTableRowValue">{{ row[1] }}</div>
            </div>
        </div>
    </FormGroup>
</template>

<script
    lang="ts"
    setup>
    import { onMounted } from 'vue';
    import { useStatistics, useTranslate } from '../composables';
    import FormGroup from './FormGroup.vue';
    import Statistic from './Statistic.vue';

    const t = useTranslate();
    const {load, result} = useStatistics();

    onMounted(load);
</script>

<style
    lang="scss"
    module>
    .statisticsGrid {
        display: grid;
        gap: 21px 15px;
        grid-template-columns: repeat(2, 1fr);
    }

    .statisticsTable {
        display: flex;
        margin-left: calc(var(--homey-su-2) * -1);
        margin-right: calc(var(--homey-su-2) * -1);
        padding: 1px 0;
        align-items: stretch;
        flex-flow: column;
        gap: 1px;
        background: var(--homey-color-mono-05);
    }

    .statisticsTableRow {
        display: flex;
        padding: var(--homey-su-1) var(--homey-su-2);
        flex-flow: row nowrap;
        background: var(--homey-color-mono-0);
    }

    .statisticsTableRow:hover {
        background: var(--homey-color-mono-01);
    }

    .statisticsTableRowName {
        flex-grow: 1;
    }

    .statisticsTableRowValue {
        font-weight: var(--homey-font-weight-bold);
    }
</style>
