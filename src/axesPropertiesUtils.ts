import powerbi from 'powerbi-visuals-api';
import DataViewMetadata = powerbi.DataViewMetadata;
import DataViewObject = powerbi.DataViewObject;
import DataViewObjects = powerbi.DataViewObjects;
import {dataViewObjects} from 'powerbi-visuals-utils-dataviewutils';
import {PropertiesOfCapabilities} from './properties';

const DefaultFontFamily: string = '"Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif';
const DefaultTitleFontSize: string = '11';
const DefaultGridlinesColor: string = '#eaeaea';
const DefaultAxesColor: string = '#777777';
const DefaultAxisTitle: string = '';
const DefaultAxisLineStyle: string = 'solid';
export const DefaultColor: string = '#777777';
const DefaultStrokeWidth: number = 1;
const DefaultAxisScale: string = 'linear';

const DefaultConstantLineValue: number = 0;
const DefaultConstantLineShow: boolean = false;

export function getCategoryAxisProperties(
    dataViewMetadata: DataViewMetadata,
    axisTitleOnByDefault: boolean): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects = dataViewMetadata.objects;

    if (objects) {
        const categoryAxisObject: DataViewObject = objects['categoryAxis'];

        if (categoryAxisObject) {
            dataViewObject = {
                show: categoryAxisObject['show'],
                axisScale: categoryAxisObject['axisScale'],
                axisColor: categoryAxisObject['axisColor'],
                axisTitle: categoryAxisObject['axisTitle'],
                start: categoryAxisObject['start'],
                end: categoryAxisObject['end'],
                showAxisTitle: categoryAxisObject['showAxisTitle'] == null
                    ? axisTitleOnByDefault
                    : categoryAxisObject['showAxisTitle'],
                axisStyle: categoryAxisObject['axisStyle'],
                labelDisplayUnits: categoryAxisObject['labelDisplayUnits'],
                valueDecimalPlaces: categoryAxisObject['valueDecimalPlaces'],
                fontSize: categoryAxisObject['fontSize'],
                fontFamily: categoryAxisObject['fontFamily'],
                titleFontSize: categoryAxisObject['titleFontSize'],
                gridlinesColor: categoryAxisObject['gridlinesColor'],
                axisTitleColor: categoryAxisObject['axisTitleColor'],
                strokeWidth: categoryAxisObject['strokeWidth'],
            };
        }
    }

    return dataViewObject;
}

export function getValueAxisProperties(
    dataViewMetadata: DataViewMetadata,
    axisTitleOnByDefault: boolean): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const valueAxisObject: DataViewObject = objects['valueAxis'];

        if (valueAxisObject) {
            dataViewObject = {
                show: valueAxisObject['show'],
                axisScale: valueAxisObject['axisScale'],
                axisColor: valueAxisObject['axisColor'],
                axisTitle: valueAxisObject['axisTitle'],
                start: valueAxisObject['start'],
                end: valueAxisObject['end'],
                showAxisTitle: valueAxisObject['showAxisTitle'] == null
                    ? axisTitleOnByDefault
                    : valueAxisObject['showAxisTitle'],
                axisStyle: valueAxisObject['axisStyle'],
                labelDisplayUnits: valueAxisObject['labelDisplayUnits'],
                valueDecimalPlaces: valueAxisObject['valueDecimalPlaces'],
                fontSize: valueAxisObject['fontSize'],
                fontFamily: valueAxisObject['fontFamily'],
                titleFontSize: valueAxisObject['titleFontSize'],
                gridlinesColor: valueAxisObject['gridlinesColor'],
                axisTitleColor: valueAxisObject['axisTitleColor'],
                strokeWidth: valueAxisObject['strokeWidth'],
            };
        }
    }

    return dataViewObject;
}

// export function shouldRenderAxis(
//     axisProperties: IAxisProperties,
//     propertyName: string = "show"): boolean {
//
//     const MinAmountOfValues: number = 0;
//
//     if (!axisProperties) {
//         return false;
//     }
//     else if (axisProperties.isCategoryAxis
//         && (!this.categoryAxisProperties
//             || this.categoryAxisProperties[propertyName] == null
//             || this.categoryAxisProperties[propertyName])) {
//
//         return axisProperties.values && axisProperties.values.length > MinAmountOfValues;
//     }
//     else if (!axisProperties.isCategoryAxis && (!this.valueAxisProperties
//         || this.valueAxisProperties[propertyName] == null
//         || this.valueAxisProperties[propertyName])) {
//
//         return axisProperties.values && axisProperties.values.length > MinAmountOfValues;
//     }
//
//     return false;
// }

