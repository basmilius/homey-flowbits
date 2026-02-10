<template>
    <FormGroup
        :title="t('settings.documentation.title')"
        :description="t('settings.documentation.description')"/>
</template>

<script
    lang="ts"
    setup>
    import { useTranslate } from '../composables';
    import FormGroup from './FormGroup.vue';

    const t = useTranslate();
</script>
