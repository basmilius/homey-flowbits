<template>
    <fieldset class="homey-form-fieldset">
        <legend class="homey-form-legend">
            {{ title }}
        </legend>

        <div
            v-if="description"
            class="homey-form-group"
            style="margin-top: 6px">
            {{ description }}
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
</template>

<script
    lang="ts"
    setup>
    import type { VNode } from 'vue';

    defineProps<{
        readonly description?: string;
        readonly title: string;
    }>();

    defineSlots<{
        default: VNode;
        before: VNode[];
    }>();
</script>
