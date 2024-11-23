<script setup lang="ts">
import { GraphMaker, GraphMakerSettings } from "@milaboratories/graph-maker";
import '@milaboratories/graph-maker/styles';
import {
    AxisSpec,
    PColumnSpec
} from '@platforma-sdk/model';
import { computed } from "vue";
import { useApp } from "../app";

const app = useApp();

const defaultOptions = computed(() => {
    const ds = app.model.outputs.datasetSpec
    if (!ds) {
        return undefined
    }

    const gt = app.model.args.geneType

    let value: PColumnSpec
    let genes: AxisSpec
    if (gt === 'isotype') {
        genes = {
            type: 'String',
            name: 'pl7.app/vdj/isotype'
        }
        value = {
            kind: 'PColumn',
            valueType: 'Float',
            name: 'pl7.app/vdj/isotypeUsage',
            axesSpec: [
                ds.axesSpec[0]!,
                genes
            ]
        }

    }
    else {
        genes = {
            type: 'String',
            name: 'pl7.app/vdj/gene',
            domain: {
                "pl7.app/vdj/geneType": gt,
                "pl7.app/vdj/geneNameFormat": app.model.args.geneNameFormat
            },
        }
        value = {
            kind: 'PColumn',
            valueType: 'Float',
            name: `pl7.app/vdj/${gt}Usage`,
            axesSpec: [
                ds.axesSpec[0],
                genes
            ]
        }
    }
    return [
        {
            inputName: 'value',
            selectedSource: value
        },
        {
            inputName: 'X',
            selectedSource: ds.axesSpec[0]
        },
        {
            inputName: 'Y',
            selectedSource: genes
        }
    ]
})

const graphMakerSettings = computed<GraphMakerSettings>({
    get: () => ({ ...app.model.ui.graphState, defaultOptions: defaultOptions.value }),
    set: (val) => app.model.ui.graphState = val
})
</script>

<template>
    <GraphMaker :p-frame="app.model.outputs.pf" v-model="graphMakerSettings" />
</template>