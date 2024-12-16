<script setup lang="ts">
import { PlAgDataTable, PlAgDataTableToolsPanel, PlBlockPage, PlBtnGhost, PlDataTableSettings, PlDropdown, PlEditableTitle, PlMaskIcon24 } from '@platforma-sdk/ui-vue';
import { computed, ref } from 'vue';
import { useApp } from '../app';
import SettingsModal from './SettingsModal.vue';

const app = useApp();

const table = computed(() => {
  if (app.model.ui.geneType === 'V') {
    if (app.model.ui.geneNameFormat === 'gene')
      return app.model.outputs.vUsage;
    else
      return app.model.outputs.vFamilyUsage;
  }
  if (app.model.ui.geneType === 'J') {
    if (app.model.ui.geneNameFormat === 'gene')
      return app.model.outputs.jUsage;
    else
      return app.model.outputs.jFamilyUsage;
  }
  if (app.model.ui.geneType === 'isotype')
    return app.model.outputs.isotypeUsage;

  return undefined;
})

const tableSettings = computed<PlDataTableSettings>(() => ({
  sourceType: "ptable",
  pTable: table.value?.table,
  sheets: table.value?.sheets,
} satisfies PlDataTableSettings));


const geneTypes = [
  {
    label: "V usage",
    value: "V"
  },
  {
    label: "J usage",
    value: "J"
  }
]

const geneNameFormats = [
  {
    label: "Gene",
    value: "gene"
  },
  {
    label: "Family",
    value: "family"
  }
]

const settingsAreShown = ref(app.model.args.clnsRef === undefined)
const showSettings = () => { settingsAreShown.value = true }
</script>

<template>
  <PlBlockPage>
    <template #title>
      <PlEditableTitle max-width="600px" :max-length="40" v-model="app.model.ui.blockTitle" />
    </template>
    <template #append>
      <PlDropdown label="Gene type" v-model="app.model.ui.geneType" :options="geneTypes" />
      <PlDropdown label="Gene name format" v-model="app.model.ui.geneNameFormat" :options="geneNameFormats" />

      <PlAgDataTableToolsPanel />

      <PlBtnGhost @click.stop="showSettings">Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>

    <SettingsModal v-model="settingsAreShown" />

    <PlAgDataTable v-if="app.model.ui" :settings="tableSettings" v-model="app.model.ui.tableState" show-columns-panel
      show-export-button />
  </PlBlockPage>
</template>
