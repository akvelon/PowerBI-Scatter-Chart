import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {IAxes, VisualData, VisualDataLabelsSettings, VisualDataPoint, VisualLabelsDelta} from './visualInterfaces';
import {ScaleLinear} from 'd3-scale';
import powerbi from 'powerbi-visuals-api';
import {getBubbleRadius, getVisibleAngleRange, getVisibleLabelsCountOnAngleRange} from './utils';
import {Selection as d3Selection} from 'd3-selection';
import {createClassAndSelector} from 'powerbi-visuals-utils-svgutils/lib/cssConstants';
import {ILabelLayout} from 'powerbi-visuals-utils-chartutils/lib/dataLabel/dataLabelInterfaces';
import {
    cleanDataLabels,
    drawDefaultLabelsForDataPointChart,
    getLabelFormattedText,
} from 'powerbi-visuals-utils-chartutils/lib/dataLabel/dataLabelUtils';
import {pixelConverter as PixelConverter} from 'powerbi-visuals-utils-typeutils';
import {translate as svgTranslate} from 'powerbi-visuals-utils-svgutils/lib/manipulation';
import IViewport = powerbi.IViewport;

export const DefaultPosition: number = 0;
export const LabelMargin: number = 5;
export const DataLabelXOffset: number = 2;
export const DataLabelYOffset: number = 1.8;
const DataLabelBorderRadius: number = 4;
const DataLabelBackgroundOffset: number = 5;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type VisualDataPointWithIndex = WithRequired<VisualDataPoint, 'index'>;

class Selectors {
    static readonly LabelBackgroundGroup = createClassAndSelector('labelBackgroundGroup');
    static readonly LabelBackground = createClassAndSelector('labelBackground');
}

export function getVisualLabelLayout(
    labelSettings: VisualDataLabelsSettings,
    viewport: IViewport,
    sizeScale: ScaleLinear<number, number>,
    axes: IAxes,
    shapesSize: number): ILabelLayout {

    const xScale: any = axes.x.scale,
        yScale: any = axes.y.scale,
        fontSizeInPx: string = PixelConverter.fromPoint(labelSettings.fontSize || 14),
        fontFamily: string | undefined = labelSettings.fontFamily;


    return {
        labelText: (dataPoint: VisualDataPoint) => {
            return getLabelFormattedText({
                label: dataPoint.formattedCategory ? dataPoint.formattedCategory() : undefined,
                fontSize: labelSettings.fontSize,
                maxWidth: viewport.width,
            });
        },
        labelLayout: {
            x: (dataPoint: VisualDataPoint) => {
                const radius = getBubbleRadius(dataPoint.radius.value, viewport, sizeScale, shapesSize);
                const x = dataPoint.x !== null ? xScale(dataPoint.x) : viewport.width / 2;
                const angle = dataPoint.labelAnglePosition
                    ? dataPoint.labelAnglePosition * Math.PI / 180
                    : 0;
                const newX = x + (radius + LabelMargin) * Math.cos(angle);

                return getDefinedNumberValue(Math.round(newX));
            },
            y: (dataPoint: VisualDataPoint) => {
                const radius = getBubbleRadius(dataPoint.radius.value, viewport, sizeScale, shapesSize);
                const y = dataPoint.y !== null ? yScale(dataPoint.y) : viewport.height / 2;
                const angle = dataPoint.labelAnglePosition
                    ? dataPoint.labelAnglePosition * Math.PI / 180
                    : 0;
                const newY = y - (radius + LabelMargin) * Math.sin(angle);
                return getDefinedNumberValue(Math.round(newY));
            },
        },
        filter: (dataPoint: VisualDataPoint) => {
            return dataPoint != null && dataPoint.formattedCategory != undefined && dataPoint.formattedCategory() != null;
        },
        style: {
            'fill': (dataPoint: VisualDataPoint) => {
                return dataPoint.labelFill;
            },
            'font-size': fontSizeInPx,
            'font-family': fontFamily,
        },
    };
}

