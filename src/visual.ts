import 'jquery-ui-dist/jquery-ui';
import 'd3-transition';

import powerbi from 'powerbi-visuals-api';
import {createClassAndSelector} from 'powerbi-visuals-utils-svgutils/lib/cssConstants';
import {BaseType, select as d3select, selectAll as d3selectAll, Selection} from 'd3-selection';
import {
    appendClearCatcher,
    IInteractivityService,
} from 'powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService';
import {VisualBehavior, VisualBehaviorOptions} from './visualBehavior';
import {
    createInteractivitySelectionService,
    SelectableDataPoint,
} from 'powerbi-visuals-utils-interactivityutils/lib/interactivitySelectionService';
import {
    AxesOptions,
    IAxes,
    IAxesSize,
    ICategoryData,
    IMargin, PlayAxisUpdateData, VisualAxesLabels,
    VisualData,
    VisualDataLabelsSettings,
    VisualDataPoint,
    VisualDataViewObject,
    VisualMeasureMetadata,
    VisualMeasureMetadataColumns,
} from './visualInterfaces';
import {createLegend} from 'powerbi-visuals-utils-chartutils/lib/legend/legend';
import {ILegend, LegendPosition} from 'powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces';
import {createTooltipServiceWrapper, ITooltipServiceWrapper} from 'powerbi-visuals-utils-tooltiputils';
import {PlayAxis} from './playAxisUtil';
import {hasGradientRole} from './gradientUtils';
import {createAxis, isLogScalePossible} from 'powerbi-visuals-utils-chartutils/lib/axis/axis';
import {axis, axisScale, axisStyle, dataLabelUtils} from 'powerbi-visuals-utils-chartutils';
import {YAxisPosition} from './yAxisPosition';
import {AxisType} from './axisType';
import {ColorHelper} from 'powerbi-visuals-utils-colorutils';
import {VisualSettings} from './settings';
import {getCategories, getDefinedNumberByCategoryId, getValueFromDataViewValueColumnById} from './categoryUtils';
import {getMetadata} from './metadataUtils';
import {
    getCategoryAxisProperties,
    getValueAxisProperties,
    getXConstantLineProperties,
    getYConstantLineProperties,
    setCategoryAxisProperties,
    setValueAxisProperties,
    setXConstantLineProperties,
    setYConstantLineProperties,
} from './axesPropertiesUtils';
import {
    getPointsTransparencyProperties,
    getSelectionColorSettings,
    getSelectionSaveSettings,
    getShapesSizeProperty,
    setPointsTransparencyProperty,
    setSelectionColorProperty,
    setSelectionSaveProperty,
} from './formatPaneUtils';
import {buildLegendData, getLegendProperties, renderLegend, setLegendProperties} from './legendUtils';
import {valueFormatter} from 'powerbi-visuals-utils-formattingutils';
import {IValueFormatter} from 'powerbi-visuals-utils-formattingutils/lib/src/valueFormatter';
import {dataViewObjects} from 'powerbi-visuals-utils-dataviewutils';
import {PropertiesOfCapabilities} from './properties';
import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {pixelConverter as PixelConverter} from 'powerbi-visuals-utils-typeutils';
import {
    getBubbleRadius,
    getLineStyleParam,
    getMeasureValue,
    getObjectPropertiesLength,
    getSizeRangeForGroups, getTitleWithUnitType,
    getUnitType,
} from './utils';
import {hasRoleInValueColumn} from 'powerbi-visuals-utils-dataviewutils/lib/dataRoleHelper';
import {bindTooltip, createTooltipInfo, TooltipSeriesDataItem} from './tooltipBuilder';
import {translate as svgTranslate} from 'powerbi-visuals-utils-svgutils/lib/manipulation';
import {max as d3max, min as d3min} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {IAxisProperties} from 'powerbi-visuals-utils-chartutils/lib/axis/axisInterfaces';
import {bindLabelLayout, setDatapointVisibleAngleRange} from './labelLayoutUtils';

import '../style/visual.less';
import {lassoSelectorInit, lassoSelectorUpdate, passSavedPointsToLassoUtil} from './selectionUtil';
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import IViewport = powerbi.IViewport;
import DataView = powerbi.DataView;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewObject = powerbi.DataViewObject;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualSelectionId = powerbi.visuals.ISelectionId;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualUpdateType = powerbi.VisualUpdateType;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewMetadata = powerbi.DataViewMetadata;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

class Selectors {
    static readonly MainSvg = createClassAndSelector('lasso-scatter-chart-svg');
    static readonly VisualSvg = createClassAndSelector('lasso-scatter-visual');
    static readonly ScatterGroup = createClassAndSelector('lasso-scatter-group');
    static readonly ScatterDot = createClassAndSelector('scatter-dot');
    static readonly XAxisLabelSelector = createClassAndSelector('xAxisLabel');
    static readonly YAxisLabelSelector = createClassAndSelector('yAxisLabel');
    static readonly AxisGraphicsContext = createClassAndSelector('axisGraphicsContext');
    static readonly ConstantLine = createClassAndSelector('constantLine');
    static readonly AxisConstantLinesGroup = createClassAndSelector('axisConstantLinesGroup');
    static readonly LabelGraphicsContext = createClassAndSelector('labelGraphicsContext');
    static readonly LabelBackgroundGraphicsContext = createClassAndSelector('labelBackgroundGraphicsContext');
    static readonly SelectionRectangle = createClassAndSelector('selection-rect');
    static readonly XAxisSvgGroup = createClassAndSelector('xAxisSvgGroup');
    static readonly YAxisSvgGroup = createClassAndSelector('yAxisSvgGroup');
}

export class Visual implements IVisual {
    public static readonly DefaultDataDomainMin = 0;
    public static readonly DefaultDataDomainMax = 100;
    public static readonly DefaultStrokeSelectionColor: string = '#000';
    public static readonly DefaultStrokeWidth: number = 1;
    public static readonly DefaultStrokeSelectionWidth: number = 2;
    public static readonly DefaultBubbleSize = 7;
    public static readonly DefaultPrecision = 0;
    public static readonly DefaultFontFamily: string = '"Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif';
    public static readonly DefaultTitleFontSize: number = 11;
    public static readonly DefaultColor: string = '#777777';
    public static readonly ResizeEndCode: number = 36; // it's wrong in VisualUpdateType enum for some reason

    private static readonly DefaultAxisXTickPadding: number = 10;
    private static readonly DefaultAxisYTickPadding: number = 10;
    private static readonly DefaultSelectionStateOfTheDataPoint: boolean = false;
    private static readonly DefaultAxisTitle: string = '';
    private static readonly DefaultLabelShowBackground: boolean = false;
    private static readonly DefaultLabelBackgroundColor: string = '#333';
    private static readonly DefaultGridlinesColor: string = '#eaeaea';
    private static readonly DefaultLineStyle: string = 'solid';
    private static readonly DefaultLabelBackgroundColorTransparency: number = 90;
    private static readonly DefaultConstantLineShow: boolean = false;
    private static readonly DefaultConstantLineValue: number = 0;
    private static readonly DefaultFillPoint: boolean = true;
    private static readonly DefaulShapesSize: number = 0;
    private static readonly AxisLabelOffset: number = 2;
    private static readonly YAxisLabelTransformRotate: string = 'rotate(-90)';
    private static readonly DefaultDY: string = '1em';
    private static readonly DefaultLegendLabelFontSize: number = 9;
    private static readonly DefaultLegendTitleText: string = '';
    private static readonly LabelDisplayUnitsDefault: number = 0;
    private static readonly minBubbleSize = 5;
    private static readonly maxBubbleSize = 10;
    private static readonly MinAmountOfValues: number = 0;
    private static readonly MinAmountOfCategories: number = 0;

    public static skipNextUpdate: boolean = false;

    public readonly playAxis: PlayAxis;

    private readonly mainElement: Selection<HTMLElement, undefined, null, undefined>;
    private readonly mainSvgElement: Selection<SVGSVGElement, undefined, null, undefined>;
    private readonly legendElement: Selection<SVGSVGElement, unknown, null, undefined>;
    private readonly visualSvgGroup: Selection<SVGGElement, unknown, null, undefined>;
    private readonly visualSvgGroupMarkers: Selection<SVGSVGElement, unknown, null, undefined>;
    private readonly labelGraphicsContext: Selection<SVGGElement, unknown, null, undefined>;
    private readonly xAxisSvgGroup: Selection<SVGGElement, unknown, null, undefined>;
    private readonly yAxisSvgGroup: Selection<SVGGElement, unknown, null, undefined>;
    private readonly axisConstantLinesGroup: Selection<SVGGElement, unknown, null, undefined>;
    private readonly clearCatcher: Selection<any, any, any, any>;
    private readonly axisGraphicsContext: Selection<SVGGElement, unknown, null, undefined>;
    private readonly interactivityService: IInteractivityService<SelectableDataPoint>;
    private readonly colorPalette: ISandboxExtendedColorPalette;
    private readonly legend: ILegend;
    private readonly host: IVisualHost;
    private readonly behavior: VisualBehavior;
    private readonly tooltipServiceWrapper: ITooltipServiceWrapper;

