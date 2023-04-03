/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { dataLabelUtils, dataLabelInterfaces } from "powerbi-visuals-utils-chartutils";
// powerbi.extensibility.utils.interactivity
import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;

// powerbi.extensibility.utils.tooltip
import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;

// powerbi.extensibility.utils.chart
import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
import PointDataLabelsSettings = dataLabelInterfaces.PointDataLabelsSettings;

// legend
import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

export interface IMargin {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface ISize {
    width: number;
    height: number;
}

export interface VisualData {
    dataPoints: VisualDataPoint[];
    size: ISize;
    axes: IAxes;
    defaultColor: string;
    sizeScale: any;
    legendData: LegendData;
    defaultDataPointColor?: string;
    xCol: DataViewMetadataColumn;
    yCol: DataViewMetadataColumn;
    showAllDataPoints?: boolean;
    hasDynamicSeries?: boolean;
    dataLabelsSettings: VisualDataLabelsSettings;
    sizeRange: NumberRange;
    axesDimensions?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface IAxesSize {
    xAxisHeight: number;
    yAxisWidth: number;
}

export interface IAxes {
    x: powerbi.extensibility.utils.chart.axis.IAxisProperties;
    y: powerbi.extensibility.utils.chart.axis.IAxisProperties;
}

export interface VisualChartData {
    category: PrimitiveValue;
    dataPoints: VisualDataPoint[];
    axesLabels: VisualAxesLabels;
    xCol: DataViewMetadataColumn;
    yCol: DataViewMetadataColumn;
}

export interface VisualRadiusData {
    sizeMeasure: DataViewValueColumn;
    index: number;
    value: PrimitiveValue;
}

export interface VisualDataLabelsSettings extends PointDataLabelsSettings {
    fontFamily?: string;
    showBackground?: boolean;
    backgroundColor?: string;
    transparency?: number;
}

export interface VisualAxesSettings {
    categoryAxis: VisualAxisSettings;
    valueAxis: VisualAxisSettings;
}

export interface VisualAxisSettings {
    scaleType: string;
    start: number;
    end: number;
    axisColor: string;
    fontSize: number;
    fontFamily: string;
    displayUnits?: any;
    valueDecimalPlaces?: number;
    title: string;
    style?: string;
    titleColor?: any;
    axisTitle?: any;
    showGridlines?: boolean;
    gridlinesColor?: string;
    strokeWidth?: number;
    gridlinesLineStyle?: string;
}

export interface VisualDataPoint extends
    SelectableDataPoint,
    TooltipEnabledDataPoint {
    x: PrimitiveValue;
    y: PrimitiveValue;
    size: number | ISize;
    radius: VisualRadiusData;
    fill?: string;
    colorFill?: string;
    columnGroup: DataViewValueColumnGroup;
    formattedCategory?: () => string;
    tooltipInfo: VisualTooltipDataItem[];
    labelFill?: string;
    labelFontSize: any;
    labelFontFamily: string;
    angleRange?: Array<number>;
    labelAnglePosition?: number;
    equalDataPointLabelsCount?: VisualLabelsCount;
    xStart?: number;
    xEnd?: number;
    yStart?: number;
    yEnd?: number;
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

export interface VisualPointsTransparency {
    selected: number;
    regular: number;
    unselected: number;
}

export interface VisualLabelsDelta {
    dx: number;
    dy: number;
}

export interface VisualAxesLabels {
    x: string;
    y: string;
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

export interface SelectionSaveSettings {
    selection: string;
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
    metadataColumn: DataViewMetadataColumn;
    scatterGroupSelect: d3.selection.Update<VisualDataPoint[]>;
    scatterSelect: d3.Selection<any>;
    updateType: VisualUpdateType;
    axes: IAxes;
}
