import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {IAxes, VisualDataPoint} from './visualInterfaces';
import {ScaleLinear} from 'd3-scale';
import powerbi from 'powerbi-visuals-api';
import DataViewObject = powerbi.DataViewObject;
import {getVisibleAngleRange} from './utils';

export const DefaultPosition: number = 0;
export const LabelMargin: number = 5;
export const DataLabelXOffset: number = 2;
export const DataLabelYOffset: number = 1.8;
const DataLabelBorderRadius: number = 4;
const DataLabelBackgroundOffset: number = 5;

// module Selectors {
//     export const labelBackgroundGroup = CssConstants.createClassAndSelector("labelBackgroundGroup");
//     export const labelBackground = CssConstants.createClassAndSelector("labelBackground");
// }
//
// export function getVisualLabelLayout(
//     labelSettings: VisualDataLabelsSettings,
//     viewport: IViewport,
//     sizeScale: NumberRange,
//     axes: IAxes,
//     shapesSize: number): ILabelLayout {
//
//     const xScale: any = axes.x.scale,
//         yScale: any = axes.y.scale,
//         fontSizeInPx: string = pixelConverter.fromPoint(labelSettings.fontSize || 14),
//         fontFamily: string | undefined = labelSettings.fontFamily;
//
//
//     return {
//         labelText: (dataPoint: VisualDataPoint) => {
//             return getLabelFormattedText({
//                 label: dataPoint.formattedCategory ? dataPoint.formattedCategory() : undefined,
//                 fontSize: labelSettings.fontSize,
//                 maxWidth: viewport.width,
//             });
//         },
//         labelLayout: {
//             x: (dataPoint: VisualDataPoint) => {
//                 const radius = visualUtils.getBubbleRadius(dataPoint.radius.value, viewport, sizeScale, shapesSize);
//                 const margin = radius + LabelMargin;
//                 let x = dataPoint.x !== null ? xScale(dataPoint.x) : viewport.width / 2;
//                 let y = dataPoint.y !== null ? yScale(dataPoint.y) : viewport.height / 2;
//                 let angle = dataPoint.labelAnglePosition
//                     ? dataPoint.labelAnglePosition * Math.PI / 180
//                     : 0;
//                 let newX = x + (radius + LabelMargin) * Math.cos(angle);
//
//                 return getDefinedNumberValue(Math.round(newX));
//             },
//             y: (dataPoint: VisualDataPoint) => {
//                 const radius = visualUtils.getBubbleRadius(dataPoint.radius.value, viewport, sizeScale, shapesSize);
//                 const margin = radius + LabelMargin;
//                 const fontSize: number = parseInt(dataPoint.labelFontSize);
//                 let y = dataPoint.y !== null ? yScale(dataPoint.y) : viewport.height / 2;
//                 let angle = dataPoint.labelAnglePosition
//                     ? dataPoint.labelAnglePosition * Math.PI / 180
//                     : 0;
//                 let newY = y - (radius + LabelMargin) * Math.sin(angle);
//                 let yVal = getDefinedNumberValue(Math.round(newY));
//
//                 return yVal;
//             },
//         },
//         filter: (dataPoint: VisualDataPoint) => {
//             return dataPoint != null && dataPoint.formattedCategory != undefined && dataPoint.formattedCategory() != null;
//         },
//         style: {
//             "fill": (dataPoint: VisualDataPoint) => { return dataPoint.labelFill; },
//             "font-size": fontSizeInPx,
//             "font-family": fontFamily,
//         },
//     };
// }
//
// export function getAngle(dataPoint: VisualDataPoint, viewport, y) {
//     const maxLabelPositionOn360deg = 8;
//     const maxLabelPositionOn180deg = 3;
//     const maxLabelPositionOn90deg = 1;
//
//     let dataPointPosition = 0;
//     if (!dataPoint.angleRange || !dataPoint.equalDataPointLabelsCount) return dataPointPosition;
//
//     let angleRange = dataPoint.angleRange!;
//     let labelsInfo = dataPoint.equalDataPointLabelsCount!;
//     let angle = Math.abs(angleRange.reduce((pv, cv) => pv - cv));
//
//     if (angle === 360) {
//         if (labelsInfo.count <= maxLabelPositionOn360deg) {
//             let startAngle = y >= viewport.height / 2 ? 0 : 180;
//             switch (labelsInfo.count) {
//                 case 1:
//                     dataPointPosition = startAngle + 90;
//                     break;
//                 case 2:
//                     dataPointPosition = (startAngle + 90) - 45 * (labelsInfo.i === 0 ? -1 : 1);
//                     break;
//                 case 3:
//                     dataPointPosition = angleRange![0] + 45 * (labelsInfo!.i + 1);
//                     break;
//                 default:
//                     dataPointPosition = 45 * labelsInfo!.i;
//                     break;
//             }
//         } else {
//             if (labelsInfo.i < labelsInfo.count) {
//                 dataPointPosition = 45 * labelsInfo.i;
//             } else {
//                 dataPointPosition = 0;
//             }
//         }
//     } else if (angle === 180) {
//         if (labelsInfo.count <= maxLabelPositionOn180deg) {
//             let startAngle = angleRange[0] + 90;
//             switch (labelsInfo.count) {
//                 case 1:
//                     dataPointPosition = startAngle;
//                     break;
//                 case 2:
//                     dataPointPosition = startAngle - 45 * (labelsInfo.i === 0 ? -1 : 1);
//                     break;
//                 case 3:
//                     dataPointPosition = angleRange[0] + 45 * (labelsInfo.i + 1);
//                     break;
//                 default:
//                     dataPointPosition = startAngle;
//                     break;
//             }
//         } else {
//             if (labelsInfo.i < labelsInfo.count) {
//                 dataPointPosition = angleRange[0] + 45 * (labelsInfo.i + 1);
//             } else {
//                 dataPointPosition = 0;
//             }
//         }
//     } else if (angle === 90) {
//         if (labelsInfo.count === maxLabelPositionOn90deg) {
//             dataPointPosition = (angleRange.reduce((pv, cv) => pv + cv)) / 2;
//         } else {
//             if (labelsInfo.i < labelsInfo.count) {
//                 dataPointPosition = (angleRange.reduce((pv, cv) => pv + cv)) / 2;
//             } else {
//                 dataPointPosition = 0;
//             }
//         }
//     }
//
//     return dataPointPosition;
// }
//
// export function getLabelDelta(size: ISize, labelAnglePosition: number): VisualLabelsDelta {
//     let dx: number,
//         dy: number;
//
//     dx = size.width / DataLabelXOffset;
//     dy = size.height / DataLabelYOffset;
//
//     switch (labelAnglePosition) {
//         case 0: {
//             return { dx: dx, dy: 0 };
//         }
//         case 45: {
//             return { dx: dx, dy: -dy };
//         }
//         case 90: {
//             return { dx: 0, dy: -dy };
//         }
//         case 135: {
//             return { dx: -dx, dy: -dy };
//         }
//         case 180: {
//             return { dx: -dx, dy: 0 };
//         }
//         case 225: {
//             return { dx: -dx, dy: dy };
//         }
//         case 270: {
//             return { dx: 0, dy: dy };
//         }
//         case 315: {
//             return { dx: dx, dy: dy };
//         }
//         default: {
//             return { dx: 0, dy: 0 };
//         }
//     }
// }
//
// export function getDefinedNumberValue(value: any): number {
//     return isNaN(value) || value === null
//         ? DefaultPosition
//         : value;
// }
//
// export function bindLabelLayout(
//     dataLabelsSettings: VisualDataLabelsSettings,
//     data: VisualData,
//     labelGraphicsContext,
//     labelBackgroundGraphicsContext,
//     shapesSize: number) {
//     if (dataLabelsSettings.show) {
//         let layout: ILabelLayout,
//             clonedDataPoints: VisualDataPoint[],
//             labels: d3.selection.Update<any>;
//
//         layout = getVisualLabelLayout(dataLabelsSettings, data.size, data.sizeScale, data.axes, shapesSize);
//
//         clonedDataPoints = data.dataPoints.map(x => ({ ...x }));
//
//         clonedDataPoints.sort((a, b) => {
//             if (a.x > b.x) {
//                 return 1;
//             } if (a.x < b.x) {
//                 return -1;
//             } else {
//                 if (a.y > b.y) {
//                     return 1;
//                 } if (a.y < b.y) {
//                     return -1;
//                 }
//             }
//
//             return 0;
//         });
//
//
//         let equalDataPointLabels: Array<Array<any>> = [];
//         let tempArray: Array<any> = [];
//
//         clonedDataPoints.forEach((elem, i, array) => {
//             if (i > 0) {
//                 if (elem.x === array[i - 1].x && elem.y === array[i - 1].y) {
//                     tempArray.push({ ...elem, index: i });
//                 } else {
//                     if (tempArray.length > 1) {
//                         equalDataPointLabels.push(tempArray);
//                     }
//
//                     tempArray = [{ ...elem, index: i }];
//                 }
//
//                 if (i === array.length - 1 && tempArray.length > 1) {
//                     equalDataPointLabels.push(tempArray);
//                 }
//             } else {
//                 tempArray.push({ ...elem, index: i });
//             }
//         });
//
//         equalDataPointLabels.forEach(dataLabelArray => {
//             let maxLabelsCount: number = 0;
//             dataLabelArray.forEach((dataPoint, i, array) => {
//                 if (maxLabelsCount === 0) {
//                     maxLabelsCount = visualUtils.getVisibleLabelsCountOnAngleRange(dataPoint.angleRange);
//                 }
//
//                 clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.count = array.length;
//                 clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.i = i;
//                 if (clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.count > maxLabelsCount) {
//                     if (clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.i >= maxLabelsCount) {
//                         clonedDataPoints.splice(dataPoint.index, 1);
//                     }
//                 }
//
//             });
//         });
//
//         // filter unnessesary dataPoints for labels
//         clonedDataPoints = clonedDataPoints.filter(dataPoint => dataPoint !== null);
//
//         // set angle position to datapoitn label
//         clonedDataPoints = clonedDataPoints.map(dataPoint => {
//             let y = dataPoint.y !== null ? data.axes.y.scale(dataPoint.y) : data.size.height / 2;
//             let labelAnglePosition = getAngle(dataPoint, data.size, y);
//             return {
//                 ...dataPoint,
//                 labelAnglePosition
//             };
//         });
//
//         labels = dataLabelUtils.drawDefaultLabelsForDataPointChart(
//             clonedDataPoints,
//             labelGraphicsContext,
//             layout,
//             data.size);
//
//         if (labels) {
//             labels
//                 .attr({ "text-anchor": "start" })
//                 .attr("transform", (d: VisualDataPoint) => {
//                     let size: ISize = <ISize>d.size;
//
//                     let delta = getLabelDelta(size, d.labelAnglePosition!);
//
//                     return svg.manipulation.translate(delta.dx, delta.dy);
//                 });
//
//             let data = dataLabelsSettings.showBackground ? clonedDataPoints.filter(dataPoint => dataPoint.labelX && dataPoint.labelY) : [];
//
//             showLabelBackground(data, labelGraphicsContext, labelBackgroundGraphicsContext, dataLabelsSettings);
//         }
//     }
//     else {
//         dataLabelUtils.cleanDataLabels(labelGraphicsContext);
//         showLabelBackground([], labelGraphicsContext, labelBackgroundGraphicsContext, dataLabelsSettings);
//     }
// }
//
// export function showLabelBackground(
//     dataPoints: VisualDataPoint[],
//     labelGraphicsContext,
//     labelBackgroundGraphicsContext,
//     dataLabelsSettings: VisualDataLabelsSettings) {
//
//     labelBackgroundGraphicsContext = labelGraphicsContext.selectAll(Selectors.labelBackgroundGroup.selectorName)
//         .data([dataPoints]);
//
//     // When a new category added, create a new SVG group for it.
//     labelBackgroundGraphicsContext.enter()
//         .append("g")
//         .attr("class", Selectors.labelBackgroundGroup.className);
//
//
//     // For removed categories, remove the SVG group.
//     labelBackgroundGraphicsContext.exit()
//         .remove();
//
//     let labelTextDimensions: Array<ISize> = [];
//
//     labelGraphicsContext.selectAll("text").forEach(elem => {
//         elem.forEach(item => {
//             let dimension = item.getBoundingClientRect();
//             labelTextDimensions.push({
//                 width: dimension.width,
//                 height: dimension.height
//             });
//         });
//     });
//
//     // Now we bind each SVG group to the values in corresponding category.
//     // To keep the length of the values array, we transform each value into object,
//     // that contains both value and total count of all values in this category.
//     const labelBackgroundSelect = labelBackgroundGraphicsContext
//         .selectAll(Selectors.labelBackground.selectorName)
//         .data(d => {
//             return d.map((dd, i) => {
//                 let delta = getLabelDelta(dd.size, dd.labelAnglePosition);
//                 return {
//                     x: dd.labelX,
//                     y: dd.labelY,
//                     width: labelTextDimensions[i].width,
//                     height: labelTextDimensions[i].height,
//                     dx: delta.dx,
//                     dy: delta.dy,
//                     fontSize: pixelConverter.fromPointToPixel(parseInt(dd.labelFontSize)),
//                     text: dd.formattedCategory().length
//                 };
//             });
//         });
//
//     // For each new value, we create a new rectange.
//     labelBackgroundSelect.enter().append("rect")
//         .attr("class", Selectors.labelBackground.className);
//
//     // Remove rectangles, that no longer have matching values.
//     labelBackgroundSelect.exit()
//         .remove();
//
//     let fontSize = pixelConverter.fromPointToPixel(dataLabelsSettings.fontSize!);
//
//     // Set the size and position of existing rectangles.
//     labelBackgroundSelect
//         .attr("x", d => d.x + d.dx - (d.width + DataLabelBackgroundOffset) / 2)
//         .attr("y", d => d.y + d.dy - (d.height + DataLabelBackgroundOffset / 2 + fontSize) / 2)
//         .attr("rx", DataLabelBorderRadius)
//         .attr("ry", DataLabelBorderRadius)
//         .attr("width", d => d.width + DataLabelBackgroundOffset)
//         .attr("height", d => d.height + DataLabelBackgroundOffset)
//         .attr("transform", (d) => {
//             // return svg.translate(-d.width / 2, -d.height / 2);
//         })
//         .style({
//             "fill-opacity": 1 - dataLabelsSettings.transparency! / 100,
//             "fill": dataLabelsSettings.backgroundColor
//         });
//
// }

export function setDatapointVisibleAngleRange(
    dataPoints: VisualDataPoint[],
    axes: IAxes,
    size: ISize,
    sizeScale: ScaleLinear<number, number, never>,
    shapesSize: number): VisualDataPoint[] {
    const clonedDataPoins = dataPoints.map(dataPoint => {
        const angleRange = getVisibleAngleRange(axes, dataPoint.x, dataPoint.y, size, dataPoint.radius.value, sizeScale, shapesSize);
        return {
            ...dataPoint,
            angleRange,
        };
    });

    return clonedDataPoins;
}
