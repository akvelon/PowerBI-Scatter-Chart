import {ICategoryData} from './visualInterfaces';
import powerbi from 'powerbi-visuals-api';
import {dataRoleHelper} from 'powerbi-visuals-utils-dataviewutils';
import DataView = powerbi.DataView;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewObjects = powerbi.DataViewObjects;

export function findIndex<T>(array: T[], condition: (item: T) => boolean): number {
    for (let ix = 0; ix < array.length; ix++) {
        if (condition(array[ix])) {
            return ix;
        }
    }

    return -1;
}

export function getCategories(dataView: DataView): ICategoryData | undefined {
    if (
        !dataView.categorical ||
        !dataView.categorical.categories ||
        !dataView.categorical.categories.length ||
        !dataView.categorical.categories[0].values ||
        !dataView.categorical.values ||
        !dataView.categorical.values.length
    ) {
        return;
    }

    const data: ICategoryData = {
        title: '',
        categories: {},
    };

    // Find a metadata column for a legend
    const legendIndex = findIndex(dataView.metadata.columns, col => dataRoleHelper.hasRole(col, 'Legend'));

    // If column is present, parse information about categories
    if (legendIndex !== -1) {
        // Read a name of legend field
        data.title = dataView.metadata.columns[legendIndex].displayName;

        // Build an array of categories from column groups
        const groupedValues = dataView.categorical.values.grouped();
        groupedValues.forEach((group: DataViewValueColumnGroup) => {
            const column: DataViewCategoryColumn = {
                values: [],
                source: {
                    displayName: '',
                    queryName: dataView.metadata.columns[legendIndex].queryName,
                },
                objects: undefined,
            };

            data.categories[group.name as string] = {
                name: group.name as string,
                selectionColumn: column,
                columnGroup: group,
            };
        });
    }

    return data;
}

export function getDefinedNumberByCategoryId(column: DataViewValueColumn | null, index: number): number | null {
    return column
    && column.values
    && !(column.values[index] === null)
    && !isNaN(column.values[index] as number)
        ? Number(column.values[index])
        : null;
}

export function getValueFromDataViewValueColumnById(
    dataViewValueColumn: DataViewCategoryColumn | DataViewValueColumn | null,
    index: number): DataViewObjects | null {

    return dataViewValueColumn && dataViewValueColumn.objects
        ? dataViewValueColumn.objects[index]
        : null;
}
