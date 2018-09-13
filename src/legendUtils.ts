module powerbi.extensibility.visual.legendUtils {
    import legend = powerbi.extensibility.utils.chart.legend;
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import legendDataModule = powerbi.extensibility.utils.chart.legend.data;
    import legendModule = powerbi.extensibility.utils.chart.legend;
    import legendProps = powerbi.extensibility.utils.chart.legend.legendProps;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

    export const MinAmountOfDataPointsInTheLegend: number = 1;
    export const LegendLabelFontSizeDefault: number = 9;
    export const DefaultFontFamily: string = "\"Segoe UI\", wf_segoe-ui_normal, helvetica, arial, sans-serif";
    export const DefaultLegendTitleText: string = "Type";
    export const DefaultLegendPosition: string = "Top";
    const topOffset: number = 45;
    const DefaultSelectionStateOfTheDataPoint: boolean = false;

    export function buildLegendData(
        dataValues: DataViewValueColumns,
        host: IVisualHost,
        legendObjectProperties: DataViewObject,
        dataValueSource: DataViewMetadataColumn,
        categories: DataViewCategoryColumn[],
        categoryIndex: number,
        hasDynamicSeries: boolean): legend.LegendData {

        const colorHelper: ColorHelper = new ColorHelper(
            host.colorPalette,
            PropertiesOfCapabilities["dataPoint"]["fill"]);

        const legendItems: legend.LegendDataPoint[] = [];
        const grouped: DataViewValueColumnGroup[] = dataValues.grouped();
        const formatString: string = valueFormatter.getFormatStringByColumn(dataValueSource);

        if (hasDynamicSeries) {
            for (let i: number = 0, len: number = grouped.length; i < len; i++) {
                let grouping: DataViewValueColumnGroup = grouped[i],
                    selectionId: ISelectionId,
                    color: string;

                color = colorHelper.getColorForSeriesValue(
                    grouping.objects,
                    grouping.name);

                selectionId = host.createSelectionIdBuilder()
                    .withSeries(dataValues, grouping)
                    .createSelectionId();

                legendItems.push({
                    color: color,
                    icon: legend.LegendIcon.Circle,
                    label: valueFormatter.format(grouping.name, formatString),
                    identity: selectionId,
                    selected: DefaultSelectionStateOfTheDataPoint
                });
            }
        }

        let legendTitle: string = dataValues && dataValueSource
            ? dataValueSource.displayName
            : <string>legendObjectProperties.titleText;
        if (legendObjectProperties.titleText === undefined ||
            legendObjectProperties.titleText.toString().length === 0) {
            legendObjectProperties.titleText = legendTitle;
        }


        if (!legendTitle) {
            legendTitle = categories
                && categories[categoryIndex]
                && categories[categoryIndex].source
                && categories[categoryIndex].source.displayName
                ? categories[categoryIndex].source.displayName
                : <string>legendObjectProperties.titleText;
        }

        return {
            title: legendTitle,
            dataPoints: legendItems
        };
    }

    export function renderLegend(
        visualLegend: ILegend,
        svg: d3.Selection<SVGElement>,
        viewport: IViewport,
        layerLegendData: LegendData,
        legendObjectProperties: DataViewObject,
        legendElement): void {

        const legendData: LegendData = {
            title: "",
            dataPoints: []
        };


        const legend: ILegend = visualLegend;

        const svgLegendElement = legendElement[0].parentNode;

        if (layerLegendData) {
            legendData.title = layerLegendData.title || "";

            legendData.dataPoints = legendData.dataPoints.concat(layerLegendData.dataPoints || []);

            legendData.fontSize = this.legendLabelFontSize
                ? this.legendLabelFontSize
                : LegendLabelFontSizeDefault;

            legendData.grouped = !!layerLegendData.grouped;
        }

        const legendProperties: DataViewObject = legendObjectProperties;

        if (legendProperties) {
            legendDataModule.update(legendData, legendProperties);

            const position: string = legendProperties[legendProps.position] as string;

            if (position) {
                legend.changeOrientation(LegendPosition[position]);
            }
        }
        else {
            legend.changeOrientation(LegendPosition.Top);
        }

        if (legendData.dataPoints.length === MinAmountOfDataPointsInTheLegend
            && !legendData.grouped) {
            // legendData.dataPoints = [];
        }

        legend.drawLegend(legendData, {
            height: viewport.height,
            width: viewport.width
        });

        legendModule.positionChartArea(svg, legend);

        const legendGroup = legendElement[0][0];
        /* Chromium 29.0.1504 doesn't support 'children' prop on SVG elements so we use 'childNodes' in this case.
            This Chromium version is used for generating PDF and images on the backend.
         */
        let legendItems: Array<any> = [].slice.call('children' in legendGroup ? legendGroup.children : legendGroup.childNodes);

        legendItems = legendItems.filter(item => (item.classList.value === "legendItem" || item.classList.value === "legendTitle"));

        if (legendItems && legendItems.length > 0) {
            let offset: number = 0;

            legendItems.forEach((item, i, arr) => {
                item.style.fontFamily = DefaultFontFamily;
                let oldWidth = item.getBoundingClientRect().width;
                item.style.fontFamily = <string>legendObjectProperties.fontFamily || DefaultFontFamily;
                let newWidth = item.getBoundingClientRect().width;

                let orientation = legend.getOrientation();

                if (orientation === LegendPosition.Right ||
                    orientation === LegendPosition.RightCenter ||
                    orientation === LegendPosition.Left ||
                    orientation === LegendPosition.LeftCenter) {
                    item.style.transform = `translateX(${0}px)`;
                    // TODO: add processing for left right position
                } else {
                    item.style.transform = `translateX(${offset}px)`;
                }
                offset += newWidth - oldWidth;
            });
        }
    }

    export function getLegendProperties(
        dataViewMetadata: DataViewMetadata,
        axisTitleOnByDefault?: boolean): DataViewObject {

        let dataViewObject: DataViewObject = {};

        if (!dataViewMetadata) {
            return dataViewObject;
        }

        const objects: DataViewObjects = dataViewMetadata.objects;

        if (objects) {
            const legendObject: DataViewObject = objects["legend"];

            if (legendObject) {
                dataViewObject = {
                    show: legendObject["show"],
                    position: legendObject["position"],
                    showTitle: legendObject["showTitle"] == null
                        ? axisTitleOnByDefault
                        : legendObject["showTitle"],
                    titleText: legendObject["titleText"],
                    labelColor: legendObject["labelColor"],
                    fontSize: legendObject["fontSize"],
                    fontFamily: legendObject["fontFamily"],
                };
            }
        }

        return dataViewObject;
    }

    export function setLegendProperties(
        legendProperties: DataViewObject,
        objects: DataViewObjects = {}) {

        legendProperties.show = DataViewObjects.getValue<boolean>(
            objects,
            PropertiesOfCapabilities["legend"]["show"],
            true);

        legendProperties.labelColor = DataViewObjects.getValue(
            objects,
            PropertiesOfCapabilities["legend"]["labelColor"],
            { solid: { color: Visual.DefaultColor } });

        legendProperties.fontSize = DataViewObjects.getValue<number>(
            objects,
            PropertiesOfCapabilities["legend"]["fontSize"],
            LegendLabelFontSizeDefault);

        legendProperties.fontFamily = DataViewObjects.getValue(
            objects,
            PropertiesOfCapabilities["legend"]["fontFamily"],
            DefaultFontFamily);

        legendProperties.showTitle = DataViewObjects.getValue<boolean>(
            objects,
            PropertiesOfCapabilities["legend"]["showTitle"],
            true);

        legendProperties.titleText = DataViewObjects.getValue<string>(
            objects,
            PropertiesOfCapabilities["legend"]["titleText"]);

        legendProperties.position = DataViewObjects.getValue(
            objects,
            PropertiesOfCapabilities["legend"]["position"],
            DefaultLegendPosition);
    }
}