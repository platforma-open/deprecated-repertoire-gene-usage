import { GraphMakerState } from '@milaboratories/graph-maker';
import {
  BlockModel,
  createPlDataTable,
  createPlDataTableSheet,
  createPFrameForGraphs,
  getUniquePartitionKeys,
  InferOutputsType,
  isPColumn,
  isPColumnSpec,
  PColumn,
  PColumnSpec,
  PlDataTableState,
  PlRef,
  RenderCtx,
  TreeNodeAccessor,
  ValueType
} from '@platforma-sdk/model';

type WeightFunction = 'auto' | 'read' | 'umi' | 'cell' | 'none';

type DownsamplingForm = {
  type: 'auto' | 'count' | 'top' | 'cumtop' | 'none';
  tag: 'read' | 'umi' | 'cell';
  countNorm: 'auto' | 'min' | 'fixed';
  countNormValue: number;
  topValue: number;
  cumtopValue: number;
};

/**
 * UI state
 */
export type UiState = {
  blockTitle: string;
  tableState?: PlDataTableState;
  graphState: GraphMakerState;
  weight: WeightFunction;
  downsampling: DownsamplingForm;
  geneType: 'V' | 'J' | 'isotype';
  geneNameFormat: 'gene' | 'family';
};

export type BlockArgs = {
  clnsRef?: PlRef;
  title?: string;

  /* downsampling options */
  onlyProductive: boolean;
  dropOutliers: boolean;
  downsampling?: string;
  weight?: WeightFunction;
  isReady?: boolean;
};

type CTX = RenderCtx<BlockArgs, UiState>;

const getColumnSpec = (ctx: CTX, name: string) => {
  const pCols = ctx.outputs?.resolve(name)?.getPColumns();
  if (pCols === undefined) {
    return undefined;
  }
  return pCols[0].spec;
};

const getTable = (ctx: CTX, name: string) => {
  const pCols = ctx.outputs?.resolve(name)?.getPColumns();
  if (pCols === undefined) {
    return undefined;
  }

  const anchor = pCols[0];
  if (!anchor) return undefined;

  const r = getUniquePartitionKeys(anchor.data);
  if (!r) return undefined;

  // for the table purposes, we set "pl7.app/axisNature": "heterogeneous" on gene axis
  if (pCols.length === 1) {
    pCols[0].spec.axesSpec[2].annotations!['pl7.app/axisNature'] = 'heterogeneous';
  } else {
    throw Error('unexpected number of columns');
  }

  return {
    table: createPlDataTable(ctx, pCols, ctx.uiState?.tableState),
    sheets: r.map((values, i) => createPlDataTableSheet(ctx, anchor.spec.axesSpec[i], values))
  };
};

export const model = BlockModel.create()
  .withArgs<BlockArgs>({
    onlyProductive: true,
    dropOutliers: false,
    isReady: false
  })
  .withUiState<UiState>({
    geneType: 'V',
    geneNameFormat: 'gene',
    blockTitle: 'V/J Gene Usage',
    weight: 'auto',
    tableState: {
      gridState: {},
      pTableParams: {
        sorting: [],
        filters: []
      }
    },
    downsampling: {
      type: 'auto',
      tag: 'read',
      countNorm: 'auto',
      countNormValue: 1000,
      topValue: 1000,
      cumtopValue: 80
    },
    graphState: {
      title: 'Gene Usage',
      template: 'heatmap'
    }
  })

  // Activate "Run" button only after these conditions get fulfilled
  .argsValid((ctx) =>  ctx.args.clnsRef !== undefined &&
                      // isReady is set to false while we compute dataset specific settings
                      ctx.args.isReady === true && 
                      ctx.args.downsampling !== undefined && 
                      ctx.args.weight !== undefined)

  .output('clnsOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === 'mixcr.com/clns')
  )

  .output('datasetSpec', (ctx) => {
    if (ctx.args.clnsRef) return ctx.resultPool.getSpecByRef(ctx.args.clnsRef) as PColumnSpec;
    else return undefined;
  })

  .output('vUsage', (ctx) => getTable(ctx, 'vUsage'))
  .output('jUsage', (ctx) => getTable(ctx, 'jUsage'))
  .output('vFamilyUsage', (ctx) => getTable(ctx, 'vFamilyUsage'))
  .output('jFamilyUsage', (ctx) => getTable(ctx, 'jFamilyUsage'))
  .output('isotypeUsage', (ctx) => getTable(ctx, 'isotypeUsage'))

  .output('vUsageSpec', (ctx) => getColumnSpec(ctx, 'vUsage'))
  .output('jUsageSpec', (ctx) => getColumnSpec(ctx, 'jUsage'))
  .output('vFamilyUsageSpec', (ctx) => getColumnSpec(ctx, 'vFamilyUsage'))
  .output('jFamilyUsageSpec', (ctx) => getColumnSpec(ctx, 'jFamilyUsage'))
  .output('isotypeUsageSpec', (ctx) => getColumnSpec(ctx, 'isotypeUsage'))

  .output('pf', (ctx) => {
    const pCols: PColumn<TreeNodeAccessor>[] = [];
    for (const usage of ['vUsage', 'jUsage', 'vFamilyUsage', 'jFamilyUsage', 'isotypeUsage']) {
      const p = ctx.outputs?.resolve(usage)?.getPColumns();
      if (p === undefined) {
        continue;
      }
      pCols.push(...p);
    }

    // enriching with upstream data
    const valueTypes = [
      "Int",
      "Long",
      "Float",
      "Double",
      "String",
      "Bytes",
    ] as ValueType[];
    const upstream = ctx.resultPool 
      .getData()
      .entries.map((v) => v.obj)
      .filter(isPColumn)
      .filter((column) => 
        valueTypes.find((valueType) => (valueType === column.spec.valueType) && (
                                          column.id.includes("metadata"))
                                        )
      );

    return createPFrameForGraphs(ctx, [...pCols, ...upstream]);
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => (ctx.args.title ? `V/J Gene Usage - ${ctx.args.title}` : 'V/J Gene Usage'))

  .sections([
    { type: 'link', href: '/', label: 'Tabular Results' },
    { type: 'link', href: '/graph', label: 'Usage Heatmap' }
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
