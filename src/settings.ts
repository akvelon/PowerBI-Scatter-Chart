import {DataViewObjectsParser} from 'powerbi-visuals-utils-dataviewutils/lib/dataViewObjectsParser';

export class VisualSettings extends DataViewObjectsParser {
    public dataPoint = new DataPointSettings();
}

export class DataPointSettings {
    // Default color
    public defaultColor: string = '';
    // Show all
    public showAllDataPoints: boolean = true;
    // Fill
    public fill: string = '';
    // Color saturation
    public fillRule: string = '';
    // Text Size
    public fontSize: number = 12;
}
