import powerbi from 'powerbi-visuals-api';
import DataViewMetadata = powerbi.DataViewMetadata;
import DataViewObject = powerbi.DataViewObject;
import DataViewObjects = powerbi.DataViewObjects;
import {dataViewObjects} from 'powerbi-visuals-utils-dataviewutils';
import {PropertiesOfCapabilities} from './properties';
import {DefaultColor} from './axesPropertiesUtils';
import DataViewValueColumns = powerbi.DataViewValueColumns;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import {
    ILegend,
    LegendData,
    LegendDataPoint, LegendPosition,
    legendProps,
} from 'powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces';
import {ColorHelper} from 'powerbi-visuals-utils-colorutils';
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import {valueFormatter} from 'powerbi-visuals-utils-formattingutils';
import {Selection} from 'd3-selection';
import IViewport = powerbi.IViewport;
import {legendData as legendDataModule, legend as legendModule} from 'powerbi-visuals-utils-chartutils';

export const MinAmountOfDataPointsInTheLegend: number = 1;
export const LegendLabelFontSizeDefault: number = 9;
export const DefaultFontFamily: string = '"Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif';
export const DefaultLegendTitleText: string = 'Type';
export const DefaultLegendPosition: string = 'Top';
const DefaultSelectionStateOfTheDataPoint: boolean = false;

export function buildLegendData(
    dataValues: DataViewValueColumns,
    host: IVisualHost,
    legendObjectProperties: DataViewObject,
    dataValueSource: DataViewMetadataColumn | undefined,
    categories: DataViewCategoryColumn[],
    categoryIndex: number,
    hasDynamicSeries: boolean): LegendData {

    const colorHelper = new ColorHelper(
        host.colorPalette,
        PropertiesOfCapabilities['dataPoint']['fill']);

    const legendItems: LegendDataPoint[] = [];
    const grouped: DataViewValueColumnGroup[] = dataValues.grouped() ?? [];
    const formatString: string = valueFormatter.getFormatStringByColumn(<any>dataValueSource);

    if (hasDynamicSeries) {
        for (let i: number = 0, len: number = grouped.length; i < len; i++) {
            const grouping: DataViewValueColumnGroup = grouped[i];

            const color = colorHelper.getColorForSeriesValue(
                <any>grouping.objects,
                <any>grouping.name);

            const selectionId = host.createSelectionIdBuilder()
                .withSeries(dataValues, grouping)
                .createSelectionId();

            legendItems.push({
                color: color,
                label: valueFormatter.format(grouping.name, formatString),
                identity: selectionId,
                selected: DefaultSelectionStateOfTheDataPoint,
            });
        }
    }

    let legendTitle: string = dataValues && dataValueSource
        ? dataValueSource.displayName
        : <string>legendObjectProperties.titleText;
    if (legendObjectProperties.titleText === undefined ||
        legendObjectProperties.titleText.toString().length === 0) {
        legendObjectProperties.titleText = legendTitle;
    }

    if (!legendTitle) {
        legendTitle = categories
        && categories[categoryIndex]
        && categories[categoryIndex].source
        && categories[categoryIndex].source.displayName
            ? categories[categoryIndex].source.displayName
            : <string>legendObjectProperties.titleText;
    }

    return {
        title: legendTitle,
        dataPoints: legendItems,
    };
}

export function renderLegend(
    legend: ILegend,
    mainSvgElement: Selection<SVGSVGElement, unknown, null, undefined>,
    viewport: IViewport,
    layerLegendData: LegendData,
    legendObjectProperties: DataViewObject,
    svgLegendElement: Selection<SVGSVGElement, unknown, null, undefined>): void {

    const legendData: LegendData = {
        title: '',
        dataPoints: [],
    };

    if (layerLegendData) {
        legendData.title = layerLegendData.title || '';

        legendData.dataPoints = legendData.dataPoints.concat(layerLegendData.dataPoints || []);

        legendData.fontSize = this?.legendLabelFontSize
            ? this.legendLabelFontSize
            : LegendLabelFontSizeDefault;

        legendData.grouped = !!layerLegendData.grouped;
    }

    const legendProperties: DataViewObject = legendObjectProperties;

    if (legendProperties) {
        legendDataModule.update(legendData, legendProperties);

        const position: string = legendProperties[legendProps.position] as string;

        if (position) {
            legend.changeOrientation(LegendPosition[position]);
        }
    } else {
        legend.changeOrientation(LegendPosition.Top);
    }

    legend.drawLegend(legendData, {
        height: viewport.height,
        width: viewport.width,
    });

    legendModule.positionChartArea(mainSvgElement, legend);

    const legendItems = svgLegendElement.select<SVGGElement>('#legendGroup').selectAll<SVGElement, unknown>('.legendItem, .legendTitle').nodes();
    if (legendItems && legendItems.length > 0) {
        let offset: number = 0;

        legendItems.forEach((item) => {
            item.style.fontFamily = DefaultFontFamily;
            const oldWidth = item.getBoundingClientRect().width;
            item.style.fontFamily = <string>legendObjectProperties.fontFamily || DefaultFontFamily;
            const newWidth = item.getBoundingClientRect().width;

            const orientation = legend.getOrientation();

            if (orientation === LegendPosition.Right ||
                orientation === LegendPosition.RightCenter ||
                orientation === LegendPosition.Left ||
                orientation === LegendPosition.LeftCenter) {
                item.style.transform = `translateX(${0}px)`;
                // TODO: add processing for left right position
            } else {
                item.style.transform = `translateX(${offset}px)`;
            }
            offset += newWidth - oldWidth;
        });
    }
}

export function getLegendProperties(
    dataViewMetadata: DataViewMetadata,
    axisTitleOnByDefault: boolean): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const legendObject: DataViewObject = objects['legend'];

        if (legendObject) {
            dataViewObject = {
                show: legendObject['show'],
                position: legendObject['position'],
                showTitle: legendObject['showTitle'] == null
                    ? axisTitleOnByDefault
                    : legendObject['showTitle'],
                titleText: legendObject['titleText'],
                labelColor: legendObject['labelColor'],
                fontSize: legendObject['fontSize'],
                fontFamily: legendObject['fontFamily'],
            };
        }
    }

    return dataViewObject;
}

export function setLegendProperties(
    legendProperties: DataViewObject,
    objects: DataViewObjects = {}) {

    legendProperties.show = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['legend']['show'],
        true);

    legendProperties.labelColor = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['legend']['labelColor'],
        {solid: {color: DefaultColor}});

    legendProperties.fontSize = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['legend']['fontSize'],
        LegendLabelFontSizeDefault);

    legendProperties.fontFamily = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['legend']['fontFamily'],
        DefaultFontFamily);

    legendProperties.showTitle = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['legend']['showTitle'],
        true);

    legendProperties.titleText = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['legend']['titleText']);

    legendProperties.position = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['legend']['position'],
        DefaultLegendPosition);
}
