<script setup lang="ts">
import { GraphMaker, GraphMakerProps } from "@milaboratories/graph-maker";
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
            name: 'pl7.app/vdj/geneUsage',
            domain: {
                "pl7.app/vdj/geneType": app.model.args.geneType,
                "pl7.app/vdj/geneNameFormat": app.model.args.geneNameFormat
            },
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
        },
        {
            inputName: 'tabBy',
            selectedSource: {
                name: 'pl7.app/vdj/chain',
                type: 'String'
            }
        }
    ] as GraphMakerProps['defaultOptions']
})
</script>

<template>
    <GraphMaker chart-type="heatmap" :p-frame="app.model.outputs.pf" v-model="app.model.ui.graphState"
        :default-options="defaultOptions" />
</template>