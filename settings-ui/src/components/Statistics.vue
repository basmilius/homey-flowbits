<template>
    <template v-if="!isLoading">
        <fieldset class="homey-form-fieldset">
            <legend class="homey-form-legend">{{ t('settings.statistics.title') }}</legend>
            <div class="homey-form-group" style="margin-top: 6px; text-wrap: pretty">
                {{ t('settings.statistics.description') }}
            </div>
            <div class="homey-form-group">
                <div class="statistics-grid">
                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfCycles }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.cycles') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfEvents }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.events') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfFlags }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.flags') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfLabels }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.labels') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfModes }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.modes') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfNoRepeats }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.no_repeats') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfSets }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.sets') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfSliders }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.sliders') }}</div>
                    </div>

                    <div class="statistic">
                        <div
                            class="flowbits-icon"
                            :style="{
                                '--icon': '&quot;&quot;',
                                '--icon-secondary': '&quot;&quot;'
                            }"
                        ></div>
                        <div class="statistic-value">{{ result.numberOfTimers }}</div>
                        <div class="statistic-name">{{ t('settings.statistics.timers') }}</div>
                    </div>
                </div>
            </div>
        </fieldset>

        <fieldset class="homey-form-fieldset">
            <legend class="homey-form-legend">{{ t('settings.card_statistics.title') }}</legend>
            <div class="homey-form-group" style="margin-top: 6px; text-wrap: pretty">
                {{ t('settings.card_statistics.description') }}
            </div>
            <div class="homey-form-group">
                <div class="statistics-table">
                    <div
                        v-for="row in result.usagePerFlowCard"
                        :key="row[0]"
                        class="statistics-table-row"
                    >
                        <div class="statistics-table-row-name">{{ row[0] }}</div>
                        <div class="statistics-table-row-value">{{ row[1] }}</div>
                    </div>
                </div>
            </div>
        </fieldset>
    </template>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue'

interface StatisticsResult {
    numberOfCycles: number
    numberOfEvents: number
    numberOfFlags: number
    numberOfLabels: number
    numberOfModes: number
    numberOfNoRepeats: number
    numberOfSets: number
    numberOfSliders: number
    numberOfTimers: number
    usagePerFlowCard: [string, number][]
}

const instance = getCurrentInstance()
const Homey = instance?.appContext.config.globalProperties.$homey

const isLoading = ref(true)
const result = ref<StatisticsResult>({
    numberOfCycles: 0,
    numberOfEvents: 0,
    numberOfFlags: 0,
    numberOfLabels: 0,
    numberOfModes: 0,
    numberOfNoRepeats: 0,
    numberOfSets: 0,
    numberOfSliders: 0,
    numberOfTimers: 0,
    usagePerFlowCard: []
})

const load = async (): Promise<void> => {
    if (!Homey) return
    isLoading.value = true
    try {
        result.value = await Homey.api('GET', '/statistics')
    } catch (error) {
        console.error('Failed to load statistics:', error)
    }
    isLoading.value = false
}

onMounted(load)
</script>
