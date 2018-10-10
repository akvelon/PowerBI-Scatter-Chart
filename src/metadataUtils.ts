module powerbi.extensibility.visual.metadataUtils {
    import getMeasureIndexOfRole = powerbi.extensibility.utils.dataview.DataRoleHelper.getMeasureIndexOfRole;
    import getCategoryIndexOfRole = powerbi.extensibility.utils.dataview.DataRoleHelper.getCategoryIndexOfRole;

    const ColumnCategory: string = "Category";
    const ColumnX: string = "X";
    const ColumnY: string = "Y";
    const ColumnSize: string = "Size";
    const ColumnGradient: string = "Gradient";
    const ColumnPlayAxis: string = "PlayAxis";
    const ColumnShape: string = "Shape";
    const ColumnXStart: string = "XStart";
    const ColumnXEnd: string = "XEnd";
    const ColumnYStart: string = "YStart";
    const ColumnYEnd: string = "YEnd";

    export function getMetadata(
        categories: DataViewCategoryColumn[],
        grouped: DataViewValueColumnGroup[],
        source: DataViewMetadataColumn): VisualMeasureMetadata {

        let xAxisLabel: string = "",
            yAxisLabel: string = "",
            xIndex: number = getMeasureIndexOfRole(grouped, ColumnX),
            yIndex: number = getMeasureIndexOfRole(grouped, ColumnY),
            sizeIndex: number = getMeasureIndexOfRole(grouped, ColumnSize),
            categoryIndex: number = getCategoryIndexOfRole(categories, ColumnCategory),
            shapeIndex: number = getMeasureIndexOfRole(grouped, ColumnShape),
            xStartIndex: number = getMeasureIndexOfRole(grouped, ColumnXStart),
            xEndIndex: number = getMeasureIndexOfRole(grouped, ColumnXEnd),
            yStartIndex: number = getMeasureIndexOfRole(grouped, ColumnYStart),
            yEndIndex: number = getMeasureIndexOfRole(grouped, ColumnYEnd),
            gradientIndex: number = getMeasureIndexOfRole(grouped, ColumnGradient),
            playAxisIndex: number = getCategoryIndexOfRole(categories, ColumnPlayAxis),
            xCol: DataViewMetadataColumn,
            yCol: DataViewMetadataColumn;


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
                playAxis: playAxisIndex
            },
            cols: {
                x: xCol,
                y: yCol
            },
            axesLabels: {
                x: xAxisLabel,
                y: yAxisLabel
            }
        };
    }
}