export function getAngle(dataPoint: VisualDataPoint, viewport, y) {
    const maxLabelPositionOn360deg = 8;
    const maxLabelPositionOn180deg = 3;
    const maxLabelPositionOn90deg = 1;

    let dataPointPosition = 0;
    if (!dataPoint.angleRange || !dataPoint.equalDataPointLabelsCount) return dataPointPosition;

    const angleRange = dataPoint.angleRange;
    const labelsInfo = dataPoint.equalDataPointLabelsCount;
    const angle = Math.abs(angleRange.reduce((pv, cv) => pv - cv));

    if (angle === 360) {
        if (labelsInfo.count <= maxLabelPositionOn360deg) {
            const startAngle = y >= viewport.height / 2 ? 0 : 180;
            switch (labelsInfo.count) {
                case 1:
                    dataPointPosition = startAngle + 90;
                    break;
                case 2:
                    dataPointPosition = (startAngle + 90) - 45 * (labelsInfo.i === 0 ? -1 : 1);
                    break;
                case 3:
                    dataPointPosition = angleRange[0] + 45 * (labelsInfo.i + 1);
                    break;
                default:
                    dataPointPosition = 45 * labelsInfo.i;
                    break;
            }
        } else {
            if (labelsInfo.i < labelsInfo.count) {
                dataPointPosition = 45 * labelsInfo.i;
            } else {
                dataPointPosition = 0;
            }
        }
    } else if (angle === 180) {
        if (labelsInfo.count <= maxLabelPositionOn180deg) {
            const startAngle = angleRange[0] + 90;
            switch (labelsInfo.count) {
                case 1:
                    dataPointPosition = startAngle;
                    break;
                case 2:
                    dataPointPosition = startAngle - 45 * (labelsInfo.i === 0 ? -1 : 1);
                    break;
                case 3:
                    dataPointPosition = angleRange[0] + 45 * (labelsInfo.i + 1);
                    break;
                default:
                    dataPointPosition = startAngle;
                    break;
            }
        } else {
            if (labelsInfo.i < labelsInfo.count) {
                dataPointPosition = angleRange[0] + 45 * (labelsInfo.i + 1);
            } else {
                dataPointPosition = 0;
            }
        }
    } else if (angle === 90) {
        if (labelsInfo.count === maxLabelPositionOn90deg) {
            dataPointPosition = (angleRange.reduce((pv, cv) => pv + cv)) / 2;
        } else {
            if (labelsInfo.i < labelsInfo.count) {
                dataPointPosition = (angleRange.reduce((pv, cv) => pv + cv)) / 2;
            } else {
                dataPointPosition = 0;
            }
        }
    }

    return dataPointPosition;
}

export function getLabelDelta(size: ISize, labelAnglePosition: number | undefined): VisualLabelsDelta {
    const dx = size.width / DataLabelXOffset;
    const dy = size.height / DataLabelYOffset;

    switch (labelAnglePosition) {
        case 0: {
            return {dx: dx, dy: 0};
        }
        case 45: {
            return {dx: dx, dy: -dy};
        }
        case 90: {
            return {dx: 0, dy: -dy};
        }
        case 135: {
            return {dx: -dx, dy: -dy};
        }
        case 180: {
            return {dx: -dx, dy: 0};
        }
        case 225: {
            return {dx: -dx, dy: dy};
        }
        case 270: {
            return {dx: 0, dy: dy};
        }
        case 315: {
            return {dx: dx, dy: dy};
        }
        default: {
            return {dx: 0, dy: 0};
        }
    }
}

export function getDefinedNumberValue(value: number | null): number {
    return value === null || isNaN(value)
        ? DefaultPosition
        : value;
}

// eslint-disable-next-line max-lines-per-function
export function bindLabelLayout(
    dataLabelsSettings: VisualDataLabelsSettings,
    data: VisualData,
    labelGraphicsContext: d3Selection<SVGGElement, unknown, null, undefined>,
    shapesSize: number) {
    if (dataLabelsSettings.show) {
        const layout = getVisualLabelLayout(dataLabelsSettings, data.size, data.sizeScale, data.axes, shapesSize);

        let clonedDataPoints = data.dataPoints.map<VisualDataPoint>(x => ({...x}));
        clonedDataPoints.sort((a, b) => {
            if (a.x === null || a.y === null || b.x === null || b.y === null) {
                return 0;
            }

            if (a.x > b.x) {
                return 1;
            }
            if (a.x < b.x) {
                return -1;
            }
            if (a.y > b.y) {
                return 1;
            }
            if (a.y < b.y) {
                return -1;
            }

            return 0;
        });

        const equalDataPointLabels: VisualDataPointWithIndex[][] = [];
        let tempArray: VisualDataPointWithIndex[] = [];

        clonedDataPoints.forEach((elem, i, array) => {
            if (i > 0) {
                if (elem.x === array[i - 1].x && elem.y === array[i - 1].y) {
                    tempArray.push({...elem, index: i});
                } else {
                    if (tempArray.length > 1) {
                        equalDataPointLabels.push(tempArray);
                    }

                    tempArray = [{...elem, index: i}];
                }

                if (i === array.length - 1 && tempArray.length > 1) {
                    equalDataPointLabels.push(tempArray);
                }
            } else {
                tempArray.push({...elem, index: i});
            }
        });

        equalDataPointLabels.forEach(dataLabelArray => {
            let maxLabelsCount: number = 0;
            dataLabelArray.forEach((dataPoint, i, array) => {
                if (maxLabelsCount === 0) {
                    maxLabelsCount = getVisibleLabelsCountOnAngleRange(dataPoint.angleRange);
                }

                if (clonedDataPoints[dataPoint.index].equalDataPointLabelsCount) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.count = array.length;
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.i = i;
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    if (clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.count > maxLabelsCount) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        if (clonedDataPoints[dataPoint.index].equalDataPointLabelsCount!.i >= maxLabelsCount) {
                            clonedDataPoints.splice(dataPoint.index, 1);
                        }
                    }
                }
            });
        });

        // filter unnecessary dataPoints for labels
        clonedDataPoints = clonedDataPoints.filter(dataPoint => dataPoint !== null);

        // set angle position to datapoint label
        clonedDataPoints = clonedDataPoints.map(dataPoint => {
            const y = dataPoint.y !== null ? data.axes.y.scale(dataPoint.y) : data.size.height / 2;
            const labelAnglePosition = getAngle(dataPoint, data.size, y);
            return {
                ...dataPoint,
                labelAnglePosition,
            };
        });

        const labels = drawDefaultLabelsForDataPointChart(
            clonedDataPoints,
            labelGraphicsContext,
            layout,
            data.size);

        if (labels) {
            labels
                .attr('text-anchor', 'start')
                .attr('transform', (d: VisualDataPoint) => {
                    const delta = getLabelDelta(<ISize>d.size, d.labelAnglePosition);
                    return svgTranslate(delta.dx, delta.dy);
                });

            const data = dataLabelsSettings.showBackground ? clonedDataPoints.filter(dataPoint => dataPoint.labelX && dataPoint.labelY) : [];

            showLabelBackground(data, labelGraphicsContext, dataLabelsSettings);
        }
    } else {
        cleanDataLabels(labelGraphicsContext);
        showLabelBackground([], labelGraphicsContext, dataLabelsSettings);
    }
}

