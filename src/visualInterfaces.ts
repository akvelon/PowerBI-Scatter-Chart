import DataViewValueColumn = powerbi.DataViewValueColumn;
import {SelectableDataPoint} from 'powerbi-visuals-utils-interactivityutils/lib/interactivitySelectionService';
import {TooltipEnabledDataPoint} from 'powerbi-visuals-utils-tooltiputils';
import powerbi from 'powerbi-visuals-api';
import PrimitiveValue = powerbi.PrimitiveValue;
import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {IAxisProperties} from 'powerbi-visuals-utils-chartutils/lib/axis/axisInterfaces';
import {PointDataLabelsSettings} from 'powerbi-visuals-utils-chartutils/lib/dataLabel/dataLabelInterfaces';
import {LegendData, LegendPosition} from 'powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces';
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewObject = powerbi.DataViewObject;
import NumberRange = powerbi.NumberRange;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import {ScaleLinear} from 'd3-scale';
import IViewport = powerbi.IViewport;
import {BaseType, Selection, Selection as d3Selection} from 'd3-selection';
import VisualUpdateType = powerbi.VisualUpdateType;

export interface IMargin {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface VisualData {
    dataPoints: VisualDataPoint[];
    size: ISize;
    axes: IAxes;
    defaultColor: string;
    sizeScale: ScaleLinear<number, number>;
    legendData: LegendData;
    defaultDataPointColor?: string;
    xCol: DataViewMetadataColumn | undefined;
    yCol: DataViewMetadataColumn | undefined;
    showAllDataPoints?: boolean;
    hasDynamicSeries?: boolean;
    dataLabelsSettings: VisualDataLabelsSettings;
    sizeRange: NumberRange;
    axesDimensions?: AxesDimensions;
}

export interface AxesDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IAxesSize {
    xAxisHeight: number;
    yAxisWidth: number;
}

export interface IAxes {
    x: IAxisProperties;
    y: IAxisProperties;
}

export interface VisualRadiusData {
    sizeMeasure: DataViewValueColumn | null; // no null
    index: number;
    value: PrimitiveValue | null; // no null
}

export interface VisualDataLabelsSettings extends PointDataLabelsSettings {
    fontFamily?: string;
    showBackground?: boolean;
    backgroundColor?: string;
    transparency?: number;
}

export interface VisualDataPoint extends SelectableDataPoint, TooltipEnabledDataPoint {
    x: number | null;
    y: number | null;
    size: ISize | null;
    radius: VisualRadiusData;
    fill?: string;
    colorFill?: string;
    columnGroup: DataViewValueColumnGroup;
    formattedCategory: () => string;
    tooltipInfo: VisualTooltipDataItem[];
    labelFill?: string;
    labelFontSize: any;
    labelFontFamily: string;
    angleRange: [number, number];
    labelAnglePosition?: number;
    equalDataPointLabelsCount?: VisualLabelsCount;
    xStart?: number | null; // no null
    xEnd?: number | null; // no null
    yStart?: number | null; // no null
    yEnd?: number | null; // no null
    labelX?: number;
    labelY?: number;
    index?: number;
    entirePath?: VisualDataPoint[];
    playAxisValue?: PrimitiveValue;
    pathDistances?: number[];
    pathElement?: SVGElement;
    isShown?: boolean;
}

export interface VisualLabelsCount {
    i: number;
    count: number;
}

export interface VisualLabelsDelta {
    dx: number;
    dy: number;
}

export interface VisualAxesLabels {
    x: string | null;
    y: string | null;
}

export interface VisualMeasureMetadataColumns {
    x?: DataViewMetadataColumn;
    y?: DataViewMetadataColumn;
    size?: DataViewMetadataColumn;
}

export interface VisualMeasureMetadata {
    idx: VisualMeasureMetadataIndexes;
    cols: VisualMeasureMetadataColumns;
    axesLabels: VisualAxesLabels;
}

export interface VisualMeasureMetadataIndexes {
    category?: number;
    x?: number;
    y?: number;
    size?: number;
    colorFill?: number;
    shape?: number;
    xStart?: number;
    xEnd?: number;
    yStart?: number;
    yEnd?: number;
    gradient?: number;
    playAxis?: number;
}

export interface ICategoryData {
    title: string;
    categories: {
        [categoryName: string]: ICategory;
    };
}

export interface ICategory {
    name: string;
    selectionColumn: DataViewCategoryColumn;
    columnGroup: DataViewValueColumnGroup;
}

export interface VisualDataViewObject extends DataViewObject {
    selection: VisualDataPoint[];
}

export interface PlayAxisUpdateData {
    metadata: VisualMeasureMetadata;
    viewport: IViewport;
    visualSize: ISize;
    visualMargin: IMargin;
    axesSize: IAxesSize;
    legendSize: IViewport;
    legendPosition: LegendPosition;
    xTickOffset: number;
    yTickOffset: number;
    dataPoints: VisualDataPoint[];
    metadataColumn: DataViewMetadataColumn | undefined;
    scatterGroupSelect: d3Selection<SVGGElement, VisualDataPoint[], SVGSVGElement, unknown> | null;
    scatterSelect: Selection<SVGCircleElement, VisualDataPoint, BaseType, VisualDataPoint[]> | null;
    updateType: VisualUpdateType;
    axes: IAxes;
}

export interface AxesOptions {
    categoryAxisProperties: DataViewObject;
    valueAxisProperties: DataViewObject;
    xAxisConstantLine: DataViewObject;
    yAxisConstantLine: DataViewObject;
}
