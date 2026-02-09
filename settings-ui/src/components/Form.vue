<template>
    <form class="homey-form">
        <slot/>
    </form>
</template>

<script
    lang="ts"
    setup>
    import type { VNode } from 'vue';

    defineSlots<{
        default: VNode;
    }>();
</script>
