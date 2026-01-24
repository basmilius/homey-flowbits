'use strict';

(function () {
    const {computed, createApp, defineComponent, inject, onMounted, provide, reactive, ref, unref, watch} = Vue;

    const COLORS = Symbol();
    const ICONS = Symbol();
    let Homey = null;

    function useColors() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/colors');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useIcons() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/icons');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useEvents() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/events');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useFlags() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/flags');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useLabels() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/labels');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useModes() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/modes');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useSets() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/sets');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useTimers() {
        const items = ref([]);
        const isLoading = ref(true);

        const load = async () => {
            isLoading.value = true;
            items.value = await Homey.api('GET', '/timers');
            isLoading.value = false;
        };

        return {
            isLoading,
            items,
            load
        };
    }

    function useStatistics() {
        const result = ref({});
        const isLoading = ref(true);

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

    const FormGroup = defineComponent({
        props: ['title', 'description'],

        template: `
            <fieldset class="homey-form-fieldset">
                <legend class="homey-form-legend">{{ title }}</legend>
                <div
                    v-if="description"
                    class="homey-form-group"
                    style="margin-top: 6px; text-wrap: pretty">{{ description }}
                </div>
                <div
                    v-if="$slots.before"
                    class="homey-form-group">
                    <slot name="before"/>
                </div>
                <div class="homey-form-group">
                    <slot/>
                </div>
            </fieldset>
        `
    });

    const ColorSelect = defineComponent({
        components: {
            FormGroup
        },

        emits: ['update:modelValue'],
        props: ['modelValue'],

        template: `
            <FormGroup :title="t('settings.edit.color')">
                <div class="color-select">
                    <div
                        v-for="item of items"
                        class="color-select-item"
                        :class="{'active': selection === item.hex}"
                        :style="{'--color': item.hex}"
                        :title="item.label"
                        @click="selection = item.hex"/>
                </div>
            </FormGroup>
        `,

        setup({modelValue}, {emit}) {
            const items = inject(COLORS);
            const selection = ref(modelValue);

            watch(selection, value => emit('update:modelValue', value));
            watch(() => modelValue, value => selection.value = value);

            return {
                items,
                selection
            };
        }
    });

    const IconSelect = defineComponent({
        components: {
            FormGroup
        },

        emits: ['update:modelValue'],
        props: ['modelValue'],

        template: `
            <FormGroup :title="t('settings.edit.icon')">
                <template #before>
                    <label
                        class="homey-form-label"
                        for="search">{{ t('settings.search') }}</label>
                    <input
                        class="homey-form-input"
                        id="search"
                        type="text"
                        v-model="search"/>
                </template>

                <div class="icon-select">
                    <div
                        v-for="item of items"
                        class="icon-select-item flowbits-icon"
                        :class="{'active': selection === item.unicode}"
                        :style="{'--icon': JSON.stringify(item.unicode), '--icon-secondary': JSON.stringify(item.unicode + item.unicode)}"
                        :title="item.name"
                        @click="selection = item.unicode"/>
                </div>
            </FormGroup>
        `,

        setup({modelValue}, {emit}) {
            const items = inject(ICONS);
            const search = ref('');
            const selection = ref(modelValue);

            const filtered = computed(() => {
                const normalizedQuery = unref(search).toLowerCase().trim();

                return items.value
                    .filter(item => (normalizedQuery.length > 0 && item.name.toLowerCase().includes(normalizedQuery)) || (normalizedQuery.length === 0 && item.unicode === selection.value))
                    .slice(0, 54);
            });

            watch(selection, value => emit('update:modelValue', value));
            watch(() => modelValue, value => selection.value = value);

            return {
                items: filtered,
                search,
                selection
            };
        }
    });

    const Edit = defineComponent({
        components: {
            ColorSelect,
            IconSelect
        },

        emits: ['close', 'save'],
        props: ['name', 'color', 'icon', 'saving'],

        template: `
            <div class="edit-overlay">
                <div class="edit">
                    <div
                        class="edit-icon flowbits-icon"
                        :style="{'--color': form.color, '--icon': iconPrimary, '--icon-secondary': iconSecondary}"></div>
                    <div class="edit-name">{{ name }}</div>

                    <ColorSelect v-model="form.color"/>
                    <IconSelect v-model="form.icon"/>

                    <button
                        class="homey-button-primary-full"
                        :class="{'is-loading': saving}"
                        @click="save()">{{ t('settings.save') }}
                    </button>
                    <button
                        class="homey-button-transparent"
                        @click="close()">{{ t('settings.close') }}
                    </button>
                </div>
            </div>
        `,

        setup({color, icon}, {emit}) {
            const form = reactive({
                color,
                icon
            });

            const iconPrimary = computed(() => JSON.stringify(form.icon));
            const iconSecondary = computed(() => JSON.stringify(`${form.icon}${form.icon}`));

            const save = async () => emit('save', form);
            const close = () => emit('close');

            return {
                close,
                save,
                form,
                iconPrimary,
                iconSecondary
            };
        }
    });

    const Item = defineComponent({
        emits: ['click'],
        props: ['name', 'color', 'icon'],

        template: `
            <div
                class="item"
                @click="onClick()">
                <div
                    class="item-icon flowbits-icon"
                    :style="{'--color': color, '--icon': iconPrimary, '--icon-secondary': iconSecondary}"></div>
                <div class="item-caption">{{ name }}</div>
                <div class="item-icon-edit flowbits-icon"></div>
            </div>
        `,

        setup(props, {emit}) {
            const onClick = () => emit('click');

            const iconPrimary = computed(() => JSON.stringify(props.icon));
            const iconSecondary = computed(() => JSON.stringify(`${props.icon}${props.icon}`));

            return {
                onClick,
                iconPrimary,
                iconSecondary
            };
        }
    });

    const Events = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.events.title')"
                :description="t('settings.events.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.events.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Flags = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.flags.title')"
                :description="t('settings.flags.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.flags.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Labels = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.labels.title')"
                :description="t('settings.labels.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.labels.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Modes = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.modes.title')"
                :description="t('settings.modes.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.modes.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Sets = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.sets.title')"
                :description="t('settings.sets.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.sets.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Timers = defineComponent({
        components: {
            FormGroup,
            Item
        },

        props: ['items'],

        template: `
            <FormGroup
                :title="t('settings.timers.title')"
                :description="t('settings.timers.description')">
                <div
                    v-if="items.length > 0"
                    class="items">
                    <Item
                        v-for="item of items"
                        :name="item.name"
                        :color="item.color"
                        :icon="item.icon"
                        @click="onClick(item)"/>
                </div>

                <div
                    v-else
                    class="items-empty">
                    {{ t('settings.timers.empty') }}
                </div>
            </FormGroup>
        `,

        setup(_, {emit}) {
            const onClick = item => emit('edit', item);

            return {
                onClick
            };
        }
    });

    const Statistic = defineComponent({
        props: ['icon', 'name', 'value'],

        template: `
            <div class="statistic">
                <div
                    class="flowbits-icon"
                    :style="{'--icon': iconPrimary, '--icon-secondary': iconSecondary}"></div>
                <div class="statistic-value">{{ value }}</div>
                <div class="statistic-name">{{ name }}</div>
            </div>
        `,

        setup(props) {
            const iconPrimary = computed(() => JSON.stringify(props.icon));
            const iconSecondary = computed(() => JSON.stringify(`${props.icon}${props.icon}`));

            return {
                iconPrimary,
                iconSecondary
            };
        }
    });

    const Statistics = defineComponent({
        components: {
            FormGroup,
            Statistic
        },

        template: `
            <template v-if="!isLoading">
                <FormGroup
                    :title="t('settings.statistics.title')"
                    :description="t('settings.statistics.description')">
                    <div class="statistics-grid">
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
                    <div class="statistics-table">
                        <div
                            class="statistics-table-row"
                            v-for="row of result.usagePerFlowCard">
                            <div class="statistics-table-row-name">{{ row[0] }}</div>
                            <div class="statistics-table-row-value">{{ row[1] }}</div>
                        </div>
                    </div>
                </FormGroup>
            </template>
        `,

        setup() {
            const {isLoading, load, result} = useStatistics();

            onMounted(load);

            return {
                isLoading,
                result
            };
        }
    });

    const Settings = defineComponent({
        components: {
            Edit,
            Events,
            Flags,
            Labels,
            Modes,
            Sets,
            Timers,
            Statistics
        },

        template: `
            <header class="homey-header">
                <h1 class="homey-title">{{ t('settings.title') }}</h1>
                <p class="homey-subtitle">{{ t('settings.subtitle') }}</p>
            </header>

            <form class="homey-form">
                <Modes
                    v-if="modes.length > 0"
                    :items="modes"
                    @edit="onEditMode"/>

                <Flags
                    v-if="flags.length > 0"
                    :items="flags"
                    @edit="onEditFlag"/>

                <Timers
                    v-if="timers.length > 0"
                    :items="timers"
                    @edit="onEditTimer"/>

                <Labels
                    v-if="labels.length > 0"
                    :items="labels"
                    @edit="onEditLabel"/>

                <Sets
                    v-if="sets.length > 0"
                    :items="sets"
                    @edit="onEditSet"/>

                <Events
                    v-if="events.length > 0"
                    :items="events"
                    @edit="onEditEvent"/>

                <Statistics/>
            </form>

            <Transition name="edit">
                <Edit
                    v-if="editingEvent"
                    :name="editingEvent.name"
                    :color="editingEvent.color"
                    :icon="editingEvent.icon"
                    :saving="isSaving"
                    @close="editingEvent = null"
                    @save="form => onSaveEvent(editingEvent.name, form)"/>

                <Edit
                    v-else-if="editingFlag"
                    :name="editingFlag.name"
                    :color="editingFlag.color"
                    :icon="editingFlag.icon"
                    :saving="isSaving"
                    @close="editingFlag = null"
                    @save="form => onSaveFlag(editingFlag.name, form)"/>

                <Edit
                    v-else-if="editingLabel"
                    :name="editingLabel.name"
                    :color="editingLabel.color"
                    :icon="editingLabel.icon"
                    :saving="isSaving"
                    @close="editingLabel = null"
                    @save="form => onSaveLabel(editingLabel.name, form)"/>

                <Edit
                    v-else-if="editingMode"
                    :name="editingMode.name"
                    :color="editingMode.color"
                    :icon="editingMode.icon"
                    :saving="isSaving"
                    @close="editingMode = null"
                    @save="form => onSaveMode(editingMode.name, form)"/>

                <Edit
                    v-else-if="editingSet"
                    :name="editingSet.name"
                    :color="editingSet.color"
                    :icon="editingSet.icon"
                    :saving="isSaving"
                    @close="editingSet = null"
                    @save="form => onSaveSet(editingSet.name, form)"/>

                <Edit
                    v-else-if="editingTimer"
                    :name="editingTimer.name"
                    :color="editingTimer.color"
                    :icon="editingTimer.icon"
                    :saving="isSaving"
                    @close="editingTimer = null"
                    @save="form => onSaveTimer(editingTimer.name, form)"/>
            </Transition>
        `,

        setup() {
            const {items: events, load: loadEvents} = useEvents();
            const {items: flags, load: loadFlags} = useFlags();
            const {items: labels, load: loadLabels} = useLabels();
            const {items: modes, load: loadModes} = useModes();
            const {items: sets, load: loadSets} = useSets();
            const {items: timers, load: loadTimers} = useTimers();
            const {items: colors, load: loadColors} = useColors();
            const {items: icons, load: loadIcons} = useIcons();

            const editingEvent = ref(null);
            const editingFlag = ref(null);
            const editingLabel = ref(null);
            const editingMode = ref(null);
            const editingSet = ref(null);
            const editingTimer = ref(null);
            const isSaving = ref(false);

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
            });

            const onEditEvent = event => editingEvent.value = event;
            const onEditFlag = flag => editingFlag.value = flag;
            const onEditLabel = label => editingLabel.value = label;
            const onEditMode = mode => editingMode.value = mode;
            const onEditSet = set => editingSet.value = set;
            const onEditTimer = timer => editingTimer.value = timer;

            const onSaveEvent = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/events/look', {
                    name,
                    color,
                    icon
                });

                await loadEvents();

                editingEvent.value = null;
                isSaving.value = false;
            };

            const onSaveFlag = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/flags/look', {
                    name,
                    color,
                    icon
                });

                await loadFlags();

                editingFlag.value = null;
                isSaving.value = false;
            };

            const onSaveLabel = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/labels/look', {
                    name,
                    color,
                    icon
                });

                await loadLabels();

                editingLabel.value = null;
                isSaving.value = false;
            };

            const onSaveMode = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/modes/look', {
                    name,
                    color,
                    icon
                });

                await loadModes();

                editingMode.value = null;
                isSaving.value = false;
            };

            const onSaveSet = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/sets/look', {
                    name,
                    color,
                    icon
                });

                await loadSets();

                editingSet.value = null;
                isSaving.value = false;
            };

            const onSaveTimer = async (name, {color, icon}) => {
                isSaving.value = true;

                await Homey.api('POST', '/timers/look', {
                    name,
                    color,
                    icon
                });

                await loadTimers();

                editingTimer.value = null;
                isSaving.value = false;
            };

            provide(COLORS, colors);
            provide(ICONS, icons);

            return {
                isSaving,
                editingEvent,
                editingFlag,
                editingLabel,
                editingMode,
                editingSet,
                editingTimer,
                events,
                flags,
                labels,
                modes,
                sets,
                timers,

                onEditEvent,
                onEditFlag,
                onEditLabel,
                onEditMode,
                onEditSet,
                onEditTimer,
                onSaveEvent,
                onSaveFlag,
                onSaveLabel,
                onSaveMode,
                onSaveSet,
                onSaveTimer
            };
        }
    });

    const app = createApp({
        components: {
            Settings
        },

        template: `
            <Settings v-if="ready"/>`,

        setup() {
            const ready = ref(false);

            window.addEventListener('homeyReady', evt => {
                Homey = evt.detail;
                Homey.ready();
                ready.value = true;
            });

            return {ready};
        }
    });

    app.config.globalProperties.t = key => Homey.__(key);

    app.mount('#app');
})();

function onHomeyReady(Homey) {
    window.dispatchEvent(new CustomEvent('homeyReady', {detail: Homey}));
}
