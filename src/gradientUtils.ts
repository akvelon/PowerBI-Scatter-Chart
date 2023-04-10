import powerbi from 'powerbi-visuals-api';
import DataViewCategorical = powerbi.DataViewCategorical;
import {getMeasureIndexOfRole} from 'powerbi-visuals-utils-dataviewutils/lib/dataRoleHelper';

const GradientCategoryName: string = 'Gradient';

export function getGradientMeasureIndex(dataViewCategorical?: DataViewCategorical | null): number {
    if (dataViewCategorical
        && dataViewCategorical.values
        && dataViewCategorical.values.grouped) {

        return getMeasureIndexOfRole(
            dataViewCategorical.values.grouped(),
            GradientCategoryName);
    }

    return -1;
}


export function hasGradientRole(dataViewCategorical?: DataViewCategorical | null): boolean {
    return getGradientMeasureIndex(dataViewCategorical) >= 0;
}
