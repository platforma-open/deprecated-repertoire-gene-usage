import { GraphMakerSettings } from '@milaboratories/graph-maker';
import {
  BlockModel,
  createPlDataTable,
  InferOutputsType,
  isPColumn,
  isPColumnSpec,
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
  tableState?: PlDataTableState;
  graphState: GraphMakerSettings;
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

export const model = BlockModel.create<BlockArgs, UiState>()
  .initialArgs({
    geneType: 'v',
    geneNameFormat: 'gene',
    onlyProductive: true,
    dropOutliers: false
  })

  .argsValid((ctx) => ctx.args.downsampling !== undefined && ctx.args.weight !== undefined)

  .output('clnsOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === 'mixcr.com/clns')
  )

  .output('datasetSpec', (ctx) => {
    if (ctx.args.clnsRef) return ctx.resultPool.getSpecByRef(ctx.args.clnsRef);
    else return undefined;
  })

  .output('pt', (ctx) => {
    const pCols = ctx.outputs?.resolve(getOutputName(ctx.args))?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    return createPlDataTable(ctx, pCols, ctx.uiState?.tableState);
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

  .sections([
    { type: 'link', href: '/', label: 'Tabular results' },
    { type: 'link', href: '/graph', label: 'Heatmap' }
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
