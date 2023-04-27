import powerbi from 'powerbi-visuals-api';
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import {VisualMeasureMetadata} from './visualInterfaces';
import {getCategoryIndexOfRole, getMeasureIndexOfRole} from 'powerbi-visuals-utils-dataviewutils/lib/dataRoleHelper';

const ColumnCategory: string = 'Category';
const ColumnX: string = 'X';
const ColumnY: string = 'Y';
const ColumnSize: string = 'Size';
const ColumnGradient: string = 'Gradient';
const ColumnPlayAxis: string = 'PlayAxis';
const ColumnShape: string = 'Shape';
const ColumnXStart: string = 'XStart';
const ColumnXEnd: string = 'XEnd';
const ColumnYStart: string = 'YStart';
const ColumnYEnd: string = 'YEnd';

export function getMetadata(
    categories: DataViewCategoryColumn[],
    grouped: DataViewValueColumnGroup[] | undefined): VisualMeasureMetadata {

    let xAxisLabel: string = '';
    let yAxisLabel: string = '';
    const xIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnX);
    const yIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnY);
    const sizeIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnSize);
    const categoryIndex: number = getCategoryIndexOfRole(categories, ColumnCategory);
    const shapeIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnShape);
    const xStartIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnXStart);
    const xEndIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnXEnd);
    const yStartIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnYStart);
    const yEndIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnYEnd);
    const gradientIndex: number = getMeasureIndexOfRole(<any>grouped, ColumnGradient);
    const playAxisIndex: number = getCategoryIndexOfRole(categories, ColumnPlayAxis);
    let xCol: DataViewMetadataColumn | undefined = undefined;
    let yCol: DataViewMetadataColumn | undefined = undefined;

    if (grouped && grouped.length) {
        const firstGroup: DataViewValueColumnGroup = grouped[0];

        if (xIndex >= 0) {
            xCol = firstGroup.values[xIndex].source;
            xAxisLabel = firstGroup.values[xIndex].source.displayName;
        }

        if (yIndex >= 0) {
            yCol = firstGroup.values[yIndex].source;
            yAxisLabel = firstGroup.values[yIndex].source.displayName;
        }
    }

    return {
        idx: {
            category: categoryIndex,
            x: xIndex,
            y: yIndex,
            size: sizeIndex,
            shape: shapeIndex,
            xStart: xStartIndex,
            xEnd: xEndIndex,
            yStart: yStartIndex,
            yEnd: yEndIndex,
            gradient: gradientIndex,
            playAxis: playAxisIndex,
        },
        cols: {
            x: xCol,
            y: yCol,
        },
        axesLabels: {
            x: xAxisLabel,
            y: yAxisLabel,
        },
    };
}
