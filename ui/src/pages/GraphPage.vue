<script setup lang="ts">
import { GraphMaker, GraphMakerProps } from "@milaboratories/graph-maker";
import '@milaboratories/graph-maker/styles';
import { computed } from "vue";
import { useApp } from "../app";

const app = useApp();

console.log('loaded');

const defaultOptions = computed((): GraphMakerProps['defaultOptions'] => {
    const col = app.model.outputs.vUsageSpec
    if (!col) {
        return undefined
    }

    const defaults: GraphMakerProps['defaultOptions'] = [
        {
            inputName: 'value',
            selectedSource: col
        },
        {
            inputName: 'x',
            selectedSource: col.axesSpec[1]
        },
        {
            inputName: 'y',
            selectedSource: col.axesSpec[2]
        },
        {
            inputName: 'filters',
            selectedSource: col.axesSpec[0]
        }
    ];

    return defaults;
})
</script>

<template>
    <GraphMaker chart-type="heatmap" :p-frame="app.model.outputs.pf" v-model="app.model.ui.graphState"
        :default-options="defaultOptions" />
</template>