// eslint-disable-next-line max-lines-per-function
export function showLabelBackground(
    dataPoints: VisualDataPoint[],
    labelGraphicsContext: d3Selection<SVGGElement, unknown, null, undefined>,
    dataLabelsSettings: VisualDataLabelsSettings) {

    // Add a group containing background rects for each label.
    // first-child is used to make sure that the background rects are behind the labels.
    const groups = labelGraphicsContext
        .selectAll(Selectors.LabelBackgroundGroup.selectorName)
        .data([dataPoints]);

    const groupEnter = groups.enter()
        .insert('g', ':first-child')
        .classed(Selectors.LabelBackgroundGroup.className, true);

    groups.exit().remove();

    // Find all labels in the parent selection.
    // Measure dimensions of each label and store them in an array to later use to size background rects.
    const labelTextDimensions: ISize[] = [];
    labelGraphicsContext.selectAll<SVGTextElement, undefined>('.labels text')
        .each(function () {
            const {width, height} = this.getBoundingClientRect();
            labelTextDimensions.push({width, height});
        });

    // Inside the group, create a rect for each label.
    const backgrounds = groups.merge(groupEnter)
        .selectAll(Selectors.LabelBackground.selectorName)
        .data(d => {
            return d.map((dd, i) => {
                const delta = dd.size && getLabelDelta(dd.size, dd.labelAnglePosition);
                return {
                    x: dd.labelX ?? 0,
                    y: dd.labelY ?? 0,
                    width: labelTextDimensions[i].width,
                    height: labelTextDimensions[i].height,
                    dx: delta?.dx ?? 0,
                    dy: delta?.dy ?? 0,
                    fontSize: PixelConverter.fromPointToPixel(parseInt(dd.labelFontSize)),
                    textLength: dd.formattedCategory?.().length,
                };
            });
        });

    const backgroundsEnter = backgrounds.enter()
        .append('rect')
        .classed(Selectors.LabelBackground.className, true);

    backgrounds.exit().remove();

    const fontSize = PixelConverter.fromPointToPixel(<number>dataLabelsSettings.fontSize);
    backgrounds.merge(backgroundsEnter)
        .attr('x', d => d.x + d.dx - (d.width + DataLabelBackgroundOffset) / 2)
        .attr('y', d => d.y + d.dy - (d.height + DataLabelBackgroundOffset / 2 + fontSize) / 2)
        .attr('rx', DataLabelBorderRadius)
        .attr('ry', DataLabelBorderRadius)
        .attr('width', d => d.width + DataLabelBackgroundOffset)
        .attr('height', d => d.height + DataLabelBackgroundOffset)
        .style('fill-opacity', 1 - (dataLabelsSettings.transparency ?? 0) / 100)
        .style('fill', () => dataLabelsSettings.backgroundColor ?? null);
}

export function setDatapointVisibleAngleRange(
    dataPoints: VisualDataPoint[],
    axes: IAxes,
    size: ISize,
    sizeScale: ScaleLinear<number, number>,
    shapesSize: number): VisualDataPoint[] {

    return dataPoints.map(dataPoint => {
        const angleRange = getVisibleAngleRange(axes, dataPoint.x, dataPoint.y, size, dataPoint.radius.value, sizeScale, shapesSize);
        return {
            ...dataPoint,
            angleRange,
        };
    });
}
