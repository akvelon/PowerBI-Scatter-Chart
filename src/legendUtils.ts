// import powerbiApi from "powerbi-visuals-api";
// import { legendInterfaces, legendData, legend } from "powerbi-visuals-utils-chartutils";
// import { ColorHelper } from "powerbi-visuals-utils-colorutils";
// import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
// import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
// import { DefaultColor } from "./axesPropertiesUtils";
// import { PropertiesOfCapabilities } from "./properties";
// import * as d3 from "d3-selection";
//
// import ILegend = legendInterfaces.ILegend;
// import LegendData = legendInterfaces.LegendData;
// import legendDataModule = legendData;
// import legendModule = legend;
// import legendProps = legendInterfaces.legendProps;
// import LegendPosition = legendInterfaces.LegendPosition;
// import DataViewObjects = powerbiApi.DataViewObjects;
// import DataViewValueColumns = powerbiApi.DataViewValueColumns;
// import IVisualHost = powerbiApi.extensibility.visual.IVisualHost;
// import DataViewObject = powerbiApi.DataViewObject;
// import DataViewMetadataColumn = powerbiApi.DataViewMetadataColumn;
// import DataViewCategoryColumn = powerbiApi.DataViewCategoryColumn;
// import DataViewValueColumnGroup = powerbiApi.DataViewValueColumnGroup;
// import ISelectionId = powerbiApi.visuals.ISelectionId;
// import IViewport = powerbiApi.IViewport;
// import DataViewMetadata = powerbiApi.DataViewMetadata;
//
// export const MinAmountOfDataPointsInTheLegend: number = 1;
// export const LegendLabelFontSizeDefault: number = 9;
// export const DefaultFontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
// export const DefaultLegendTitleText: string = "Type";
// export const DefaultLegendPosition: string = "Top";
// const topOffset: number = 45;
// const DefaultSelectionStateOfTheDataPoint: boolean = false;
//
// export function buildLegendData(
//     dataValues: DataViewValueColumns,
//     host: IVisualHost,
//     legendObjectProperties: DataViewObject,
//     dataValueSource: DataViewMetadataColumn,
//     categories: DataViewCategoryColumn[],
//     categoryIndex: number,
//     hasDynamicSeries: boolean): legendInterfaces.LegendData {
//
//     const colorHelper: ColorHelper = new ColorHelper(
//         host.colorPalette,
//         PropertiesOfCapabilities["dataPoint"]["fill"]);
//
//     const legendItems: legendInterfaces.LegendDataPoint[] = [];
//     const grouped: DataViewValueColumnGroup[] = dataValues.grouped();
//     const formatString: string = valueFormatter.getFormatStringByColumn(dataValueSource);
//
//     if (hasDynamicSeries) {
//         for (let i: number = 0, len: number = grouped.length; i < len; i++) {
//             let grouping: DataViewValueColumnGroup = grouped[i],
//                 selectionId: ISelectionId,
//                 color: string;
//
//             color = colorHelper.getColorForSeriesValue(
//                 grouping.objects!,
//                 grouping.name!);
//
//             selectionId = host.createSelectionIdBuilder()
//                 .withSeries(dataValues, grouping)
//                 .createSelectionId();
//
//             legendItems.push({
//                 color: color,
//                 label: valueFormatter.format(grouping.name, formatString),
//                 identity: selectionId,
//                 selected: DefaultSelectionStateOfTheDataPoint
//             });
//         }
//     }
//
//     let legendTitle: string = dataValues && dataValueSource
//         ? dataValueSource.displayName
//         : <string>legendObjectProperties.titleText;
//     if (legendObjectProperties.titleText === undefined ||
//         legendObjectProperties.titleText.toString().length === 0) {
//         legendObjectProperties.titleText = legendTitle;
//     }
//
//
//     if (!legendTitle) {
//         legendTitle = categories
//             && categories[categoryIndex]
//             && categories[categoryIndex].source
//             && categories[categoryIndex].source.displayName
//             ? categories[categoryIndex].source.displayName
//             : <string>legendObjectProperties.titleText;
//     }
//
//     return {
//         title: legendTitle,
//         dataPoints: legendItems
//     };
// }
//
// export function renderLegend(
//     visualLegend: ILegend,
//     svg: d3.Selection<SVGElement>,
//     viewport: IViewport,
//     layerLegendData: LegendData,
//     legendObjectProperties: DataViewObject,
//     legendElement): void {
//
//     const legendData: LegendData = {
//         title: "",
//         dataPoints: []
//     };
//
//     const legend: ILegend = visualLegend;
//
//     const svgLegendElement = legendElement[0].parentNode;
//
//     if (layerLegendData) {
//         legendData.title = layerLegendData.title || "";
//
//         legendData.dataPoints = legendData.dataPoints.concat(layerLegendData.dataPoints || []);
//
//         legendData.fontSize = this.legendLabelFontSize
//             ? this.legendLabelFontSize
//             : LegendLabelFontSizeDefault;
//
//         legendData.grouped = !!layerLegendData.grouped;
//     }
//
//     const legendProperties: DataViewObject = legendObjectProperties;
//
//     if (legendProperties) {
//         legendDataModule.update(legendData, legendProperties);
//
//         const position: string = legendProperties[legendProps.position] as string;
//
//         if (position) {
//             legend.changeOrientation(LegendPosition[position]);
//         }
//     }
//     else {
//         legend.changeOrientation(LegendPosition.Top);
//     }
//
//     if (legendData.dataPoints.length === MinAmountOfDataPointsInTheLegend
//         && !legendData.grouped) {
//         // legendData.dataPoints = [];
//     }
//
//     legend.drawLegend(legendData, {
//         height: viewport.height,
//         width: viewport.width
//     });
//
//     legendModule.positionChartArea(svg, legend);
//
//     const legendGroup = legendElement[0][0];
//     /* Chromium 29.0.1504 doesn't support 'children' prop on SVG elements so we use 'childNodes' in this case.
//         This Chromium version is used for generating PDF and images on the backend.
//         */
//     let legendItems: Array<any> = [].slice.call('children' in legendGroup ? legendGroup.children : legendGroup.childNodes);
//
//     legendItems = legendItems.filter(item => (item.classList.value === "legendItem" || item.classList.value === "legendTitle"));
//
//     if (legendItems && legendItems.length > 0) {
//         let offset: number = 0;
//
//         legendItems.forEach((item, i, arr) => {
//             item.style.fontFamily = DefaultFontFamily;
//             let oldWidth = item.getBoundingClientRect().width;
//             item.style.fontFamily = <string>legendObjectProperties.fontFamily || DefaultFontFamily;
//             let newWidth = item.getBoundingClientRect().width;
//
//             let orientation = legend.getOrientation();
//
//             if (orientation === LegendPosition.Right ||
//                 orientation === LegendPosition.RightCenter ||
//                 orientation === LegendPosition.Left ||
//                 orientation === LegendPosition.LeftCenter) {
//                 item.style.transform = `translateX(${0}px)`;
//                 // TODO: add processing for left right position
//             } else {
//                 item.style.transform = `translateX(${offset}px)`;
//             }
//             offset += newWidth - oldWidth;
//         });
//     }
// }
//
// export function getLegendProperties(
//     dataViewMetadata: DataViewMetadata,
//     axisTitleOnByDefault: boolean): DataViewObject {
//
//     let dataViewObject: DataViewObject = {};
//
//     if (!dataViewMetadata) {
//         return dataViewObject;
//     }
//
//     const objects: DataViewObjects | undefined = dataViewMetadata.objects;
//
//     if (objects) {
//         const legendObject: DataViewObject = objects["legend"];
//
//         if (legendObject) {
//             dataViewObject = {
//                 show: legendObject["show"],
//                 position: legendObject["position"],
//                 showTitle: legendObject["showTitle"] == null
//                     ? axisTitleOnByDefault
//                     : legendObject["showTitle"],
//                 titleText: legendObject["titleText"],
//                 labelColor: legendObject["labelColor"],
//                 fontSize: legendObject["fontSize"],
//                 fontFamily: legendObject["fontFamily"],
//             };
//         }
//     }
//
//     return dataViewObject;
// }
//
// export function setLegendProperties(
//     legendProperties: DataViewObject,
//     objects: DataViewObjects = {}) {
//
//     legendProperties.show = dataViewObjects.getValue<boolean>(
//         objects,
//         PropertiesOfCapabilities["legend"]["show"],
//         true);
//
//     legendProperties.labelColor = dataViewObjects.getValue(
//         objects,
//         PropertiesOfCapabilities["legend"]["labelColor"],
//         { solid: { color: DefaultColor } });
//
//     legendProperties.fontSize = dataViewObjects.getValue<number>(
//         objects,
//         PropertiesOfCapabilities["legend"]["fontSize"],
//         LegendLabelFontSizeDefault);
//
//     legendProperties.fontFamily = dataViewObjects.getValue(
//         objects,
//         PropertiesOfCapabilities["legend"]["fontFamily"],
//         DefaultFontFamily);
//
//     legendProperties.showTitle = dataViewObjects.getValue<boolean>(
//         objects,
//         PropertiesOfCapabilities["legend"]["showTitle"],
//         true);
//
//     legendProperties.titleText = dataViewObjects.getValue<string>(
//         objects,
//         PropertiesOfCapabilities["legend"]["titleText"]);
//
//     legendProperties.position = dataViewObjects.getValue(
//         objects,
//         PropertiesOfCapabilities["legend"]["position"],
//         DefaultLegendPosition);
// }
