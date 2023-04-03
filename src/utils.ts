import axis = powerbi.extensibility.utils.chart.axis;
import IAxisProperties = powerbi.extensibility.utils.chart.axis.IAxisProperties;
import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;

const minRatioBubbleSize = 120;
const DisplayUnitValue: number = 1;
const shapesSizeMin = 0;
const shapesSizeMax = 100;
const rangeMin = 1;
const rangeMax = 4;


export function getBubbleRadius(bubbleSize: PrimitiveValue, viewportSize: ISize, sizeScale, shapesSize: number = 0) {
    const minSize = Math.min(viewportSize.width, viewportSize.height);

    if (bubbleSize) {
        const radius: number = <number>bubbleSize;
        let shapeScale = d3.scale.linear()
            .domain([shapesSizeMin, shapesSizeMax])
            .range([rangeMin, rangeMax]);

        return minSize / minRatioBubbleSize * sizeScale(radius * shapeScale(shapesSize));
    } else {
        const radius: number = Visual.DefaultBubbleSize;
        let shapeScale = d3.scale.linear()
            .domain([shapesSizeMin, shapesSizeMax])
            .range([rangeMin, rangeMax]);

        return radius * shapeScale(shapesSize);
    }
}

export function getSizeRangeForGroups(
    dataViewValueGroups: DataViewValueColumnGroup[],
    sizeColumnIndex: number): NumberRange {

    const result: NumberRange = {};

    if (dataViewValueGroups) {
        dataViewValueGroups.forEach((group) => {
            const sizeColumn: DataViewValueColumn = getMeasureValue(
                sizeColumnIndex,
                group.values);

            const currentRange: NumberRange = axis.getRangeForColumn(sizeColumn);

            if (result.min == null || result.min > currentRange.min) {
                result.min = currentRange.min;
            }

            if (result.max == null || result.max < currentRange.max) {
                result.max = currentRange.max;
            }
        });
    }

    return result;
}

export function getMeasureValue(
    measureIndex: number,
    seriesValues: DataViewValueColumn[]): DataViewValueColumn {

    if (seriesValues && measureIndex >= 0) {
        return seriesValues[measureIndex];
    }

    return null;
}


export function getVisibleAngleRange(axes: IAxes, xVal, yVal, viewport, radius, sizeScale, shapesSize: number) {
    let width = viewport.width;
    let height = viewport.height;
    let angleRange = [0, 360];
    let x = xVal !== null ? axes.x.scale(xVal) : viewport.width / 2;
    let y = yVal !== null ? axes.y.scale(yVal) : viewport.height / 2;
    let radiusValue = radius !== null && radius !== undefined ? radius.value : Visual.DefaultBubbleSize;
    let bubbleSize = visualUtils.getBubbleRadius(radius, viewport, sizeScale, shapesSize) + labelLayoutUtils.LabelMargin;

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

export function hasIntersection(x1, y1, x2, y2, radius) {
    return (Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= Math.pow(radius, 2);
}

export function getVisibleLabelsCountOnAngleRange(angleRange) {
    const maxLabelPositionOn360deg = 8;
    const maxLabelPositionOn180deg = 3;
    const maxLabelPositionOn90deg = 1;

    let angle = Math.abs(angleRange.reduce((pv, cv) => pv - cv));

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

export function getLineStyleParam(lineStyle) {
    let strokeDasharray;

    switch (lineStyle) {
        case "solid":
            strokeDasharray = "none";
            break;
        case "dashed":
            strokeDasharray = "7, 5";
            break;
        case "dotted":
            strokeDasharray = "2, 2";
            break;
    }

    return strokeDasharray;
}

export function getUnitType(xAxis: IAxisProperties): string {
    if (xAxis.formatter
        && xAxis.formatter.displayUnit
        && xAxis.formatter.displayUnit.value > DisplayUnitValue) {

        return xAxis.formatter.displayUnit.title;
    }

    return null;
}

export function getTitleWithUnitType(title, axisStyle, axis: IAxisProperties): string {
    let unitTitle = visualUtils.getUnitType(axis) || "No unit";
    switch (axisStyle) {
        case "showUnitOnly": {
            return unitTitle;
        }
        case "showTitleOnly": {
            return title;
        }
        case "showBoth": {
            return `${title} (${unitTitle})`;
        }
    }
}

export function getObjectPropertiesLength(obj: object): number {
    let counter: number = 0;

    if (obj) {
        for (let key in obj) {
            counter++;
        }
    }

    return counter;
}

export function compareObjects(obj1: any[], obj2: any[], property: string): boolean {
    let isEqual: boolean = false;

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

export function getTextProperties(fontSize: number = Visual.DefaultTitleFontSize): TextProperties {
    return {
        fontFamily: Visual.DefaultFontFamily,
        fontSize: PixelConverter.toString(fontSize),
    };
}