    private data: VisualData | null = null;
    private dataView: DataView | null = null;
    private settings: VisualSettings | null = null;
    private axisLabelsGroup: Selection<BaseType, string | null, SVGElement, unknown> | null = null;
    private scatterGroupSelect: Selection<SVGGElement, VisualDataPoint[], SVGSVGElement, unknown> | null = null;
    private scatterSelect: Selection<SVGCircleElement, VisualDataPoint, BaseType, unknown> | null = null;
    private legendProperties: DataViewObject | null = null;
    private categoryAxisProperties: DataViewObject | null = null;
    private valueAxisProperties: DataViewObject | null = null;
    private shapesSize: DataViewObject | null = null;
    private selectionColorSettings: DataViewObject | null = null;
    private pointsTransparencyProperties: DataViewObject | null = null;
    private xAxisConstantLineProperties: DataViewObject | null = null;
    private yAxisConstantLineProperties: DataViewObject | null = null;
    private selectionSaveSettings: VisualDataViewObject | null = null;
    private yAxisIsCategorical: boolean | null = null;
    private fillPoint: boolean | null = null;
    private isSelectionRestored: boolean = false;

    constructor(options: VisualConstructorOptions) {
        // Create d3 selection from main HTML element
        this.mainElement = d3select(options.element);

        // Append SVG element to it. This SVG will contain our visual
        this.mainSvgElement = this.mainElement
            .append('svg')
            .classed(Selectors.MainSvg.className, true);

        // Append SVG groups for X and Y axes.
        this.xAxisSvgGroup = this.mainSvgElement
            .append('g')
            .classed(Selectors.XAxisSvgGroup.className, true);
        this.yAxisSvgGroup = this.mainSvgElement
            .append('g')
            .classed(Selectors.YAxisSvgGroup.className, true);

        this.clearCatcher = appendClearCatcher(this.mainSvgElement);

        // Append an svg group that will contain our visual
        this.visualSvgGroup = this.mainSvgElement
            .append('g')
            .classed(Selectors.VisualSvg.className, true);

        this.axisGraphicsContext = this.mainSvgElement
            .append('g')
            .classed(Selectors.AxisGraphicsContext.className, true);

        this.visualSvgGroupMarkers = this.visualSvgGroup
            .append('svg');

        this.labelGraphicsContext = this.visualSvgGroupMarkers
            .append('g')
            .classed(Selectors.LabelGraphicsContext.className, true);

        this.axisConstantLinesGroup = this.visualSvgGroup
            .append('g')
            .classed(Selectors.AxisConstantLinesGroup.className, true);

        this.behavior = new VisualBehavior(this);

        this.host = options.host;

        this.interactivityService = createInteractivitySelectionService(this.host);

        this.legend = createLegend(
            options.element,
            false,
            this.interactivityService,
            true,
            LegendPosition.Top);

        this.legendElement = this.mainElement.select<SVGSVGElement>('svg.legend');

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.host.tooltipService,
            options.element,
        );

        this.colorPalette = options.host.colorPalette;

        lassoSelectorInit(this.mainElement, this.behavior);

