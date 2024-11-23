<script setup lang="ts">
import { PlAgDataTable, PlBlockPage, PlBtnGhost, PlDataTableSettings, PlMaskIcon24 } from '@platforma-sdk/ui-vue';
import { computed, ref } from 'vue';
import { useApp } from '../app';
import SettingsModal from './SettingsModal.vue';

const app = useApp();

const tableSettings = computed<PlDataTableSettings>(() => ({
  sourceType: "ptable",

  pTable: app.model.outputs.pt,

  sheets: [
    {
      axis: {
        name: "pl7.app/vdj/chain",
        type: "String",
      },
      options: [
        { text: "TRA", value: "TRA" },
        { text: "TRB", value: "TRB" },
        { text: "IGH", value: "IGH" },
        { text: "IGK", value: "IGK" },
        { text: "IGL", value: "IGL" },
      ],
      defaultValue: "IGH",
    },
  ],
} satisfies PlDataTableSettings));

const settingsAreShown = ref(app.model.outputs.pt === undefined)
const showSettings = () => { settingsAreShown.value = true }
</script>

<template>
  <PlBlockPage>
    <template #title>Gene Usage</template>
    <template #append>
      <PlBtnGhost @click.stop="showSettings">Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>

    <SettingsModal v-model="settingsAreShown" />

    <PlAgDataTable v-if="app.model.ui" :settings="tableSettings" v-model="app.model.ui.tableState" />
  </PlBlockPage>
</template>