export function setCategoryAxisProperties(
    categoryAxisProperties: DataViewObject,
    objects: DataViewObjects = {}) {
    categoryAxisProperties.show = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['show'],
        true);

    categoryAxisProperties.axisColor = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['categoryAxis']['axisColor'],
        DefaultAxesColor);

    if (categoryAxisProperties.axisTitleColor === undefined) {
        categoryAxisProperties.axisTitleColor = categoryAxisProperties.axisColor;
    } else {
        categoryAxisProperties.axisTitleColor = dataViewObjects.getFillColor(
            objects,
            PropertiesOfCapabilities['categoryAxis']['axisTitleColor'],
            DefaultAxesColor);
    }

    categoryAxisProperties.fontSize = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['fontSize'],
        DefaultTitleFontSize);

    categoryAxisProperties.fontFamily = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['categoryAxis']['fontFamily'],
        DefaultFontFamily);

    categoryAxisProperties.valueDecimalPlaces = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['valueDecimalPlaces']);

    categoryAxisProperties.start = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['start'],
        undefined);

    categoryAxisProperties.end = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['end'],
        undefined);

    categoryAxisProperties.axisScale = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['axisScale'],
        DefaultAxisScale);

    categoryAxisProperties.showAxisTitle = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['showAxisTitle'],
        true);

    categoryAxisProperties.titleFontSize = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['titleFontSize'],
        DefaultTitleFontSize);

    categoryAxisProperties.gridlinesColor = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['categoryAxis']['gridlinesColor'],
        DefaultGridlinesColor);

    categoryAxisProperties.strokeWidth = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['categoryAxis']['strokeWidth'],
        DefaultStrokeWidth);

    categoryAxisProperties.axisTitle = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['categoryAxis']['axisTitle'],
        DefaultAxisTitle);

    categoryAxisProperties.showGridlines = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['categoryAxis']['showGridlines'],
        true);

    categoryAxisProperties.lineStyle = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['categoryAxis']['lineStyle'],
        DefaultAxisLineStyle);
}

export function setValueAxisProperties(
    valueAxisProperties: DataViewObject,
    objects: DataViewObjects = {}) {

    valueAxisProperties.show = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['valueAxis']['show'],
        true);

    valueAxisProperties.axisColor = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['valueAxis']['axisColor'],
        DefaultAxesColor);

    if (valueAxisProperties.axisTitleColor === undefined) {
        valueAxisProperties.axisTitleColor = valueAxisProperties.axisColor;
    } else {
        valueAxisProperties.axisTitleColor = dataViewObjects.getFillColor(
            objects,
            PropertiesOfCapabilities['valueAxis']['axisTitleColor'],
            DefaultAxesColor);
    }

    valueAxisProperties.fontSize = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['valueAxis']['fontSize'],
        DefaultTitleFontSize);

    valueAxisProperties.fontFamily = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['valueAxis']['fontFamily'],
        DefaultFontFamily);

    valueAxisProperties.valueDecimalPlaces = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['valueAxis']['valueDecimalPlaces']);

    valueAxisProperties.start = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['valueAxis']['start'],
        undefined);

    valueAxisProperties.end = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['valueAxis']['end'],
        undefined);


    valueAxisProperties.axisScale = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['valueAxis']['axisScale'],
        DefaultAxisScale);

    valueAxisProperties.showAxisTitle = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['valueAxis']['showAxisTitle'],
        true);

    valueAxisProperties.titleFontSize = dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities['valueAxis']['titleFontSize'],
        DefaultTitleFontSize);

    valueAxisProperties.gridlinesColor = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['valueAxis']['gridlinesColor'],
        DefaultGridlinesColor);

    valueAxisProperties.strokeWidth = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['valueAxis']['strokeWidth'],
        DefaultStrokeWidth);

    valueAxisProperties.axisTitle = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['valueAxis']['axisTitle'],
        DefaultAxisTitle);

    valueAxisProperties.showGridlines = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['valueAxis']['showGridlines'],
        true);

    valueAxisProperties.lineStyle = dataViewObjects.getValue(
        objects,
        PropertiesOfCapabilities['valueAxis']['lineStyle'],
        DefaultAxisLineStyle);
}

export function getXConstantLineProperties(
    dataViewMetadata: DataViewMetadata): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const xConstantLineObject: DataViewObject = objects['xConstantLine'];

        if (xConstantLineObject) {
            dataViewObject = {
                show: xConstantLineObject['show'],
                value: xConstantLineObject['value'],
                color: xConstantLineObject['color'],
            };
        }
    }

    return dataViewObject;
}

export function getYConstantLineProperties(
    dataViewMetadata: DataViewMetadata): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const yConstantLineObject: DataViewObject = objects['yConstantLine'];

        if (yConstantLineObject) {
            dataViewObject = {
                show: yConstantLineObject['show'],
                value: yConstantLineObject['value'],
                color: yConstantLineObject['color'],
            };
        }
    }

    return dataViewObject;
}

export function setXConstantLineProperties(
    xConstantLineProperties: DataViewObject,
    objects: DataViewObjects = {}) {

    xConstantLineProperties.show = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['xConstantLine']['show'],
        DefaultConstantLineShow);

    xConstantLineProperties.value = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['xConstantLine']['value'],
        DefaultConstantLineValue);

    xConstantLineProperties.color = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['xConstantLine']['color'],
        DefaultColor);
}

export function setYConstantLineProperties(
    yConstantLineProperties: DataViewObject,
    objects: DataViewObjects = {}) {

    yConstantLineProperties.show = dataViewObjects.getValue<boolean>(
        objects,
        PropertiesOfCapabilities['yConstantLine']['show'],
        DefaultConstantLineShow);

    yConstantLineProperties.value = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities['yConstantLine']['value'],
        DefaultConstantLineValue);

    yConstantLineProperties.color = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities['yConstantLine']['color'],
        DefaultColor);
}