        this.playAxis = new PlayAxis(options.element, this.mainSvgElement, this.tooltipServiceWrapper);
    }

    // eslint-disable-next-line max-lines-per-function
    public update(options: VisualUpdateOptions) {
        if (Visual.skipNextUpdate) {
            Visual.skipNextUpdate = false;
            return;
        }

        const dataView = options && options.dataViews && options.dataViews[0];

        if (!dataView) {
            this.clearVisual(this.data?.size ?? options.viewport);
            return;
        }

        this.dataView = dataView;

        // Parse settings
        this.settings = VisualSettings.parse<VisualSettings>(dataView);

        // Get categories for legend
        const categoryData = getCategories(dataView);

        // Get metadata
        const grouped = dataView.categorical?.values?.grouped();

        const categories = dataView.categorical?.categories || [];
        const metadata = getMetadata(categories, grouped);
        const dataViewCategorical = dataView.categorical;
        const dataViewMetadata = dataView.metadata;
        const dataValues = dataViewCategorical?.values;
        if (!dataValues) {
            // Should not happen.
            return;
        }

        const dataValueSource = dataValues.source;
        const hasDynamicSeries = !!dataValueSource;

        // if no 'Details' field we use 'Play Axis' as the category
        const categoryIndex = typeof metadata.idx.category !== 'undefined' && metadata.idx.category > -1 ? metadata.idx.category : metadata.idx.playAxis ?? 0;

        let categoryValues: PrimitiveValue[] | [null];
        let defaultDataPointColor: string = '';
        let showAllDataPoints: boolean = true;
        let categoryFormatter: IValueFormatter;

        this.categoryAxisProperties = getCategoryAxisProperties(dataViewMetadata, true);
        this.valueAxisProperties = getValueAxisProperties(dataViewMetadata, true);
        this.xAxisConstantLineProperties = getXConstantLineProperties(dataViewMetadata);
        this.yAxisConstantLineProperties = getYConstantLineProperties(dataViewMetadata);
        this.fillPoint = Visual.DefaultFillPoint;
        this.shapesSize = getShapesSizeProperty(dataViewMetadata);
        this.legendProperties = getLegendProperties(dataViewMetadata, true);
        this.pointsTransparencyProperties = getPointsTransparencyProperties(dataViewMetadata);
        this.selectionSaveSettings = getSelectionSaveSettings(dataViewMetadata);
        this.selectionColorSettings = getSelectionColorSettings(dataViewMetadata);

        const categoryAxisProperties = this.categoryAxisProperties;
        const valueAxisProperties = this.valueAxisProperties;
        const xAxisConstantLineProperties = this.xAxisConstantLineProperties;
        const yAxisConstantLineProperties = this.yAxisConstantLineProperties;

        // play axis - it affects the visual only if Play Axis bucket is filled
        if (dataViewCategorical.categories && metadata.idx.playAxis !== undefined && dataViewCategorical.categories[metadata.idx.playAxis]) {
            this.playAxis.enable();
        } else {
            this.playAxis.disable();
        }

        if (dataViewCategorical &&
            dataViewCategorical.categories
            && dataViewCategorical.categories.length > 0
            && dataViewCategorical.categories[categoryIndex]) {

            const mainCategory = dataViewCategorical.categories[categoryIndex];

            categoryValues = mainCategory.values;

            categoryFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(<any>mainCategory.source),
                value: categoryValues[0],
                value2: categoryValues[categoryValues.length - 1],
            });
        } else {
            categoryValues = [null];

            // creating default formatter for null value (to get the right string of empty value from the locale)
            categoryFormatter = valueFormatter.createDefaultFormatter(<any>null);
        }

        const dataLabelsSettings = dataLabelUtils.getDefaultPointLabelSettings() as VisualDataLabelsSettings;

        // set initial value to category and value axes
        setCategoryAxisProperties(categoryAxisProperties, dataViewMetadata.objects);
        setValueAxisProperties(valueAxisProperties, dataViewMetadata.objects);
        setPointsTransparencyProperty(this.pointsTransparencyProperties, dataViewMetadata.objects);
        setSelectionSaveProperty(this.selectionSaveSettings, dataViewMetadata.objects);
        setSelectionColorProperty(this.selectionColorSettings, dataViewMetadata.objects);

        if (dataViewMetadata && dataViewMetadata.objects) {
            const objects = dataViewMetadata.objects;

            defaultDataPointColor = dataViewObjects.getFillColor(
                objects,
                PropertiesOfCapabilities['dataPoint']['defaultColor']);

            showAllDataPoints = dataViewObjects.getValue<boolean>(
                objects,
                PropertiesOfCapabilities['dataPoint']['showAllDataPoints']);

            const labelsObj: DataViewObject = objects['categoryLabels'];

            if (labelsObj) {
                dataLabelsSettings.show = (labelsObj['show'] !== undefined)
                    ? labelsObj['show'] as boolean
                    : dataLabelsSettings.show;

                dataLabelsSettings.fontSize = (labelsObj['fontSize'] !== undefined)
                    ? labelsObj['fontSize'] as number
                    : dataLabelsSettings.fontSize;

                dataLabelsSettings.fontFamily = (labelsObj['fontFamily'] !== undefined)
                    ? labelsObj['fontFamily'] as string
                    : dataLabelsSettings.fontFamily;

                if (labelsObj['color'] !== undefined) {
                    dataLabelsSettings.labelColor = dataViewObjects.getFillColor(
                        objects,
                        PropertiesOfCapabilities['categoryLabels']['color']);
                }

                if (labelsObj['showBackground'] !== undefined) {
                    dataLabelsSettings.showBackground = dataViewObjects.getValue<boolean>(
                        objects,
                        PropertiesOfCapabilities['categoryLabels']['showBackground']);
                }

                if (labelsObj['backgroundColor'] !== undefined) {
                    dataLabelsSettings.backgroundColor = dataViewObjects.getFillColor(
                        objects,
                        PropertiesOfCapabilities['categoryLabels']['backgroundColor']);
                } else {
                    dataLabelsSettings.backgroundColor = Visual.DefaultLabelBackgroundColor;
                }

                dataLabelsSettings.transparency = (labelsObj['transparency'] !== undefined)
                    ? labelsObj['transparency'] as number
                    : Visual.DefaultLabelBackgroundColorTransparency;
            }

            setXConstantLineProperties(xAxisConstantLineProperties, dataViewMetadata.objects);
            setYConstantLineProperties(yAxisConstantLineProperties, dataViewMetadata.objects);

            this.fillPoint = dataViewObjects.getValue<boolean>(
                objects,
                PropertiesOfCapabilities['fillPoint']['show'],
                Visual.DefaultFillPoint);

            this.shapesSize.size = dataViewObjects.getValue(
                objects,
                PropertiesOfCapabilities['shapes']['size'],
                Visual.DefaulShapesSize);

            setLegendProperties(this.legendProperties, dataViewMetadata.objects);
        }

        const viewport: IViewport = {
            height: options.viewport.height - this.legend.getMargins().height,
            width: options.viewport.width - this.legend.getMargins().width,
        };

        // viewport size is calculated wrong sometimes, which causing Play Axis bugs.
        // We make it safe using max value between viewport and mainElement for height and width.
        const mainElementHeight: number = (this.mainElement.node() as HTMLElement).clientHeight;
        const mainElementWidth: number = (this.mainElement.node() as HTMLElement).clientWidth;
        this.mainSvgElement
            .attr('width', Math.max(mainElementWidth, viewport.width))
            .attr('height', Math.max(mainElementHeight, viewport.height));

        // Set up margins for our visual
        const visualMargin: IMargin = {top: 8, bottom: 10, left: 10, right: 10};

        // Set up sizes for axes
        const axesSize: IAxesSize = {xAxisHeight: 15, yAxisWidth: 10};

        // Build legend
        const legendData = buildLegendData(dataValues, this.host, this.legendProperties, dataValueSource, categories, categoryIndex, hasDynamicSeries);
        renderLegend(this.legend, this.mainSvgElement, options.viewport, legendData, this.legendProperties, this.legendElement);

        // Calculate the resulting size of visual
        const visualSize: ISize = {
            width: options.viewport.width
                - visualMargin.left
                - visualMargin.right
                - axesSize.yAxisWidth
                - this.legend.getMargins().width,
            height: options.viewport.height
                - visualMargin.top
                - visualMargin.bottom
                - axesSize.xAxisHeight
                - this.legend.getMargins().height
                - this.playAxis.getHeight(),
        };

        const playAxisCategory = categories && typeof metadata.idx.playAxis === 'number'
            ? categories[metadata.idx.playAxis]
            : null;

        // Parse data from update options
        let dataPoints: VisualDataPoint[];
        if (options.type === VisualUpdateType.Resize || options.type === Visual.ResizeEndCode) {
            dataPoints = this.data?.dataPoints ?? [];
        } else {
            dataPoints = this.transform(
                this.host,
                visualSize,
                dataView,
                grouped ?? [],
                categories,
                categoryValues,
                playAxisCategory,
                dataViewCategorical,
                dataViewMetadata,
                dataValues,
                categoryData,
                metadata,
                defaultDataPointColor,
                hasDynamicSeries,
                categoryFormatter,
                dataValueSource,
                dataLabelsSettings);
        }

        // Set width and height of visual to SVG group
        this.visualSvgGroupMarkers
            .attr('width', visualSize.width)
            .attr('height', visualSize.height);

        // Move SVG group elements to appropriate positions.
        this.visualSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth,
                visualMargin.top));

        this.xAxisSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth,
                visualMargin.top + visualSize.height));
        this.yAxisSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth,
                visualMargin.top));

        // Create linear scale for bubble size
        const sizeScale = this.getBubbleSizeScale(dataPoints);

        const sizeRange = getSizeRangeForGroups(
            grouped,
            metadata.idx.size);

        if (categoryAxisProperties
            && categoryAxisProperties['showAxisTitle'] !== null
            && categoryAxisProperties['showAxisTitle'] === false) {
            metadata.axesLabels.x = null;
        }
        if (valueAxisProperties
            && valueAxisProperties['showAxisTitle'] !== null
            && valueAxisProperties['showAxisTitle'] === false) {
            metadata.axesLabels.y = null;
        }

        if (dataPoints && dataPoints[0]) {
            const dataPoint: VisualDataPoint = dataPoints[0];

            if (dataPoint.xStart != null) {
                categoryAxisProperties['start'] = dataPoint.xStart;
            }

            if (dataPoint.xEnd != null) {
                categoryAxisProperties['end'] = dataPoint.xEnd;
            }

            if (dataPoint.yStart != null) {
                valueAxisProperties['start'] = dataPoint.yStart;
            }

            if (dataPoint.yEnd != null) {
                valueAxisProperties['end'] = dataPoint.yEnd;
            }
        }

        const axesOptions: AxesOptions = {
            categoryAxisProperties,
            valueAxisProperties,
            xAxisConstantLine: xAxisConstantLineProperties,
            yAxisConstantLine: yAxisConstantLineProperties,
        };

        const axes = this.createD3Axes(visualSize, dataPoints, metadata.cols, axesOptions);

        this.yAxisIsCategorical = axes.y.isCategoryAxis;

        this.addUnitTypeToAxisLabel(axes.x, axes.y);
        dataPoints = setDatapointVisibleAngleRange(dataPoints, axes, visualSize, sizeScale, <any>this.shapesSize);

        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(dataPoints);
        }

        // Change rectangular selection color
        d3selectAll(Selectors.SelectionRectangle.selectorName)
            .style('background-color', <string>this.selectionColorSettings.fillColor);

        // Render visual
        const data: VisualData = {
            axes,
            sizeRange,
            dataPoints: dataPoints,
            size: visualSize,
            defaultColor: this.settings.dataPoint.defaultColor,
            sizeScale,
            legendData: legendData,
            defaultDataPointColor,
            showAllDataPoints,
            hasDynamicSeries,
            xCol: metadata.cols.x,
            yCol: metadata.cols.y,
            dataLabelsSettings,
        };

        this.data = data;
        this.renderAxes(data);

        const ytickText = this.yAxisSvgGroup.selectAll('text').nodes();
        const xtickText = this.xAxisSvgGroup.selectAll('text').nodes();

        const yTickWidth: Array<number> = [];
        const xTickHeight: Array<number> = [];

        ytickText.forEach((item: any) => {
            const dimension = item.getBoundingClientRect();
            yTickWidth.push(dimension.width);
        });

        xtickText.forEach((item: any) => {
            const dimension = item.getBoundingClientRect();
            xTickHeight.push(dimension.height);
        });

        if (yTickWidth.length === 0) {
            yTickWidth.push(0);
        }

        if (xTickHeight.length === 0) {
            xTickHeight.push(0);
        }

        const yTickOffset = (d3max(yTickWidth) ?? 0) + (valueAxisProperties.showAxisTitle ? parseInt(valueAxisProperties.titleFontSize.toString()) : 0);
        const xTickOffset = (d3max(xTickHeight) ?? 0) + (categoryAxisProperties.showAxisTitle ? parseInt(categoryAxisProperties.titleFontSize.toString()) : 0);

        // Calculate the resulting size of visual
        visualSize.width = visualSize.width - yTickOffset;
        visualSize.height = visualSize.height - xTickOffset;

        const axesUpdated = this.createD3Axes(visualSize, dataPoints, metadata.cols, axesOptions);
        this.data.size = visualSize;
        this.data.axes = axesUpdated;

        const legendXOffset = this.legend.getOrientation() === LegendPosition.Right
        || this.legend.getOrientation() === LegendPosition.RightCenter
            ? 0
            : this.legend.getMargins().width;
        const legendYOffset = this.legend.getOrientation() === LegendPosition.Bottom
        || this.legend.getOrientation() === LegendPosition.BottomCenter
            ? 0
            : this.legend.getMargins().height;

        this.data.axesDimensions = {
            x: visualMargin.left + axesSize.yAxisWidth + yTickOffset + legendXOffset,
            y: visualMargin.top + legendYOffset,
            width: visualSize.width,
            height: visualSize.height,
        };

        // Set width and height of visual to SVG group
        this.visualSvgGroupMarkers
            .attr('width', visualSize.width)
            .attr('height', visualSize.height);

        // Move SVG group elements to appropriate positions.
        this.visualSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth + yTickOffset,
                visualMargin.top));

        this.xAxisSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth + yTickOffset,
                visualMargin.top + visualSize.height));
        this.yAxisSvgGroup.attr(
            'transform',
            svgTranslate(
                visualMargin.left + axesSize.yAxisWidth + yTickOffset,
                visualMargin.top));

        this.renderAxes(this.data);
        this.renderVisual(this.data);
        this.renderAxesLabels(
            metadata.axesLabels,
            this.legend.getMargins().height + xTickOffset,
            options.viewport,
            visualMargin);
        this.renderAxesConstantLines(this.data);

        // Play Axis
        if (this.playAxis.isEnabled()) {
            const playAxisUpdateData: PlayAxisUpdateData = {
                metadata,
                viewport: options.viewport,
                visualSize,
                visualMargin,
                axesSize,
                legendSize: this.legend.getMargins(),
                legendPosition: this.legend.getOrientation(),
                xTickOffset,
                yTickOffset,
                dataPoints,
                metadataColumn: playAxisCategory?.source,
                scatterGroupSelect: this.scatterGroupSelect,
                scatterSelect: this.scatterSelect,
                updateType: options.type,
                axes: this.data.axes,
            };
            this.playAxis.update(playAxisUpdateData);
        }
    }

    // eslint-disable-next-line max-lines-per-function
    private transform(
        visualHost: IVisualHost,
        visualSize: ISize,
        dataView: DataView,
        grouped: DataViewValueColumnGroup[],
        categories: DataViewCategoryColumn[],
        categoriesValues: PrimitiveValue[] | [null],
        playAxisCategory: DataViewCategoryColumn | null,
        dataViewCategorical: DataViewCategorical,
        dataViewMetadata: DataViewMetadata,
        dataValues: DataViewValueColumns,
        categoryData: ICategoryData | undefined,
        metadata: VisualMeasureMetadata,
        defaultDataPointColor: string,
        hasDynamicSeries: boolean,
        categoryFormatter: IValueFormatter,
        dataValueSource: DataViewMetadataColumn | undefined,
        labelSettings: VisualDataLabelsSettings): VisualDataPoint[] {
        // From each values object, we take a value related to current category,
        // and push it to the values array of our object.
        if (!dataView) {
            return [];
        }

        const indicies = metadata.idx;

        const dataPoints: VisualDataPoint[] = [];
        const colorHelper = new ColorHelper(
            this.colorPalette,
            PropertiesOfCapabilities.dataPoint.fill,
            hasDynamicSeries ? '' : defaultDataPointColor,
        );
        const fontSizeInPx = PixelConverter.toString(<number>labelSettings.fontSize);
        const labelFontFamily = labelSettings.fontFamily;

        for (let categoryIdx: number = 0, ilen: number = categoriesValues.length; categoryIdx < ilen; categoryIdx++) {
            const categoryValue: any = categoriesValues[categoryIdx];

            for (let seriesIdx: number = 0, len: number = grouped.length; seriesIdx < len; seriesIdx++) {
                const grouping: DataViewValueColumnGroup = grouped[seriesIdx];
                const seriesValues = grouping.values;
                const measureX = getMeasureValue(
                    indicies.x,
                    seriesValues);
                const measureY = getMeasureValue(
                    indicies.y,
                    seriesValues);
                const measureSize = getMeasureValue(
                    indicies.size,
                    seriesValues);
                const measureShape = getMeasureValue(
                    indicies.shape,
                    seriesValues);
                const measureXStart = getMeasureValue(
                    indicies.xStart,
                    seriesValues);
                const measureXEnd = getMeasureValue(
                    indicies.xEnd,
                    seriesValues);
                const measureYStart = getMeasureValue(
                    indicies.yStart,
                    seriesValues);
                const measureYEnd = getMeasureValue(
                    indicies.yEnd,
                    seriesValues);
                const measureGradient = getMeasureValue(
                    indicies.gradient,
                    seriesValues);

                const xVal = getDefinedNumberByCategoryId(
                    measureX,
                    categoryIdx);

                const yVal = getDefinedNumberByCategoryId(
                    measureY,
                    categoryIdx);

                let sizeVal = getValueFromDataViewValueColumnById(measureSize, categoryIdx);
                sizeVal = sizeVal !== null && typeof sizeVal === 'number' ? sizeVal : null;
                if (xVal == null && yVal == null && sizeVal == null) {
                    continue;
                }

                const category = categories && categories.length > Visual.MinAmountOfCategories && typeof indicies.category === 'number'
                    ? categories[indicies.category]
                    : null;

                const identity = visualHost.createSelectionIdBuilder()
                    .withCategory(<any>category, categoryIdx)
                    .withSeries(dataValues, grouping)
                    .createSelectionId();

                const xStart = getValueFromDataViewValueColumnById(measureXStart, categoryIdx);
                const xEnd = getValueFromDataViewValueColumnById(measureXEnd, categoryIdx);
                const yStart = getValueFromDataViewValueColumnById(measureYStart, categoryIdx);
                const yEnd = getValueFromDataViewValueColumnById(measureYEnd, categoryIdx);
                const gradient = getValueFromDataViewValueColumnById(measureGradient, categoryIdx);

                let color: string;
                if (hasDynamicSeries) {
                    color = colorHelper.getColorForSeriesValue(<any>grouping.objects, <any>grouping.name);
                } else {
                    // If we have no Size measure then use a blank query name
                    const measureSource = measureSize?.source.queryName ?? '';

                    color = colorHelper.getColorForMeasure(
                        <any>category?.objects?.[categoryIdx],
                        measureSource);
                }

                const seriesData: TooltipSeriesDataItem[] = [];

                if (dataValueSource) {
                    // Dynamic series
                    seriesData.push({
                        value: grouping.name,
                        metadata: {
                            source: dataValueSource,
                            values: [],
                        },
                    });
                }

                if (measureX) {
                    seriesData.push({
                        value: xVal,
                        metadata: measureX,
                    });
                }

                if (measureY) {
                    seriesData.push({
                        value: yVal,
                        metadata: measureY,
                    });
                }

                if (measureGradient) {
                    seriesData.push({
                        value: gradient,
                        metadata: measureGradient,
                    });
                }

                if (measureSize
                    && measureSize.values
                    && measureSize.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureSize.values[categoryIdx],
                        metadata: measureSize,
                    });
                }

                if (measureShape
                    && measureShape.values
                    && measureShape.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureShape.values[categoryIdx],
                        metadata: measureShape,
                    });
                }

                if (measureXStart
                    && measureXStart.values
                    && measureXStart.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureXStart.values[categoryIdx],
                        metadata: measureXStart,
                    });
                }

                if (measureXEnd
                    && measureXEnd.values
                    && measureXEnd.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureXEnd.values[categoryIdx],
                        metadata: measureXEnd,
                    });
                }

                if (measureYStart
                    && measureYStart.values
                    && measureYStart.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureYStart.values[categoryIdx],
                        metadata: measureYStart,
                    });
                }

                if (measureYEnd
                    && measureYEnd.values
                    && measureYEnd.values.length > Visual.MinAmountOfValues) {

                    seriesData.push({
                        value: measureYEnd.values[categoryIdx],
                        metadata: measureYEnd,
                    });
                }

                const additionalTooltipValues = seriesValues.filter(obj => (
                    hasRoleInValueColumn(obj, 'Tooltips')
                    && (
                        getObjectPropertiesLength(obj.source.roles) === 1
                        || (hasRoleInValueColumn(obj, 'Values')
                            && getObjectPropertiesLength(obj.source.roles) === 2)
                    )
                ));

                const playAxisValue = playAxisCategory && playAxisCategory.values[categoryIdx];

                if (playAxisCategory) {
                    seriesData.push({
                        value: playAxisCategory.source.type?.dateTime
                            ? new Date(playAxisCategory.values[categoryIdx].toString()).toLocaleDateString('en-US')
                            : playAxisCategory.values[categoryIdx],
                        metadata: playAxisCategory,
                    });
                }

                // add additional fields to tooltip from field buckets
                if (additionalTooltipValues && additionalTooltipValues.length > 0) {
                    additionalTooltipValues.map((tooltipValue) => {
                        const value = getValueFromDataViewValueColumnById(tooltipValue, categoryIdx);
                        seriesData.push({
                            value,
                            metadata: tooltipValue,
                        });
                    });
                }

                const tooltipInfo: VisualTooltipDataItem[] = createTooltipInfo(
                    categoryValue,
                    category ? [category] : undefined,
                    seriesData);

                dataPoints.push({
                    x: xVal,
                    y: yVal,
                    size: <any>sizeVal,
                    radius: {
                        sizeMeasure: measureSize,
                        index: categoryIdx,
                        value: <any>sizeVal,
                    },
                    xStart: <any>xStart,
                    xEnd: <any>xEnd,
                    yStart: <any>yStart,
                    yEnd: <any>yEnd,
                    tooltipInfo,
                    columnGroup: grouping,
                    fill: color,
                    identity,
                    formattedCategory: Visual.createLazyFormattedCategory(categoryFormatter, categoryValue),
                    selected: Visual.DefaultSelectionStateOfTheDataPoint,
                    labelFill: (<any>labelSettings).labelColor,
                    labelFontSize: fontSizeInPx,
                    labelFontFamily: <any>labelFontFamily,
                    angleRange: [0, 0],
                    labelAnglePosition: 0,
                    equalDataPointLabelsCount: {
                        i: 0,
                        count: 1,
                    },
                    playAxisValue: playAxisValue ?? undefined,
                });
            }
        }

        return dataPoints;
    }

    public static createLazyFormattedCategory(formatter: IValueFormatter, value: string): () => string {
        return () => formatter.format(value);
    }

    // eslint-disable-next-line max-lines-per-function
    private renderVisual(data: VisualData) {
        // const colorHelper = new ColorHelper(this.host.colorPalette);
        const dataPoints: VisualDataPoint[] = data.dataPoints.filter(d =>
            !((data.xCol != null && d.x == null) || (data.yCol != null && d.y == null)),
        );

        // Add an svg group containing the dots.
        const groups = this.visualSvgGroupMarkers
            .selectAll<SVGGElement, unknown>(Selectors.ScatterGroup.selectorName)
            .data([dataPoints]);

        const groupsEnter = groups.enter()
            .append('g')
            .classed(Selectors.ScatterGroup.className, true);

        this.scatterGroupSelect = groups.merge(groupsEnter);

        groups.exit().remove();

        // Add dots to the group.
        const groupDots = groups.merge(groupsEnter)
            .selectAll<SVGCircleElement, unknown>(Selectors.ScatterDot.selectorName)
            .data(d => d);

        const groupDotsEnter = groupDots.enter()
            .append('circle')
            .classed(Selectors.ScatterDot.className, true);

        this.scatterSelect = groupDots.merge(groupDotsEnter);

        groupDots.exit().remove();

        groupDots.merge(groupDotsEnter)
            .attr('cx', d => this.getBubblePositionX(data.axes.x.scale, d.x))
            .attr('cy', d => this.getBubblePositionY(data.axes.y.scale, d.y))
            .attr('r', d => getBubbleRadius(d.radius.value, data.size, data.sizeScale, <number>this.shapesSize?.size))
            .style('fill-opacity', d => this.fillPoint ? this.getFillOpacity(d) : 0)
            .style('fill', d => d.fill ?? null)
            .style('stroke-opacity', d => {
                if (this.fillPoint) {
                    if (d.selected) {
                        return 1;
                    } else {
                        return 0;
                    }
                } else {
                    return this.getFillOpacity(d);
                }
            })
            .style('stroke', d => {
                if (this.fillPoint && d.selected) {
                    return Visual.DefaultStrokeSelectionColor;
                }

                return d.fill ?? null;
            })
            .style('stroke-width', d => {
                if (d.selected) {
                    return Visual.DefaultStrokeSelectionWidth;
                }

                return Visual.DefaultStrokeWidth;
            })
            .each(function (d, i) {
                d.index = i;
            });

        bindLabelLayout(
            data.dataLabelsSettings,
            data,
            this.labelGraphicsContext,
            <number>this.shapesSize?.size);

        bindTooltip(this.tooltipServiceWrapper, this.scatterSelect);

        this.bindInteractivityService(this.scatterSelect, dataPoints);

        // restore saved selection
        if (!this.isSelectionRestored) {
            const newDataPoints = data.dataPoints.filter(d => {
                return this.selectionSaveSettings?.selection.some(item => {
                    return (<any>item).identity.key === (<any>d).identity.key;
                });
            });

            this.behavior.selectionHandler?.handleSelection(newDataPoints, false);
            passSavedPointsToLassoUtil(data.dataPoints);
            this.isSelectionRestored = true;
        }
    }

    private bindInteractivityService(
        dataPointsSelection: Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>,
        dataPoints: VisualDataPoint[]): void {
        if (!this.behavior || !this.interactivityService) {
            return;
        }

        const behaviorOptions: VisualBehaviorOptions = {
            lassoSelectorUpdate,
            clearCatcher: this.clearCatcher,
            selection: dataPointsSelection,
            legendItems: this.legendElement.selectAll('.legendItem'),
            getFillOpacity: this.getFillOpacity.bind(this),
            pointsTransparencyProperties: this.pointsTransparencyProperties,
            host: this.host,
            data: this.data,
            fillPoint: this.fillPoint,
            selectionSaveSettings: this.selectionSaveSettings?.selection ?? null,
            dataPoints,
            behavior: this.behavior,
        };

        this.interactivityService.bind(behaviorOptions);
    }

    private getFillOpacity(dataPoint: VisualDataPoint): number {
        const pointsTransparencyProperties = this.pointsTransparencyProperties;
        if (dataPoint.selected) {
            return (1 - <number>pointsTransparencyProperties?.selected / 100);
        } else if (this.interactivityService.hasSelection()) {
            return 1 - <number>pointsTransparencyProperties?.unselected / 100;
        }

        return 1 - <number>pointsTransparencyProperties?.regular / 100;
    }

    private addUnitTypeToAxisLabel(xAxis: IAxisProperties, yAxis: IAxisProperties): void {
        let unitType = getUnitType(xAxis);

        if (xAxis.axisLabel && unitType) {
            if (xAxis.isCategoryAxis) {
                xAxis.axisLabel = axis.createAxisLabel(
                    <any>this.categoryAxisProperties,
                    xAxis.axisLabel,
                    unitType);
            } else {
                xAxis.axisLabel = axis.createAxisLabel(
                    <any>this.valueAxisProperties,
                    xAxis.axisLabel,
                    unitType);
            }
        }

        unitType = getUnitType(yAxis);

        if (yAxis.axisLabel && unitType) {
            if (!yAxis.isCategoryAxis) {
                yAxis.axisLabel = axis.createAxisLabel(
                    <any>this.valueAxisProperties,
                    yAxis.axisLabel,
                    unitType);
            } else {
                yAxis.axisLabel = axis.createAxisLabel(
                    <any>this.categoryAxisProperties,
                    yAxis.axisLabel,
                    unitType);
            }
        }
    }

    // eslint-disable-next-line max-lines-per-function
    private renderAxes(data: VisualData) {
        // Now we call the axis funciton, that will render an axis on our visual.
        if (this.categoryAxisProperties?.['show'] !== undefined && !this.categoryAxisProperties['show']) {
            this.xAxisSvgGroup.selectAll('*').remove();
        } else {
            this.xAxisSvgGroup.call(data.axes.x.axis);

            const axisText = this.xAxisSvgGroup.selectAll('g').selectAll('text');
            const axisLines = this.xAxisSvgGroup.selectAll('g').selectAll('line');

            const color = <string>this.categoryAxisProperties?.axisColor;
            const fontSize = PixelConverter.toString(<number>this.categoryAxisProperties?.fontSize);
            const fontFamily = <string>this.categoryAxisProperties?.fontFamily;
            const gridlinesColor = <string>this.categoryAxisProperties?.gridlinesColor;
            const strokeWidth = PixelConverter.toString(<number>this.categoryAxisProperties?.strokeWidth);
            const showGridlines = this.categoryAxisProperties?.showGridlines;
            const lineStyle = <string>this.categoryAxisProperties?.lineStyle;

            if (color) {
                axisText
                    .style('fill', color)
                    .style('stroke', 'none');
            }

            if (fontSize) {
                axisText.style('font-size', fontSize);
            }

            if (fontFamily) {
                axisText.style('font-family', fontFamily);
            }

            if (gridlinesColor) {
                axisLines.style('stroke', gridlinesColor);
            }

            if (strokeWidth) {
                axisLines.style('stroke-width', strokeWidth);
            }

            if (lineStyle) {
                const strokeDasharray = getLineStyleParam(lineStyle);
                axisLines.style('stroke-dasharray', () => strokeDasharray);
            }

            axisLines.style('opacity', showGridlines ? '1' : '0');
        }

        if (this.valueAxisProperties?.['show'] !== undefined && !this.valueAxisProperties['show']) {
            this.yAxisSvgGroup.selectAll('*').remove();
        } else {
            this.yAxisSvgGroup.call(data.axes.y.axis);

            const axisText = this.yAxisSvgGroup.selectAll('g').selectAll('text');
            const axisLines = this.yAxisSvgGroup.selectAll('g').selectAll('line');

            const color = <string>this.valueAxisProperties?.axisColor;
            const fontSize = PixelConverter.toString(<number>this.valueAxisProperties?.fontSize);
            const fontFamily = this.valueAxisProperties?.fontFamily as string;
            const gridlinesColor = <string>this.valueAxisProperties?.gridlinesColor;
            const strokeWidth = PixelConverter.toString(<number>this.valueAxisProperties?.strokeWidth);
            const showGridlines = this.valueAxisProperties?.showGridlines;
            const lineStyle = <string>this.valueAxisProperties?.lineStyle;

            if (color) {
                axisText
                    .style('fill', color)
                    .style('stroke', 'none');
            }

            if (fontSize) {
                axisText.style('font-size', fontSize);
            }

            if (fontFamily) {
                axisText.style('font-family', fontFamily);
            }

            if (gridlinesColor) {
                axisLines.style('stroke', gridlinesColor);
            }

            if (strokeWidth) {
                axisLines.style('stroke-width', strokeWidth);
            }

            if (lineStyle) {
                const strokeDasharray = getLineStyleParam(lineStyle);
                axisLines.style('stroke-dasharray', () => strokeDasharray);
            }

            axisLines.style('opacity', showGridlines ? '1' : '0');
        }
    }

    // eslint-disable-next-line max-lines-per-function
    private renderAxesLabels(
        axisLabels: VisualAxesLabels,
        legendMargin: number,
        viewport: IViewport,
        visualMargin: IMargin): void {

        const margin = visualMargin;
        const width = viewport.width;
        const height = viewport.height;
        const showY1OnRight = false;

        const axisLabelsData = [axisLabels.x, axisLabels.y];

        // Create text elements for the axis labels.
        this.axisLabelsGroup = this.axisGraphicsContext.selectAll('*')
            .data(axisLabelsData);

        const axisLabelsGroupEnter = this.axisLabelsGroup.enter()
            .append('text')
            .classed(Selectors.XAxisLabelSelector.className, true);

        this.axisLabelsGroup.exit().remove();

        // Read the properties of the axes.
        const xColor = <string>this.categoryAxisProperties?.axisTitleColor;
        const xFontSize: number = parseInt(<string>this.categoryAxisProperties?.titleFontSize);
        const xFontSizeString = PixelConverter.toString(xFontSize);
        const xTitle = this.categoryAxisProperties?.axisTitle.toString();
        const xAxisStyle = <string>this.categoryAxisProperties?.axisStyle;

        const yColor = <string>this.valueAxisProperties?.axisTitleColor;
        const yFontSize = <number>this.valueAxisProperties?.titleFontSize;
        const yFontSizeString = PixelConverter.toString(yFontSize);
        const yTitle = this.valueAxisProperties?.axisTitle;
        const yAxisStyle = <string>this.valueAxisProperties?.axisStyle;

        // Set the properties of the axes.
        this.axisLabelsGroup.merge(axisLabelsGroupEnter)
            .style('text-anchor', 'middle')
            .text(d => d)
            .call(t => {
                // X Axis
                const textSelectionX = d3select(t.nodes()[0]);
                textSelectionX.attr('transform', svgTranslate(
                    (width + margin.left) / Visual.AxisLabelOffset,
                    height - this.legend.getMargins().height - this.playAxis.getHeight() - xFontSize,
                ));

                if (xTitle && xTitle.toString().length > 0) {
                    textSelectionX.text(xTitle as string);
                }

                if (xAxisStyle && this.data?.axes.x) {
                    const newTitle: string = getTitleWithUnitType(textSelectionX.text(), xAxisStyle, this.data.axes.x);
                    textSelectionX.text(newTitle);
                }

                if (xColor) {
                    textSelectionX.style('fill', xColor);
                }

                if (xFontSizeString) {
                    textSelectionX.style('font-size', xFontSizeString);
                }

                // Y Axis
                const textSelectionY = d3select(t.nodes()[1]);
                textSelectionY
                    .attr('transform', Visual.YAxisLabelTransformRotate)
                    .attr('x', -((height - margin.top - legendMargin - margin.bottom) / Visual.AxisLabelOffset))
                    .attr('y', showY1OnRight
                        ? width + margin.right - yFontSize
                        : margin.left / 2)
                    .attr('dy', Visual.DefaultDY);

                if (yTitle && yTitle.toString().length > 0) {
                    textSelectionY.text(yTitle as string);
                }

                if (yAxisStyle && this.data?.axes.y) {
                    const newTitle: string = getTitleWithUnitType(textSelectionY.text(), yAxisStyle, this.data?.axes.y);

                    textSelectionY.text(newTitle);
                }

                if (yColor) {
                    textSelectionY.style('fill', yColor);
                }

                if (yFontSizeString) {
                    textSelectionY.style('font-size', yFontSizeString);
                }
            });
    }

    private renderAxesConstantLines(data: VisualData) {
        const axesLinesData = [this.xAxisConstantLineProperties, this.yAxisConstantLineProperties];
        const size = data.size;
        const xScale = data.axes.x.scale;
        const yScale = data.axes.y.scale;

        const axesLinesGroup = this.axisConstantLinesGroup
            .selectAll(Selectors.ConstantLine.selectorName)
            .data(axesLinesData);

        const axesLinesGroupEnter = axesLinesGroup.enter()
            .append('line')
            .classed(Selectors.ConstantLine.className, true);

        axesLinesGroup.exit().remove();

        axesLinesGroup.merge(axesLinesGroupEnter)
            .call((lines) => {
                const xConstantLine = d3select(lines.nodes()[0]);
                if (axesLinesData[0]?.show) {
                    xConstantLine
                        .attr('x1', xScale(axesLinesData[0].value))
                        .attr('x2', xScale(axesLinesData[0].value))
                        .attr('y1', '0')
                        .attr('y2', size.height)
                        .attr('stroke', <string>axesLinesData[0].color)
                        .style('opacity', 1);
                } else {
                    xConstantLine.style('opacity', 0);
                }

                const yConstantLine = d3select(lines.nodes()[1]);
                if (axesLinesData[1]?.show) {
                    yConstantLine
                        .attr('y1', yScale(axesLinesData[1].value))
                        .attr('y2', yScale(axesLinesData[1].value))
                        .attr('x1', '0')
                        .attr('x2', size.width)
                        .attr('stroke', <string>axesLinesData[1].color)
                        .style('opacity', 1);
                } else {
                    yConstantLine.style('opacity', 0);
                }
            });
    }

    // eslint-disable-next-line max-lines-per-function
    private createD3Axes(
        visualSize: ISize,
        items: VisualDataPoint[],
        metaDataColumn: VisualMeasureMetadataColumns,
        options: AxesOptions): IAxes {
        // Create ordinal scale for X axis.
        let dataDomainMinX: number = d3min(items, d => <number>d.x) ?? Visual.DefaultDataDomainMin;
        let dataDomainMaxX: number = d3max(items, d => <number>d.x) ?? Visual.DefaultDataDomainMin;
        let xAxisProperties: IAxisProperties | null = null;
        const categoryAxisProperties = options.categoryAxisProperties;
        const valueAxisProperties = options.valueAxisProperties;
        const xLine = <number>options.xAxisConstantLine.value;
        const isShowXLine = options.xAxisConstantLine.show;
        const yLine = options.yAxisConstantLine.value;
        const isShowYLine = options.yAxisConstantLine.show;


        dataDomainMinX = isShowXLine && xLine < dataDomainMinX ? xLine : dataDomainMinX;
        dataDomainMaxX = isShowXLine && xLine > dataDomainMaxX ? xLine : dataDomainMaxX;

        const forcedXDomain: [number | null, number | null] = [
            categoryAxisProperties
                ? <number>categoryAxisProperties['start']
                : null,
            categoryAxisProperties
                ? <number>categoryAxisProperties['end']
                : null,
        ];

        const categoryAxisDisplayUnits = categoryAxisProperties && categoryAxisProperties['labelDisplayUnits'] != null
            ? <number>categoryAxisProperties['labelDisplayUnits']
            : Visual.LabelDisplayUnitsDefault;

        const categoryAxisScaleType = categoryAxisProperties && categoryAxisProperties['axisScale'] != null
            ? <string>categoryAxisProperties['axisScale']
            : undefined;

        let xAxisPrecision: any = categoryAxisProperties && categoryAxisProperties['valueDecimalPlaces'] != null && categoryAxisProperties['valueDecimalPlaces'] >= 0
            ? <string>categoryAxisProperties['valueDecimalPlaces']
            : Visual.DefaultPrecision;

        dataDomainMinX = forcedXDomain[0] !== null && forcedXDomain[0] !== undefined ? forcedXDomain[0] : dataDomainMinX;
        dataDomainMaxX = forcedXDomain[1] !== null && forcedXDomain[1] !== undefined ? forcedXDomain[1] : dataDomainMaxX;

        const xAxisFormatString: string = valueFormatter.getFormatStringByColumn(<any>metaDataColumn.x);

        if (dataDomainMinX === 0 && dataDomainMaxX === 0) {
            dataDomainMinX = -1;
            dataDomainMaxX = 1;
        }

        if (xAxisPrecision === 0) {
            xAxisPrecision = xAxisPrecision.toString();
        }

        xAxisProperties = createAxis({
            pixelSpan: visualSize.width,
            dataDomain: [dataDomainMinX, dataDomainMaxX],
            metaDataColumn: <any>metaDataColumn.x,
            formatString: xAxisFormatString,
            outerPadding: 0,
            innerPadding: 0,
            isScalar: true,
            isVertical: false,
            isCategoryAxis: true,
            useTickIntervalForDisplayUnits: true,
            scaleType: categoryAxisScaleType,
            axisDisplayUnits: categoryAxisDisplayUnits,
            axisPrecision: xAxisPrecision,
        });

        // Hide all ticks for X axis.
        xAxisProperties.axis
            .tickSizeInner(-visualSize.height)
            .tickPadding(Visual.DefaultAxisXTickPadding)
            .tickSizeOuter(1);

        // Create linear scale for Y axis
        let dataDomainMinY: number = d3min(items, d => <number>d.y) ?? Visual.DefaultDataDomainMin;
        let dataDomainMaxY: number = d3max(items, d => <number>d.y) ?? Visual.DefaultDataDomainMin;

        dataDomainMinY = isShowYLine && dataDomainMinY != undefined && yLine < dataDomainMinY ? <number>yLine : dataDomainMinY;
        dataDomainMaxY = isShowYLine && dataDomainMaxY != undefined && yLine > dataDomainMaxY ? <number>yLine : dataDomainMaxY;

        const yAxisFormatString: string = valueFormatter.getFormatStringByColumn(<any>metaDataColumn.y);

        const valueAxisDisplayUnits = valueAxisProperties && valueAxisProperties['labelDisplayUnits'] != null
            ? <number>valueAxisProperties['labelDisplayUnits']
            : Visual.LabelDisplayUnitsDefault;

        const valueAxisScaleType = valueAxisProperties && valueAxisProperties['axisScale'] != null
            ? <string>valueAxisProperties['axisScale']
            : undefined;

        let yAxisPrecision = valueAxisProperties && valueAxisProperties['valueDecimalPlaces'] != null && valueAxisProperties['valueDecimalPlaces'] >= 0
            ? <number>valueAxisProperties['valueDecimalPlaces']
            : Visual.DefaultPrecision;

        const forcedYDomain: [number | null, number | null] = [
            valueAxisProperties
                ? <number>valueAxisProperties['start']
                : null,
            valueAxisProperties
                ? <number>valueAxisProperties['end']
                : null,
        ];

        dataDomainMinY = forcedYDomain[0] !== null && forcedYDomain[0] !== undefined ? forcedYDomain[0] : dataDomainMinY;
        dataDomainMaxY = forcedYDomain[1] !== null && forcedYDomain[1] !== undefined ? forcedYDomain[1] : dataDomainMaxY;

        if (dataDomainMinY === 0 && dataDomainMaxY === 0) {
            dataDomainMinY = -1;
            dataDomainMaxY = 1;
        }

        if (yAxisPrecision === 0) {
            yAxisPrecision = <any>yAxisPrecision.toString();
        }

        const yAxisProperties = createAxis({
            pixelSpan: visualSize.height,
            dataDomain: [dataDomainMinY, dataDomainMaxY],
            metaDataColumn: <any>metaDataColumn.y,
            formatString: yAxisFormatString,
            outerPadding: 0,
            innerPadding: 0,
            isScalar: true,
            isVertical: true,
            isCategoryAxis: false,
            useTickIntervalForDisplayUnits: true,
            scaleType: valueAxisScaleType,
            axisDisplayUnits: valueAxisDisplayUnits,
            axisPrecision: yAxisPrecision,
        });

        // For Y axis, make ticks appear full-width.
        yAxisProperties.axis
            .tickSizeInner(-visualSize.width)
            .tickPadding(Visual.DefaultAxisYTickPadding)
            .tickSizeOuter(1);

        return {
            x: xAxisProperties,
            y: yAxisProperties,
        };
    }

    // eslint-disable-next-line max-lines-per-function
    private getCategoryAxisValues(instances: VisualObjectInstance[]): void {
        const isScalar: boolean = true,
            logPossible: boolean = isLogScalePossible(this.data?.axes.x.dataDomain ?? []),
            scaleOptions: string[] = [
                axisScale.log,
                axisScale.linear,
            ]; // until options can be update in propPane, show all options

        if (!isScalar) {
            if (this.categoryAxisProperties) {
                this.categoryAxisProperties['start'] = <any>null;
                this.categoryAxisProperties['end'] = <any>null;
            }
        }

        const instance: VisualObjectInstance = {
            selector: <any>null,
            properties: {},
            objectName: 'categoryAxis',
            validValues: {
                axisScale: scaleOptions,
                valueDecimalPlaces: {
                    numberRange: {
                        min: 0,
                        max: 15,
                    },
                },
            },
        };

        instance.properties['show'] = this.categoryAxisProperties && this.categoryAxisProperties['show'] != null
            ? this.categoryAxisProperties['show']
            : true;

        if (this.yAxisIsCategorical) { // in case of e.g. barChart
            instance.properties['position'] = this.valueAxisProperties && this.valueAxisProperties['position'] != null
                ? this.valueAxisProperties['position']
                : YAxisPosition.left;
        }

        instance.properties['axisType'] = isScalar
            ? AxisType.scalar
            : AxisType.categorical;

        if (isScalar) {
            if (logPossible) {
                instance.properties['axisScale'] = (this.categoryAxisProperties
                    && this.categoryAxisProperties['axisScale'] != null
                    && logPossible)
                    ? this.categoryAxisProperties['axisScale']
                    : axisScale.linear;
            }

            if (this.categoryAxisProperties) {
                instance.properties['start'] = this.categoryAxisProperties['start'];
                instance.properties['end'] = this.categoryAxisProperties['end'];
            }

            instance.properties['axisColor'] = this.categoryAxisProperties
                ? this.categoryAxisProperties['axisColor']
                : Visual.DefaultColor;

            instance.properties['fontSize'] = this.categoryAxisProperties
                ? this.categoryAxisProperties['fontSize']
                : Visual.DefaultTitleFontSize;

            instance.properties['fontFamily'] = this.categoryAxisProperties
                ? this.categoryAxisProperties['fontFamily']
                : Visual.DefaultFontFamily;

            instance.properties['labelDisplayUnits'] = this.categoryAxisProperties
            && this.categoryAxisProperties['labelDisplayUnits'] != null
                ? this.categoryAxisProperties['labelDisplayUnits']
                : Visual.LabelDisplayUnitsDefault;
        }

        instance.properties['valueDecimalPlaces'] = this.categoryAxisProperties
        && this.categoryAxisProperties['valueDecimalPlaces'] !== undefined
        && this.categoryAxisProperties['valueDecimalPlaces'] >= 0
            ? this.categoryAxisProperties['valueDecimalPlaces']
            : Visual.DefaultPrecision;

        instance.properties['showAxisTitle'] = this.categoryAxisProperties
        && this.categoryAxisProperties['showAxisTitle'] != null
            ? this.categoryAxisProperties['showAxisTitle']
            : true;

        instance.properties['axisStyle'] = this.categoryAxisProperties
        && this.categoryAxisProperties['axisStyle'] != null
            ? this.categoryAxisProperties['axisStyle']
            : axisStyle.showTitleOnly;

        instance.properties['axisTitleColor'] = this.categoryAxisProperties
        && this.categoryAxisProperties['axisTitleColor'] != null
            ? this.categoryAxisProperties['axisTitleColor']
            : Visual.DefaultColor;

        instance.properties['axisTitle'] = this.categoryAxisProperties
            ? this.categoryAxisProperties['axisTitle']
            : Visual.DefaultAxisTitle;

        instance.properties['titleFontSize'] = this.categoryAxisProperties
            ? this.categoryAxisProperties['titleFontSize']
            : Visual.DefaultTitleFontSize;

        instance.properties['showGridlines'] = this.categoryAxisProperties
        && this.categoryAxisProperties['showGridlines'] != null
            ? this.categoryAxisProperties['showGridlines']
            : true;

        if (instance.properties['showGridlines']) {
            instance.properties['gridlinesColor'] = this.categoryAxisProperties
            && this.categoryAxisProperties['gridlinesColor'] != null
                ? this.categoryAxisProperties['gridlinesColor']
                : Visual.DefaultGridlinesColor;

            instance.properties['strokeWidth'] = this.categoryAxisProperties
            && this.categoryAxisProperties['strokeWidth'] != null
                ? this.categoryAxisProperties['strokeWidth']
                : Visual.DefaultStrokeWidth;

            instance.properties['lineStyle'] = this.categoryAxisProperties
            && this.categoryAxisProperties['lineStyle'] != null
                ? this.categoryAxisProperties['lineStyle']
                : Visual.DefaultLineStyle;
        }

        instances.push(instance);
    }

    // eslint-disable-next-line max-lines-per-function
    private getValueAxisValues(instances: VisualObjectInstance[]): void {
        const isScalar: boolean = true,
            logPossible: boolean = isLogScalePossible(this.data?.axes.y.dataDomain ?? []),
            scaleOptions: string[] = [
                axisScale.log,
                axisScale.linear,
            ]; // until options can be update in propPane, show all options

        if (!isScalar) {
            if (this.categoryAxisProperties) {
                this.categoryAxisProperties['start'] = <any>null;
                this.categoryAxisProperties['end'] = <any>null;
            }
        }

        const instance: VisualObjectInstance = {
            selector: {},
            properties: {},
            objectName: 'valueAxis',
            validValues: {
                axisScale: scaleOptions,
                secAxisScale: scaleOptions,
                valueDecimalPlaces: {
                    numberRange: {
                        min: 0,
                        max: 15,
                    },
                },
            },
        };

        instance.properties['show'] = this.valueAxisProperties && this.valueAxisProperties['show'] != null
            ? this.valueAxisProperties['show']
            : true;

        if (this.yAxisIsCategorical) { // in case of e.g. barChart
            instance.properties['position'] = this.valueAxisProperties && this.valueAxisProperties['position'] != null
                ? this.valueAxisProperties['position']
                : YAxisPosition.left;
        }

        instance.properties['axisType'] = isScalar
            ? AxisType.scalar
            : AxisType.categorical;

        if (isScalar) {
            if (logPossible) {
                instance.properties['axisScale'] = (this.valueAxisProperties
                    && this.valueAxisProperties['axisScale'] != null
                    && logPossible)
                    ? this.valueAxisProperties['axisScale']
                    : axisScale.linear;
            }

            instance.properties['start'] = this.valueAxisProperties
                ? this.valueAxisProperties['start']
                : <any>null;

            instance.properties['end'] = this.valueAxisProperties
                ? this.valueAxisProperties['end']
                : <any>null;

            instance.properties['axisColor'] = this.valueAxisProperties
                ? this.valueAxisProperties['axisColor']
                : Visual.DefaultColor;

            instance.properties['fontSize'] = this.valueAxisProperties
                ? this.valueAxisProperties['fontSize']
                : Visual.DefaultTitleFontSize;

            instance.properties['fontFamily'] = this.valueAxisProperties
                ? this.valueAxisProperties['fontFamily']
                : Visual.DefaultFontFamily;

            instance.properties['labelDisplayUnits'] = this.valueAxisProperties
            && this.valueAxisProperties['labelDisplayUnits'] != null
                ? this.valueAxisProperties['labelDisplayUnits']
                : Visual.LabelDisplayUnitsDefault;
        }

        instance.properties['valueDecimalPlaces'] = this.valueAxisProperties
        && this.valueAxisProperties['valueDecimalPlaces'] !== undefined
        && this.valueAxisProperties['valueDecimalPlaces'] >= 0
            ? this.valueAxisProperties['valueDecimalPlaces']
            : Visual.DefaultPrecision;

        instance.properties['showAxisTitle'] = this.valueAxisProperties
        && this.valueAxisProperties['showAxisTitle'] != null
            ? this.valueAxisProperties['showAxisTitle']
            : true;

        instance.properties['axisStyle'] = this.valueAxisProperties
        && this.valueAxisProperties['axisStyle'] != null
            ? this.valueAxisProperties['axisStyle']
            : axisStyle.showTitleOnly;

        instance.properties['axisTitleColor'] = this.valueAxisProperties
        && this.valueAxisProperties['axisTitleColor'] != null
            ? this.valueAxisProperties['axisTitleColor']
            : Visual.DefaultColor;

        instance.properties['axisTitle'] = this.valueAxisProperties
            ? this.valueAxisProperties['axisTitle']
            : Visual.DefaultAxisTitle;

        instance.properties['titleFontSize'] = this.valueAxisProperties
            ? this.valueAxisProperties['titleFontSize']
            : Visual.DefaultTitleFontSize;

        instance.properties['showGridlines'] = this.valueAxisProperties
        && this.valueAxisProperties['showGridlines'] != null
            ? this.valueAxisProperties['showGridlines']
            : true;

        if (instance.properties['showGridlines']) {
            instance.properties['gridlinesColor'] = this.valueAxisProperties
            && this.valueAxisProperties['gridlinesColor'] != null
                ? this.valueAxisProperties['gridlinesColor']
                : Visual.DefaultGridlinesColor;

            instance.properties['strokeWidth'] = this.valueAxisProperties
            && this.valueAxisProperties['strokeWidth'] != null
                ? this.valueAxisProperties['strokeWidth']
                : Visual.DefaultStrokeWidth;

            instance.properties['lineStyle'] = this.valueAxisProperties
            && this.valueAxisProperties['lineStyle'] != null
                ? this.valueAxisProperties['lineStyle']
                : Visual.DefaultLineStyle;
        }

        instances.push(instance);
    }

    private getLegendValues(instances: VisualObjectInstance[]): void {
        if (!this.data?.hasDynamicSeries) {
            return;
        }

        const instance: VisualObjectInstance = {
            selector: <any>null,
            properties: {},
            objectName: 'legend',
            validValues: {},
        };

        instance.properties['show'] = this.legendProperties && this.legendProperties['show'] != null
            ? this.legendProperties['show']
            : true;

        instance.properties['position'] = this.legendProperties && this.legendProperties['position'] != null
            ? this.legendProperties['position']
            : LegendPosition.Top;

        instance.properties['showTitle'] = this.legendProperties && this.legendProperties['showTitle'] != null
            ? this.legendProperties['showTitle']
            : true;

        instance.properties['titleText'] = this.legendProperties && this.legendProperties['titleText'] != null
            ? this.legendProperties['titleText']
            : Visual.DefaultLegendTitleText;

        instance.properties['labelColor'] = this.legendProperties && this.legendProperties['labelColor'] != null
            ? this.legendProperties['labelColor']
            : {solid: {color: Visual.DefaultColor}};

        instance.properties['fontFamily'] = this.legendProperties && this.legendProperties['fontFamily'] != null
            ? this.legendProperties['fontFamily']
            : Visual.DefaultFontFamily;

        instance.properties['fontSize'] = this.legendProperties && this.legendProperties['fontSize'] != null
            ? this.legendProperties['fontSize']
            : Visual.DefaultLegendLabelFontSize;

        instances.push(instance);
    }

    private getBubblePositionX(scale: (item: number | null) => number, item: number | null): number {
        if (item !== null) {
            return scale(item);
        } else {
            return Math.round((this.data?.size.width ?? 0) / 2);
        }
    }

    private getBubblePositionY(scale: (item: number | null) => number, item: number | null): number {
        if (item !== null) {
            return scale(item);
        } else {
            return Math.round((this.data?.size.height ?? 0) / 2);
        }
    }

    private getBubbleSizeScale(items: VisualDataPoint[]) {
        let minRange = d3min(items, d => <number>d.radius.value);
        let maxRange = d3max(items, d => <number>d.radius.value);

        maxRange = maxRange ? maxRange : Visual.maxBubbleSize;
        minRange = minRange ? minRange : Visual.minBubbleSize;

        return scaleLinear([minRange, maxRange], [Visual.minBubbleSize, Visual.maxBubbleSize]);
    }

    public clearVisual(viewport: IViewport): void {
        this.legend.reset();
        this.legend.drawLegend({dataPoints: []}, viewport);

        this.xAxisSvgGroup.selectAll('*').remove();
        this.yAxisSvgGroup.selectAll('*').remove();
        this.axisLabelsGroup?.selectAll('*').remove();

        this.scatterGroupSelect?.remove();
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     * */
    // eslint-disable-next-line max-lines-per-function
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const instances: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case 'legend': {
                this.getLegendValues(instances);
                break;
            }
            case 'dataPoint': {
                const categoricalDataView = this.dataView && this.dataView.categorical
                    ? this.dataView.categorical
                    : null;

                if (!hasGradientRole(categoricalDataView)) {
                    this.enumerateDataPoints(instances);
                }

                break;
            }
            case 'categoryAxis': {
                this.getCategoryAxisValues(instances);
                break;
            }

            case 'valueAxis': {
                this.getValueAxisValues(instances);
                break;
            }
            case 'fillPoint': {
                instances.push({
                    objectName: 'fillPoint',
                    selector: <any>null,
                    properties: {
                        show: this.fillPoint ?? false,
                    },
                });
                break;
            }
            case 'shapes': {
                instances.push({
                    objectName: 'shapes',
                    selector: <any>null,
                    properties: {
                        size: <any>this.shapesSize?.size,
                    },
                    validValues: {
                        size: {
                            numberRange: {
                                min: 0,
                                max: 100,
                            },
                        },
                    },
                });
                break;
            }

            case 'selectionColor': {
                const instance: VisualObjectInstance = {
                    objectName: 'selectionColor',
                    selector: <any>null,
                    properties: {
                        fillColor: this.selectionColorSettings && this.selectionColorSettings.fillColor ?
                            this.selectionColorSettings.fillColor :
                            Visual.DefaultColor,
                    },
                };

                instances.push(instance);
                break;
            }

            case 'pointsTransparency': {
                instances.push({
                    objectName: 'pointsTransparency',
                    selector: <any>null,
                    properties: {
                        selected: <any>this.pointsTransparencyProperties?.selected,
                        regular: <any>this.pointsTransparencyProperties?.regular,
                        unselected: <any>this.pointsTransparencyProperties?.unselected,
                    },
                    validValues: {
                        selected: {
                            numberRange: {
                                min: 0,
                                max: 100,
                            },
                        },
                        regular: {
                            numberRange: {
                                min: 0,
                                max: 100,
                            },
                        },
                        unselected: {
                            numberRange: {
                                min: 0,
                                max: 100,
                            },
                        },
                    },
                });

                break;
            }

            case 'xConstantLine': {
                this.getValueAxisValues(instances);

                instances.push({
                    objectName: 'xConstantLine',
                    selector: <any>null,
                    properties: {
                        show: this.xAxisConstantLineProperties && this.xAxisConstantLineProperties.show ?
                            this.xAxisConstantLineProperties.show :
                            Visual.DefaultConstantLineShow,
                        value: this.xAxisConstantLineProperties && this.xAxisConstantLineProperties.value ?
                            this.xAxisConstantLineProperties.value :
                            Visual.DefaultConstantLineValue,
                        color: this.xAxisConstantLineProperties && this.xAxisConstantLineProperties.color ?
                            this.xAxisConstantLineProperties.color :
                            Visual.DefaultColor,
                    },
                });
                break;
            }
            case 'yConstantLine': {
                this.getValueAxisValues(instances);

                instances.push({
                    objectName: 'yConstantLine',
                    selector: <any>null,
                    properties: {
                        show: this.yAxisConstantLineProperties && this.yAxisConstantLineProperties.show ?
                            this.yAxisConstantLineProperties.show :
                            Visual.DefaultConstantLineShow,
                        value: this.yAxisConstantLineProperties && this.yAxisConstantLineProperties.value ?
                            this.yAxisConstantLineProperties.value :
                            Visual.DefaultConstantLineValue,
                        color: this.yAxisConstantLineProperties && this.yAxisConstantLineProperties.color ?
                            this.yAxisConstantLineProperties.color :
                            Visual.DefaultColor,
                    },
                });
                break;
            }

            case 'categoryLabels': {
                const instanceEnumerationObject: VisualObjectInstanceEnumerationObject = {
                    instances,
                };

                if (this.data) {
                    dataLabelUtils.enumerateCategoryLabels(
                        <any>instanceEnumerationObject,
                        this.data.dataLabelsSettings,
                        true);

                    instances.push({
                        objectName: 'categoryLabels',
                        selector: <any>null,
                        properties: {
                            fontFamily: this.data.dataLabelsSettings && this.data.dataLabelsSettings.fontFamily ?
                                this.data.dataLabelsSettings.fontFamily :
                                Visual.DefaultFontFamily,
                            showBackground: this.data.dataLabelsSettings && this.data.dataLabelsSettings.showBackground ?
                                this.data.dataLabelsSettings.showBackground :
                                Visual.DefaultLabelShowBackground,
                        },
                    });


                    if (this.data.dataLabelsSettings && this.data.dataLabelsSettings.showBackground) {
                        instances.push({
                            objectName: 'categoryLabels',
                            selector: <any>null,
                            properties: {
                                backgroundColor: this.data.dataLabelsSettings.backgroundColor ?
                                    this.data.dataLabelsSettings.backgroundColor
                                    : Visual.DefaultLabelBackgroundColor,
                                transparency: this.data.dataLabelsSettings.transparency !== undefined && this.data.dataLabelsSettings.transparency !== null ?
                                    this.data.dataLabelsSettings.transparency
                                    : Visual.DefaultLabelBackgroundColorTransparency,
                            },
                            validValues: {
                                transparency: {
                                    numberRange: {
                                        min: 0,
                                        max: 100,
                                    },
                                },
                            },
                        });
                    }

                } else {
                    dataLabelUtils.enumerateCategoryLabels(
                        <any>instanceEnumerationObject,
                        <any>null,
                        true);
                }

                break;
            }
        }

        return instances;
    }

    private enumerateDataPoints(instances: VisualObjectInstance[]): void {
        if (!this.data) {
            return;
        }

        const seriesCount: number = this.data.dataPoints.length;

        if (!this.data.hasDynamicSeries) {
            const showAllDataPoints = this.data.showAllDataPoints ?? false;

            // Add default color and show all slices
            instances.push({
                objectName: 'dataPoint',
                selector: <any>null,
                properties: {
                    defaultColor: {
                        solid: {
                            color: this.data.defaultDataPointColor || this.colorPalette.getColor('0').value,
                        },
                    },
                },
            });

            instances.push({
                objectName: 'dataPoint',
                selector: <any>null,
                properties: {showAllDataPoints},
            });

            if (showAllDataPoints) {
                for (let i: number = 0; i < seriesCount; i++) {
                    const seriesDataPoints = this.data.dataPoints[i];

                    instances.push({
                        objectName: 'dataPoint',
                        displayName: seriesDataPoints.formattedCategory(),
                        selector: ColorHelper.normalizeSelector(
                            (seriesDataPoints.identity as IVisualSelectionId).getSelector(),
                            true),
                        properties: {
                            fill: {
                                solid: {
                                    color: seriesDataPoints.fill,
                                },
                            },
                        },
                    });
                }
            }
        } else {
            const legendDataPointLength: number = this.data.legendData.dataPoints.length;
            for (let i: number = 0; i < legendDataPointLength; i++) {
                const series = this.data.legendData.dataPoints[i];

                instances.push({
                    objectName: 'dataPoint',
                    displayName: series.label,
                    selector: ColorHelper.normalizeSelector((series.identity as IVisualSelectionId).getSelector()),
                    properties: {
                        fill: {
                            solid: {
                                color: series.color,
                            },
                        },
                    },
                });
            }
        }
    }
}

