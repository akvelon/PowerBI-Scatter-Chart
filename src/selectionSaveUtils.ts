import {VisualDataPoint} from './visualInterfaces';
import powerbi from 'powerbi-visuals-api';
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualObjectInstance = powerbi.VisualObjectInstance;

export function saveSelection(selection: VisualDataPoint[], host: IVisualHost): void {
    const storedSelection: VisualDataPoint[] = createStoredSelection(selection);

    const instance: VisualObjectInstance = {
        objectName: 'selectionSaveSettings',
        selector: <any>undefined,
        properties: {
            selection: JSON.stringify(storedSelection),
        },
    };

    host.persistProperties({
        replace: [
            instance,
        ],
    });
}

function createStoredSelection(selection: VisualDataPoint[]): VisualDataPoint[] {
    // Here we prevent storing of the 'entirePath' and 'pathElement' properties
    // because they can have a circular object links
    // which causes endless loop when trying to convert to JSON
    return selection.map((dataPoint: VisualDataPoint) => {
        const storedDataPoint = {} as VisualDataPoint;
        for (const key in dataPoint) {
            storedDataPoint[key] = dataPoint[key];
        }

        storedDataPoint.entirePath = <any>null;
        storedDataPoint.pathElement = <any>null;

        return storedDataPoint;
    });
}
