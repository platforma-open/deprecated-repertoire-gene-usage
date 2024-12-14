import { GraphMakerState } from '@milaboratories/graph-maker';
import {
  BlockModel,
  createPlDataTable,
  createPlDataTableSheet,
  getUniquePartitionKeys,
  InferOutputsType,
  isPColumn,
  isPColumnSpec,
  PColumnSpec,
  PlDataTableState,
  Ref,
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
};

export type BlockArgs = {
  clnsRef?: Ref;

  // @TODO move to UI State once initial UI state will be implemented !
  geneType: 'v' | 'j' | 'isotype';
  geneNameFormat: 'gene' | 'family';

  /* downsampling options */
  onlyProductive: boolean;
  dropOutliers: boolean;
  downsampling?: string;
  weight?: WeightFunction;
};

const getOutputName = (args: BlockArgs) => {
  if (args.geneType === 'isotype') {
    return 'isotypeUsage';
  } else if (args.geneNameFormat === 'family') {
    return args.geneType + 'FamilyUsage';
  } else {
    return args.geneType + 'Usage';
  }
};

export const model = BlockModel.create()
  .withArgs<BlockArgs>({
    geneType: 'v',
    geneNameFormat: 'gene',
    onlyProductive: true,
    dropOutliers: false
  })
  .withUiState<UiState>({
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

  .argsValid((ctx) => ctx.args.downsampling !== undefined && ctx.args.weight !== undefined)

  .output('clnsOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === 'mixcr.com/clns')
  )

  .output('datasetSpec', (ctx) => {
    if (ctx.args.clnsRef) return ctx.resultPool.getSpecByRef(ctx.args.clnsRef) as PColumnSpec;
    else return undefined;
  })

  .output('pt', (ctx) => {
    const pCols = ctx.outputs?.resolve(getOutputName(ctx.args))?.getPColumns();
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
  })

  .output('pf', (ctx) => {
    const pCols = ctx.outputs?.resolve(getOutputName(ctx.args))?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // enriching with upstream data
    const valueTypes = ['Int', 'Long', 'Float', 'Double', 'String', 'Bytes'] as ValueType[];
    const upstream = ctx.resultPool
      .getData()
      .entries.map((v) => v.obj)
      .filter(isPColumn)
      .filter((column) => valueTypes.find((valueType) => valueType === column.spec.valueType));

    return ctx.createPFrame([...pCols, ...upstream]);
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => ctx.uiState?.blockTitle ?? 'Repertoire Diversity')

  .sections([
    { type: 'link', href: '/', label: 'Tabular Results' },
    { type: 'link', href: '/graph', label: 'Usage Heatmap' }
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
