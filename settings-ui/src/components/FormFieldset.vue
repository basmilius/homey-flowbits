<template>
    <fieldset class="homey-form-fieldset">
        <legend class="homey-form-legend">{{ title }}</legend>

        <div class="homey-form-group" style="margin-top: 6px; text-wrap: pretty">
            {{ description }}
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
        readonly description: string;
        readonly title: string;
    }>();

    defineSlots<{
        default: VNode;
    }>();
</script>
