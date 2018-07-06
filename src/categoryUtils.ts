module powerbi.extensibility.visual.categoryUtils {
    import DataRoleHelper = powerbi.extensibility.utils.dataview.DataRoleHelper;

    export function findIndex<T>(array: T[], condition: (item: T) => boolean): number {
        for (let ix = 0; ix < array.length; ix++) {
            if (condition(array[ix])) {
                return ix;
            }
        }

        return -1;
    }

    export function getCategories(dataView: DataView): ICategoryData {
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
            title: null,
            categories: {},
        };

        // Find a metadata column for a legend
        const legendIndex = findIndex(dataView.metadata.columns, col => DataRoleHelper.hasRole(col, "Legend"));

        // If column is present, parse information about categories
        if (legendIndex !== -1) {
            // Read a name of legend field
            data.title = dataView.metadata.columns[legendIndex].displayName;

            // Build an array of categories from column groups
            const groupedValues = dataView.categorical.values.grouped();
            groupedValues.forEach((group: DataViewValueColumnGroup, ix: number) => {
                const column: DataViewCategoryColumn = {
                    identity: [group.identity],
                    source: {
                        displayName: null,
                        queryName: dataView.metadata.columns[legendIndex].queryName,
                    },
                    values: null,
                };

                const category = {
                    name: group.name as string,
                    selectionColumn: column,
                    columnGroup: group,
                };

                data.categories[group.name as string] = category;
            });
        }

        return data;
    }

    export function getDefinedNumberByCategoryId(column: DataViewValueColumn, index: number): number {
        return column
            && column.values
            && !(column.values[index] === null)
            && !isNaN(column.values[index] as number)
            ? Number(column.values[index])
            : null;
    }

    export function getValueFromDataViewValueColumnById(
        dataViewValueColumn: DataViewCategoryColumn | DataViewValueColumn,
        index: number): any {

        return dataViewValueColumn && dataViewValueColumn.values
            ? dataViewValueColumn.values[index]
            : null;
    }
}