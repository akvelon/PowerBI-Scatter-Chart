import powerbi from 'powerbi-visuals-api';
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import {valueFormatter} from 'powerbi-visuals-utils-formattingutils';
import {ITooltipServiceWrapper} from 'powerbi-visuals-utils-tooltiputils';
import {BaseType, Selection} from 'd3-selection';
import {VisualDataPoint} from './visualInterfaces';

export interface TooltipSeriesDataItem {
    value?: any;
    highlightedValue?: any;
    metadata: DataViewCategoryColumn | DataViewValueColumn;
}

export interface TooltipCategoryDataItem {
    value?: any;
    metadata: DataViewMetadataColumn[];
}

const DefaultDisplayName: string = '';
const DefaultDisplayNameDelimiter: string = '/';

export function createTooltipInfo(
    categoryValue: any,
    categories?: DataViewCategoryColumn[],
    seriesData?: TooltipSeriesDataItem[]): VisualTooltipDataItem[] {

    let categorySource: TooltipCategoryDataItem | undefined = undefined;
    const seriesSource: TooltipSeriesDataItem[] = [];

    if (categories && categories.length > 0) {
        if (categories.length > 1) {
            const compositeCategoriesData: DataViewMetadataColumn[] = [];

            for (let i: number = 0, length: number = categories.length; i < length; i++) {
                compositeCategoriesData.push(categories[i].source);
            }

            categorySource = {
                value: categoryValue,
                metadata: compositeCategoriesData,
            };
        } else {
            categorySource = {
                value: categoryValue,
                metadata: [categories[0].source],
            };

        }
    }

    if (seriesData) {
        for (let i: number = 0, len: number = seriesData.length; i < len; i++) {
            const singleSeriesData: TooltipSeriesDataItem = seriesData[i];

            if (categorySource
                && categorySource.metadata[0] === singleSeriesData.metadata.source) {

                continue;
            }

            seriesSource.push({
                value: singleSeriesData.value,
                metadata: singleSeriesData.metadata,
            });
        }
    }

    return createTooltipData(categorySource, seriesSource);
}

export function createTooltipData(
    categoryValue: TooltipCategoryDataItem | undefined,
    seriesValues: TooltipSeriesDataItem[]): VisualTooltipDataItem[] {

    const items: VisualTooltipDataItem[] = [];

    if (categoryValue) {
        if (categoryValue.metadata.length > 1) {
            let displayName: string = DefaultDisplayName;

            for (let i: number = 0, ilen: number = categoryValue.metadata.length; i < ilen; i++) {
                if (i !== 0) {
                    displayName += DefaultDisplayNameDelimiter;
                }

                displayName += categoryValue.metadata[i].displayName;
            }

            const categoryFormattedValue: string = getFormattedValue(
                categoryValue.metadata[0],
                categoryValue.value);

            items.push({
                displayName: displayName,
                value: categoryFormattedValue,
            });
        } else {
            const categoryFormattedValue: string = getFormattedValue(
                categoryValue.metadata[0],
                categoryValue.value);

            items.push({
                displayName: categoryValue.metadata[0].displayName,
                value: categoryFormattedValue,
            });
        }
    }

    for (let i = 0; i < seriesValues.length; i++) {
        const seriesData: TooltipSeriesDataItem = seriesValues[i];

        if (seriesData && seriesData.metadata) {
            const seriesMetadataColumn: DataViewMetadataColumn = seriesData.metadata.source,
                value: any = seriesData.value;

            if (value || value === 0) {
                const formattedValue: string = getFormattedValue(
                    seriesMetadataColumn,
                    value);

                items.push({
                    displayName: seriesMetadataColumn.displayName,
                    value: formattedValue,
                });
            }
        }
    }

    return items;
}

export function getFormattedValue(column: DataViewMetadataColumn, value: any): any {
    const formatString: string = valueFormatter.getFormatStringByColumn(<any>column);

    return valueFormatter.format(value, formatString);
}

export function bindTooltip(
    tooltipServiceWrapper: ITooltipServiceWrapper,
    selection: Selection<BaseType, VisualDataPoint, BaseType, unknown>): void {
    tooltipServiceWrapper.addTooltip<VisualDataPoint>(
        selection,
        (tooltipEvent) => tooltipEvent.tooltipInfo);
}
