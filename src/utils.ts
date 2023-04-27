import powerbi from 'powerbi-visuals-api';
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import {axis} from 'powerbi-visuals-utils-chartutils';
import NumberRange = powerbi.NumberRange;
import {IAxisProperties} from 'powerbi-visuals-utils-chartutils/lib/axis/axisInterfaces';
import {IAxes} from './visualInterfaces';
import {Visual} from './visual';
import {LabelMargin} from './labelLayoutUtils';
import PrimitiveValue = powerbi.PrimitiveValue;
import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {scaleLinear, ScaleLinear} from 'd3-scale';

const minRatioBubbleSize = 120;
const DisplayUnitValue: number = 1;
const shapesSizeMin = 0;
const shapesSizeMax = 100;
const rangeMin = 1;
const rangeMax = 4;

export function getBubbleRadius(
    bubbleSize: PrimitiveValue | null,
    viewportSize: ISize,
    sizeScale: ScaleLinear<number, number>,
    shapesSize: number = 0) {
    const minSize = Math.min(viewportSize.width, viewportSize.height);

    if (bubbleSize) {
        const radius: number = <number>bubbleSize;
        const shapeScale = scaleLinear(
            [shapesSizeMin, shapesSizeMax],
            [rangeMin, rangeMax]);

        return minSize / minRatioBubbleSize * sizeScale(radius * shapeScale(shapesSize));
    } else {
        const radius: number = Visual.DefaultBubbleSize;
        const shapeScale = scaleLinear([shapesSizeMin, shapesSizeMax], [rangeMin, rangeMax]);

        return radius * shapeScale(shapesSize);
    }
}

export function getSizeRangeForGroups(
    dataViewValueGroups: DataViewValueColumnGroup[] | undefined,
    sizeColumnIndex: number | undefined): NumberRange {

    const result: NumberRange = {};

    if (dataViewValueGroups) {
        dataViewValueGroups.forEach((group) => {
            const sizeColumn = getMeasureValue(
                sizeColumnIndex,
                group.values);

            const currentRange = axis.getRangeForColumn(<any>sizeColumn);

            if (result.min == null || currentRange.min == null || result.min > currentRange.min) {
                result.min = currentRange.min;
            }

            if (result.max == null || currentRange.max == null || result.max < currentRange.max) {
                result.max = currentRange.max;
            }
        });
    }

    return result;
}

export function getMeasureValue(
    measureIndex: number | undefined,
    seriesValues: DataViewValueColumn[]): DataViewValueColumn | null {
    if (seriesValues && typeof measureIndex !== 'undefined' && measureIndex >= 0) {
        return seriesValues[measureIndex];
    }

    return null;
}

export function getVisibleAngleRange(
    axes: IAxes,
    xVal: number | null,
    yVal: number | null,
    viewport: ISize,
    radius: PrimitiveValue | null,
    sizeScale: ScaleLinear<number, number>,
    shapesSize: number): [number, number] {
    const width = viewport.width;
    const height = viewport.height;
    let angleRange: [number, number] = [0, 360];
    const x = xVal !== null ? axes.x.scale(xVal) : viewport.width / 2;
    const y = yVal !== null ? axes.y.scale(yVal) : viewport.height / 2;
    const bubbleSize = getBubbleRadius(radius, viewport, sizeScale, shapesSize) + LabelMargin;

    if (hasIntersection(0, 0, x, y, bubbleSize)) {
        angleRange = [270, 360];
    } else if (hasIntersection(width, 0, x, y, bubbleSize)) {
        angleRange = [180, 270];
    } else if (hasIntersection(0, height, x, y, bubbleSize)) {
        angleRange = [0, 90];
    } else if (hasIntersection(width, height, x, y, bubbleSize)) {
        angleRange = [90, 180];
    } else if (hasIntersection(width, y, x, y, bubbleSize)) {
        angleRange = [90, 270];
    } else if (hasIntersection(0, y, x, y, bubbleSize)) {
        angleRange = [-90, 90];
    } else if (hasIntersection(x, 0, x, y, bubbleSize)) {
        angleRange = [180, 360];
    } else if (hasIntersection(x, height, x, y, bubbleSize)) {
        angleRange = [0, 180];
    }

    return angleRange;
}

export function hasIntersection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number) {
    return (Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= Math.pow(radius, 2);
}

export function getVisibleLabelsCountOnAngleRange(angleRange: [number, number]): number {
    const maxLabelPositionOn360deg = 8;
    const maxLabelPositionOn180deg = 3;
    const maxLabelPositionOn90deg = 1;

    const angle = Math.abs(angleRange.reduce((pv, cv) => pv - cv));
    switch (angle) {
        case 90:
            return maxLabelPositionOn90deg;
        case 180:
            return maxLabelPositionOn180deg;
        case 360:
            return maxLabelPositionOn360deg;
        default:
            return 0;
    }
}

export function getLineStyleParam(lineStyle: string): string | null {
    switch (lineStyle) {
        case 'solid':
            return 'none';
        case 'dashed':
            return '7, 5';
        case 'dotted':
            return '2, 2';
    }

    return null;
}

export function getUnitType(axisProperties: IAxisProperties): string | null {
    if (axisProperties.formatter
        && axisProperties.formatter.displayUnit
        && axisProperties.formatter.displayUnit.value > DisplayUnitValue) {

        return axisProperties.formatter.displayUnit.title;
    }

    return null;
}

export function getTitleWithUnitType(
    title: string,
    axisStyle: string,
    axis: IAxisProperties): string {
    const unitTitle = getUnitType(axis) || 'No unit';
    switch (axisStyle) {
        case 'showUnitOnly': {
            return unitTitle;
        }
        case 'showTitleOnly': {
            return title;
        }
        case 'showBoth': {
            return `${title} (${unitTitle})`;
        }
    }

    return title;
}

export function getObjectPropertiesLength(obj: object | null | undefined): number {
    let counter: number = 0;

    if (obj) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const key in obj) {
            counter++;
        }
    }

    return counter;
}

export function compareObjects(obj1: Array<object> | null | undefined, obj2: object[] | null | undefined, property: string): boolean {
    let isEqual: boolean = false;

    if (!Array.isArray(obj1) || !Array.isArray(obj2)) {
        return obj1 === obj2;
    }

    if (obj1.length > 0 && obj2.length > 0 && obj1.length === obj2.length) {
        isEqual = true;
        obj1.forEach((o1, i) => {
            obj2.forEach((o2, j) => {
                if (i === j) {
                    isEqual = isEqual && o1[property] === o2[property];
                }
            });
        });
    } else if (obj1.length === 0 && obj2.length === 0) {
        isEqual = true;
    }

    return isEqual;
}
