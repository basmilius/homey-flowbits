<template>
    <header class="homey-header">
        <h1 class="homey-title">{{ title }}</h1>
        <p class="homey-subtitle">{{ subtitle }}</p>
    </header>
</template>

<script
    lang="ts"
    setup>
defineProps<{
    readonly subtitle: string;
    readonly title: string;
}>();
</script>
