import powerbiApi from "powerbi-visuals-api";
import { VisualDataViewObject } from "./visualInterfaces";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjects = powerbiApi.DataViewObjects;
import DataViewMetadata = powerbiApi.DataViewMetadata;
import DataViewObject = powerbiApi.DataViewObject;
import { PropertiesOfCapabilities } from "./properties";

const DefaultSelectedPointsTransparency: number = 0;
const DefaultRegularPointsTransparency: number = 20;
const DefaultUnselectedPointsTransparency: number = 70;
const DefaultSelection: string = "[]";
const DefaultSelectionColor: string = "#777777";

export function getShapesSizeProperty(dataViewMetadata: DataViewMetadata): DataViewObject {

    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const shapesSizeObject: DataViewObject = objects["shapesSize"];

        if (shapesSizeObject) {
            dataViewObject = {
                size: shapesSizeObject["size"]
            };
        }
    }

    return dataViewObject;
}

export function getPointsTransparencyProperties(dataViewMetadata: DataViewMetadata): DataViewObject {
    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const pointsTransparencyObject: DataViewObject = objects["pointsTransparency"];

        if (pointsTransparencyObject) {
            dataViewObject = {
                selected: pointsTransparencyObject["selected"],
                regular: pointsTransparencyObject["regular"],
                unselected: pointsTransparencyObject["unselected"]
            };
        }
    }

    return dataViewObject;
}
export function getSelectionSaveSettings(dataViewMetadata: DataViewMetadata): VisualDataViewObject {
    let dataViewObject: VisualDataViewObject = { selection: [] };

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const selectionSaveObject: DataViewObject = objects["selectionSaveSettings"];

        if (selectionSaveObject) {
            dataViewObject = {
                selection: JSON.parse(<string>selectionSaveObject["selection"] || DefaultSelection)
            };
        }
    }

    return dataViewObject;
}

export function setPointsTransparencyProperty(
    pointsTransparencyProperties: DataViewObject,
    objects: DataViewObjects = {}) {

    pointsTransparencyProperties.selected = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities["pointsTransparency"]["selected"],
        DefaultSelectedPointsTransparency);

    pointsTransparencyProperties.regular = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities["pointsTransparency"]["regular"],
        DefaultRegularPointsTransparency);

    pointsTransparencyProperties.unselected = dataViewObjects.getValue<number>(
        objects,
        PropertiesOfCapabilities["pointsTransparency"]["unselected"],
        DefaultUnselectedPointsTransparency);
}

export function setSelectionSaveProperty(
    selectionSaveProperties: VisualDataViewObject,
    objects: DataViewObjects = {}): void {

    selectionSaveProperties.selection = JSON.parse(dataViewObjects.getValue<string>(
        objects,
        PropertiesOfCapabilities["selectionSaveSettings"]["selection"],
        DefaultSelection));
}

export function getSelectionColorSettings(dataViewMetadata: DataViewMetadata): DataViewObject {
    let dataViewObject: DataViewObject = {};

    if (!dataViewMetadata) {
        return dataViewObject;
    }

    const objects: DataViewObjects | undefined = dataViewMetadata.objects;

    if (objects) {
        const selectionColorObject: DataViewObject = objects["selectionColor"];

        if (selectionColorObject) {
            dataViewObject = {
                fillColor: selectionColorObject["fillColor"]
            };
        }
    }

    return dataViewObject;
}


export function setSelectionColorProperty(
    selectionColorProperties: DataViewObject,
    objects: DataViewObjects = {}): void {

    selectionColorProperties.fillColor = dataViewObjects.getFillColor(
        objects,
        PropertiesOfCapabilities["selectionColor"]["fillColor"],
        DefaultSelectionColor);
}
