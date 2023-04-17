import {BaseType, select as d3select, Selection as d3Selection} from 'd3-selection';
import {ITooltipServiceWrapper} from 'powerbi-visuals-utils-tooltiputils';
import {IAxes, PlayAxisUpdateData, VisualDataPoint} from './visualInterfaces';
import powerbi from 'powerbi-visuals-api';
import {ISize} from 'powerbi-visuals-utils-svgutils/lib/shapes/shapesInterfaces';
import {LegendPosition} from 'powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces';
import {translate as svgTranslate} from 'powerbi-visuals-utils-svgutils/lib/manipulation';
import {createAxis} from 'powerbi-visuals-utils-chartutils/lib/axis/axis';
import {textMeasurementService, valueFormatter} from 'powerbi-visuals-utils-formattingutils';
import {TextProperties} from 'powerbi-visuals-utils-formattingutils/lib/src/interfaces';
import {Visual} from './visual';
import {easeLinear as d3easeLinear} from 'd3-ease';
import {bindTooltip} from './tooltipBuilder';
import SliderOptions = JQueryUI.SliderOptions;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import VisualUpdateType = powerbi.VisualUpdateType;


interface PlayAxisMeasures {
    width: number;
    height: number;
    left: number;
    top: number;
}

const enum PlayAxisValueType {
    Date,
    Number,
    String
}

const enum PathBuildingMode {
    ByCategory,
    ByLegend,
    ByBoth
}

class Constants {
    static readonly Months: Readonly<string>[] = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    static readonly Height: number = 63;
    static readonly FontSize: number = 11; // this is taken from visual.less, must be in sync with it
    static readonly MarginTop: number = 10;
    static readonly SlicingDuration: number = 600;

    static readonly SliderHeight: number = 12;
    static readonly SliderAnimationDuration: number = 800;
    static readonly SliderBorderWidth: number = 1; // this is taken from jQuery UI stylesheet

    static readonly AxisHeight: number = 41;
    static readonly AxisLabelsMargin: number = 10; // distance between the labels
    static readonly AxisInnerTickSize: number = 5; // tick height
    static readonly AxisTickPadding: number = 12; // distance between ticks and labels
    static readonly AxisBigTickClass: string = 'showLabel';

    static readonly PlayButtonMarginTop: number = -6;
    static readonly PlayButtonSpace: number = 35; // space needed for rendering the button
    static readonly PlayButtonTimeInterval: number = 800;
    static readonly PlayButtonPlayingClass: string = 'playing';

    static readonly CaptionPaddingRight: number = 10;
    static readonly CaptionFontSizeFactor: number = 8.14;
    static readonly CaptionFontSizeMaxValue: number = 70;

    static readonly PathDrawingDuration: number = 750;
    static readonly PathLineClassName: string = 'play-axis-path';
    static readonly PathLengthReserve: number = 20;
    static readonly PathCircleClassName: string = 'play-axis-path-circle';
    static readonly PathCircleRadius: number = 7;
}

export class PlayAxis {
    // general
    private enabled: boolean = true;
    private visualSize: ISize | undefined = undefined;
    private groupedDataPoints: VisualDataPoint[][] | undefined = undefined;
    private groupNames: string[] | undefined = undefined;
    private currentGroupIndex: number | undefined = undefined;
    private valuesType: PlayAxisValueType | undefined = undefined;

    // slider
    private sliderEl: HTMLDivElement | undefined = undefined;
    private $sliderEl: JQuery<HTMLDivElement> | undefined = undefined;

    // axis
    private axisGroup: d3Selection<SVGGElement, undefined, null, undefined> | undefined = undefined;

    // play button
    private playButtonEl: d3Selection<HTMLButtonElement, undefined, null, undefined> | undefined = undefined;
    private playButtonTimer: number | undefined = undefined;

    // caption
    private captionGroup: d3Selection<SVGGElement, undefined, null, undefined> | undefined = undefined;
    private caption: d3Selection<SVGTextElement, undefined, null, undefined> | undefined = undefined;

    // visual
    private axes: IAxes | undefined = undefined;
    private scatterSelect: d3Selection<SVGCircleElement, VisualDataPoint, BaseType, VisualDataPoint[]> | undefined = undefined;
    private selectedItems: d3Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]> | undefined = undefined;

    // path
    private pathOwners: VisualDataPoint[] | undefined = undefined;
    private pathLinesContainer: d3Selection<SVGGElement, undefined, null, undefined> | undefined = undefined;
    private pathCirclesContainer: d3Selection<SVGGElement, undefined, null, undefined> | undefined = undefined;

    // tooltip
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(
        mainElement: HTMLElement,
        mainSvgElement: d3Selection<SVGSVGElement, undefined, null, undefined>,
        tooltipServiceWrapper: ITooltipServiceWrapper) {
        this.tooltipServiceWrapper = tooltipServiceWrapper;

        // slider
        this.initSlider(mainElement);

        // axis
        this.createAxisContainer(mainSvgElement);

        // play button
        this.initPlayButton(mainElement);

        // caption
        this.createCaptionElements(mainSvgElement);

        // paths
        this.initPaths(mainSvgElement);
    }

    // Public

    enable(): void {
        // showing playAxis elements
        if (this.sliderEl) {
            this.sliderEl.style.display = '';
        }
        this.axisGroup?.style('display', '');
        this.playButtonEl?.style('display', '');
        this.captionGroup?.style('display', '');

        this.enabled = true;
    }

    disable(): void {
        // hiding playAxis elements
        if (this.sliderEl) {
            this.sliderEl.style.display = 'none';
        }
        this.axisGroup?.style('display', 'none');
        this.playButtonEl?.style('display', 'none');
        this.captionGroup?.style('display', 'none');

        // showing all the dataPoints
        if (this.scatterSelect) {
            this.scatterSelect
                .style('display', '')
                .style('opacity', '');
        }

        this.stopAutoPlay();

        this.removePaths();

        this.enabled = false;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getHeight(): number {
        // getting the space needed for rendering the playAxis elements
        return this.enabled ? Constants.MarginTop + Constants.Height : 0;
    }

    onSelect(currentSelection: d3Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>, transition: boolean): void {
        // this method is called when any of data points are being selected or deselected
        if (!this.enabled || !this.groupedDataPoints) {
            return;
        }

        this.selectedItems = currentSelection;

        this.stopAutoPlay();

        const pathOwners: VisualDataPoint[] = this.updatePathOwners();

        this.renderPaths(pathOwners, transition);
    }

    // End: Public

    // Update

    update(update: PlayAxisUpdateData): void {
        this.updateProps(update);
        this.stopAutoPlay();
        this.render(update);
    }

    private updateProps(update: PlayAxisUpdateData): void {
        this.scatterSelect = update.scatterSelect ?? undefined;
        this.axes = update.axes;

        this.valuesType = PlayAxis.getValuesType(update.dataPoints);
        this.groupedDataPoints = PlayAxis.buildGroupedDataPoints(update.dataPoints, this.valuesType);
        this.groupNames = PlayAxis.getFormattedGroupNames(this.groupedDataPoints, this.valuesType);
    }

    private render(update: PlayAxisUpdateData): void {
        this.visualSize = update.visualSize;
        const measures = PlayAxis.getMeasures(update);
        this.renderAxis(update, measures);
        this.renderPlayButton(update, measures);
        this.renderCaption(update);

        if (!this.groupedDataPoints) {
            return;
        }

        this.renderSlider(update, measures, this.groupedDataPoints.length - 1);

        if (this.currentGroupIndex == undefined) {
            return;
        }

        this.slice(this.currentGroupIndex, false);
        this.renderPathContainers(update);

        if (update.updateType === VisualUpdateType.Resize || update.updateType === Visual.ResizeEndCode) {
            // on resize we just redraw the existing paths
            this.renderPaths(null, false, true);
        } else {
            // in other case we remove all the paths
            this.removePaths();
        }
    }

    // End: Update

    // Visual

    private slice(groupIndex: number, transition?: boolean) {
        if (!this.groupedDataPoints || !this.scatterSelect) {
            return;
        }

        // Slicing data points respective to the provided group index.
        // It means - showing circles of this group and hiding all other circles.
        // Also setting the group caption.
        const group: VisualDataPoint[] = this.groupedDataPoints[groupIndex];

        this.scatterSelect.each(function (d: VisualDataPoint) {
            const el = d3select(this);
            if (d.playAxisValue === group[0].playAxisValue) {
                d.isShown = true;
                el.style('display', '');
                if (transition) {
                    el.transition()
                        .duration(Constants.SlicingDuration)
                        .style('opacity', 1);
                } else {
                    el.style('opacity', 1);
                }
            } else {
                d.isShown = false;
                if (transition) {
                    el.transition()
                        .duration(Constants.SlicingDuration)
                        .style('opacity', 0)
                        .on('end', function () {
                            el.style('display', 'none');
                        });
                } else {
                    el.style('opacity', 0)
                        .style('display', 'none');
                }
            }
        });

        const captionValue: string = PlayAxis.formatValue(group[0].playAxisValue, this.valuesType);
        this.setCaptionText(captionValue);
    }

    // End: Visual

    // Slider
    // Slider is the main thing here which controls the state

    private initSlider(mainElement: HTMLElement): void {
        // Changing the jQuery's global setting
        $.easing._default = 'linear' as any;

        this.sliderEl = document.createElement('div');
        // this.sliderEl.style.display = 'none';

        this.$sliderEl = $(this.sliderEl);

        // Hide slider element by setting style.display attribute to 'none'
        this.$sliderEl.css('display', 'none');

        // Set slider element's id and class attributes to playAxisSlider
        this.$sliderEl.attr({
            id: 'playAxisSlider',
            class: 'playAxisSlider',
        });

        // Creating jQuery UI Slider
        // Demo: https://jqueryui.com/slider/
        // API: http://api.jqueryui.com/slider/
        const jqueryUiSliderParams: SliderOptions = {
            min: 0,
            max: 1,
            value: 0,
            animate: Constants.SliderAnimationDuration,
            slide: (e, ui) => {
                this.currentGroupIndex = ui.value;
                if (ui.value !== undefined) {
                    this.onSlide(+ui.value);
                }
            },
            change: (e, ui) => {
                this.currentGroupIndex = ui.value;
                if (ui.value != undefined) {
                    this.onChange(+ui.value);
                }
            },
        };
        this.$sliderEl
            .css('height', Constants.SliderHeight)
            .appendTo(mainElement)
            .slider(jqueryUiSliderParams);
    }

    private renderSlider(update: PlayAxisUpdateData, measures: PlayAxisMeasures, maxValue: number): void {
        if (!this.$sliderEl) {
            return;
        }

        this.$sliderEl.css({
            top: measures.top
                + (
                    update.legendPosition === LegendPosition.Top
                    || update.legendPosition === LegendPosition.TopCenter
                        ? update.legendSize.height : 0
                ),
            left: measures.left
                + (
                    update.legendPosition === LegendPosition.Left
                    || update.legendPosition === LegendPosition.LeftCenter
                        ? update.legendSize.width : 0
                )
                + Constants.PlayButtonSpace
                - Constants.SliderBorderWidth,
            width: measures.width
                - Constants.PlayButtonSpace
                - (
                    update.legendPosition === LegendPosition.Right
                    || update.legendPosition === LegendPosition.RightCenter
                    || update.legendPosition === LegendPosition.Left
                    || update.legendPosition === LegendPosition.LeftCenter
                        ? update.legendSize.width : 0
                )
                + Constants.SliderBorderWidth * 2, // considering left and right border
        });

        if (update.updateType !== VisualUpdateType.Resize && update.updateType !== Visual.ResizeEndCode) {
            this.$sliderEl.slider('option', {
                min: 0,
                max: maxValue,
                value: maxValue,
            });
        }
    }

    private onSlide(index: number): void {
        this.stopAutoPlay();
        this.slice(index, true);
        this.renderPaths(null, true);
    }

    private onChange(index: number): void {
        this.slice(index, true);
    }

    // End: Slider

    // Axis

    private createAxisContainer(mainSvgElement: d3Selection<SVGSVGElement, undefined, null, undefined>): void {
        this.axisGroup = mainSvgElement
            .append('g')
            .style('display', 'none')
            .attr('id', 'playAxis')
            .classed('playAxis', true);
    }

    private renderAxis(update: PlayAxisUpdateData, measures: PlayAxisMeasures): void {
        if (!this.axisGroup || !this.groupNames) {
            return;
        }

        this.axisGroup.attr('transform', svgTranslate(
            measures.left + Constants.PlayButtonSpace,
            measures.top + (Constants.Height - Constants.AxisHeight),
        ));

        const pixelSpan: number = measures.width
            - Constants.PlayButtonSpace
            - (
                update.legendPosition === LegendPosition.Left
                || update.legendPosition === LegendPosition.LeftCenter
                || update.legendPosition === LegendPosition.Right
                || update.legendPosition === LegendPosition.RightCenter
                    ? update.legendSize.width : 0
            );
        const xAxisProperties = createAxis({
            pixelSpan,
            dataDomain: this.groupNames as any[],
            metaDataColumn: <DataViewMetadataColumn>update.metadataColumn,
            formatString: valueFormatter.getFormatStringByColumn(<any>update.metadataColumn),
            outerPadding: 0,
            innerPadding: 0,
            isCategoryAxis: true,
            useRangePoints: true,
        });
        xAxisProperties.axis
            .tickSizeInner(Constants.AxisInnerTickSize)
            .tickPadding(Constants.AxisTickPadding)
            .tickValues(this.groupNames);

        this.axisGroup.call(xAxisProperties.axis);

        // doing some fixes after the rendering
        const labelsMap = PlayAxis.getAxisLabelsMap(this.groupNames, pixelSpan);
        PlayAxis.formatTicksAndLabels(this.axisGroup, labelsMap);
    }

    private static formatTicksAndLabels(axisGroup: d3Selection<SVGGElement, undefined, null, undefined>, labelsMap: boolean[]): void {
        // 1. Normalizing labels so they don't overlap each other
        // 2. Ticks that have a visible label, we make two times higher

        axisGroup.selectAll('.tick')
            .each(function (_, i) {
                const tick = d3select(this);
                const line = tick.select('line');
                if (labelsMap[i]) {
                    tick.classed(Constants.AxisBigTickClass, true);
                    line.attr('y2', Constants.AxisInnerTickSize * 2);
                } else {
                    tick.classed(Constants.AxisBigTickClass, false);
                    line.attr('y2', Constants.AxisInnerTickSize);
                }
            });
    }

    private static getAxisLabelsMap(groupNames: string[], pixelSpan: number): boolean[] {
        // Determining which ticks have to be rendered with no label
        // and which ticks have to be rendered with label and more bright color.
        // Mapping values are: null and true respectively.
        const textProperties: TextProperties = {
            fontFamily: Visual.DefaultFontFamily,
            fontSize: Constants.FontSize.toString(),
        };

        const labelsWidths: number[] = [];
        for (let i: number = 0; i < groupNames.length; i++) {
            const width: number = textMeasurementService.measureSvgTextWidth(textProperties, groupNames[i]) + Constants.AxisLabelsMargin;
            labelsWidths.push(width);
        }

        const maxLabelWidth: number = Math.max(...labelsWidths);
        const capacity: number = Math.floor(pixelSpan / maxLabelWidth);
        const factor: number = Math.ceil(groupNames.length / capacity); // determining the factor for axis dividing

        const map: boolean[] = [];
        for (let i: number = 0; i < groupNames.length; i++) {
            if (i % factor === 0) {
                map[i] = true;
            }
        }

        return map;
    }

    // End: Axis

    // Play button

    private initPlayButton(mainElement: HTMLElement): void {
        this.playButtonEl = d3select<HTMLElement, undefined>(mainElement)
            .append('button')
            .style('display', 'none')
            .attr('id', 'playButton')
            .classed('playButton', true);

        this.playButtonEl.on('click', () => {
            if (this.playButtonTimer) {
                this.stopAutoPlay();
            } else {
                this.startAutoPlay();
            }
        });
    }

    private renderPlayButton(update, measures: PlayAxisMeasures): void {
        if (!this.playButtonEl) {
            return;
        }

        this.playButtonEl
            .style('top', measures.top
                + (update.legendPosition === LegendPosition.Top || update.legendPosition === LegendPosition.TopCenter ? update.legendSize.height : 0)
                + Constants.PlayButtonMarginTop + 'px')
            .style('left', measures.left
                + (update.legendPosition === LegendPosition.Left || update.legendPosition === LegendPosition.LeftCenter ? update.legendSize.width : 0)
                + 'px');
    }

    private startAutoPlay(): void {
        if (!this.groupedDataPoints) {
            return;
        }

        this.playButtonEl?.classed(Constants.PlayButtonPlayingClass, true);

        if (this.$sliderEl?.slider('value') === this.groupedDataPoints.length - 1) {
            this.setGroupByIndex(0);
        } else {
            this.setNextGroup();
        }

        this.setAutoPlayTimeout();
    }

    private setAutoPlayTimeout() {
        this.playButtonTimer = window.setTimeout(
            () => {
                if (!this.$sliderEl || !this.groupedDataPoints) {
                    return;
                }

                if (this.$sliderEl.slider('value') >= this.groupedDataPoints.length - 1) {
                    this.stopAutoPlay();
                    return;
                }
                this.setNextGroup();
                this.setAutoPlayTimeout();
            },
            Constants.PlayButtonTimeInterval,
        );
    }

    private stopAutoPlay(): void {
        if (!this.playButtonEl) {
            return;
        }

        this.playButtonEl.classed(Constants.PlayButtonPlayingClass, false);
        window.clearTimeout(this.playButtonTimer);
        this.playButtonTimer = undefined;
    }

    private setGroupByIndex(index: number): void {
        // when slider value changes slider launches the 'change' callback
        this.$sliderEl?.slider('value', index);

        this.renderPaths(null, true);
    }

    private setNextGroup(): void {
        if (!this.$sliderEl || !this.groupedDataPoints) {
            return;
        }

        const nextIndex = this.$sliderEl.slider('value') + 1;
        if (nextIndex >= this.groupedDataPoints.length) {
            this.stopAutoPlay();
        } else {
            this.setGroupByIndex(nextIndex);
        }
    }

    // End: Play button

    // Caption

    private createCaptionElements(mainSvgElement: d3Selection<SVGSVGElement, undefined, null, undefined>): void {
        this.captionGroup = mainSvgElement
            .append('g')
            .style('display', 'none')
            .attr('id', 'playCaption')
            .classed('playCaption', true);

        this.caption = this.captionGroup.append('text');
    }

    private renderCaption(update: PlayAxisUpdateData) {
        if (!this.captionGroup || !this.caption) {
            return;
        }

        // rendering empty caption, the text will be set later by the 'slice' method
        const x: number = update.viewport.width
            - (update.legendPosition === LegendPosition.Right
            || update.legendPosition === LegendPosition.RightCenter
            || update.legendPosition === LegendPosition.Left
            || update.legendPosition === LegendPosition.LeftCenter
                ? update.legendSize.width : 0)
            - update.visualMargin.right
            - update.axesSize.yAxisWidth
            - Constants.CaptionPaddingRight;
        const y: number = update.visualMargin.top;

        this.captionGroup.attr('transform', `translate(${x}, ${y})`);

        const fontSize = Math.min(Constants.CaptionFontSizeMaxValue, update.viewport.height / Constants.CaptionFontSizeFactor);
        this.caption.style('font-size', fontSize);
    }

    private setCaptionText(text: string): void {
        this.caption?.text(text);
    }

    // End: Caption

    // Path - it shows up when some data points are selected

    private initPaths(mainSvgElement: d3Selection<SVGSVGElement, undefined, null, undefined>): void {
        this.pathLinesContainer = mainSvgElement
            .append('g')
            .attr('display', 'none');
        this.pathCirclesContainer = mainSvgElement
            .append('g')
            .attr('display', 'none');
    }

    private renderPathContainers(update: PlayAxisUpdateData) {
        // rendering containers for the paths which are displayed when some dataPoints are selected
        const transform: string = svgTranslate(
            update.visualMargin.left + update.axesSize.yAxisWidth + update.yTickOffset,
            update.visualMargin.top,
        );
        this.pathLinesContainer?.attr('transform', transform);
        this.pathCirclesContainer?.attr('transform', transform);
    }

    private updatePathOwners(): VisualDataPoint[] {
        if (!this.selectedItems) {
            return [];
        }

        // updating selected points' data and returning those of them that have a path
        const pathOwners: VisualDataPoint[] = [];
        this.selectedItems.each((selected: VisualDataPoint) => {
            if (!this.axes) {
                return;
            }

            // building the path
            selected.entirePath = this.getDataPointPathArray(selected);

            if (selected.entirePath.length > 1) {
                // building the distances array for the lines animation
                selected.pathDistances = [];
                let lastPoint: VisualDataPoint | undefined = undefined;
                for (let i: number = 0; i < selected.entirePath.length; i++) {
                    if (!selected.entirePath[i]) {
                        continue;
                    }

                    if (!lastPoint) {
                        lastPoint = selected.entirePath[i];
                        continue;
                    }

                    selected.pathDistances[i] = PlayAxis.getDistanceBetweenTwoPoints(
                        this.axes,
                        lastPoint,
                        selected.entirePath[i],
                    );

                    lastPoint = selected.entirePath[i];
                }

                pathOwners.push(selected);
            }
        });

        return pathOwners;
    }

    private getDataPointPathArray(selectedDataPoint: VisualDataPoint): VisualDataPoint[] {
        if (!this.groupedDataPoints) {
            return [];
        }

        return (
            PlayAxis.buildPath(this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByBoth)
            // || PlayAxis.buildPath( this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByCategory )
            // || PlayAxis.buildPath( this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByLegend )
            || []
        );
    }

    private static buildPath(
        groupedDataPoints: VisualDataPoint[][],
        selectedDataPoint: VisualDataPoint,
        pathBuildingMode: PathBuildingMode,
    ): VisualDataPoint[] | null {
        const filteringFunction: (d: VisualDataPoint) => boolean = PlayAxis.getPathFilteringFunction(pathBuildingMode, selectedDataPoint);

        const path: VisualDataPoint[] = [];
        for (let i: number = 0; i < groupedDataPoints.length; i++) {
            const grouppedBy = groupedDataPoints[i][0].playAxisValue;

            if (selectedDataPoint.playAxisValue === grouppedBy) {
                // forcing the selected element to be presented in the path
                path[i] = selectedDataPoint;
                continue;
            }

            const groupDataPoints: VisualDataPoint[] = groupedDataPoints[i];

            const filtered: VisualDataPoint[] = groupDataPoints.filter(filteringFunction);

            // adding only the first suiting data point to the path
            if (filtered[0]) {
                path[i] = filtered[0];
            }
        }

        const definedPathElements: VisualDataPoint[] = path.filter((d: VisualDataPoint) => d != null);

        // returning only the paths which contain elements except the selected element itself
        return definedPathElements.length > 1 ? path : null;
    }

    private static getPathFilteringFunction(pathBuildingMode: PathBuildingMode, selectedDataPoint: VisualDataPoint): (d: VisualDataPoint) => boolean {
        const selectedDataPointCategory = selectedDataPoint.formattedCategory();

        switch (pathBuildingMode) {
            case PathBuildingMode.ByBoth:
                return (d: VisualDataPoint) =>
                    d.formattedCategory() === selectedDataPointCategory
                    && d.columnGroup.name === selectedDataPoint.columnGroup.name;
            case PathBuildingMode.ByCategory:
                return (d: VisualDataPoint) => d.formattedCategory() === selectedDataPointCategory;
            case PathBuildingMode.ByLegend:
                return (d: VisualDataPoint) => d.columnGroup.name === selectedDataPoint.columnGroup.name;
        }
    }

    private renderPaths(pathOwners: VisualDataPoint[] | null, transition?: boolean, resizeEvent?: boolean): void {
        // updating pathOwners (or using saved ones if not provided) and rendering according to their data
        this.pathOwners = pathOwners || this.pathOwners;
        if (!this.pathOwners) {
            return;
        }

        if (this.pathOwners.length === 0) {
            this.removePaths();
            return;
        }

        this.renderPathLines(transition, resizeEvent);
        this.renderPathCircleGroups(transition);
    }

    private removePaths(): void {
        this.pathOwners = [];

        this.pathLinesContainer?.attr('display', 'none').transition(); // using 'transition' method for stopping the animation immediately
        this.pathCirclesContainer?.attr('display', 'none').transition(); // using 'transition' method for stopping the animation immediately

        this.pathLinesContainer?.selectAll('*').remove();
        this.pathCirclesContainer?.selectAll('*').remove();
    }

    private renderPathLines(transition: boolean = false, resizeEvent: boolean = false): void {
        if (!this.pathLinesContainer) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.addLackingSVGPathElements();
        this.removeExcessSVGPathElements();

        const paths = this.pathLinesContainer.selectAll<SVGPathElement, VisualDataPoint>('path');

        this.pathLinesContainer.attr('display', '');

        paths.each(function (datum) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const pathEl = this;
            self.renderPathLine(pathEl, datum, transition, resizeEvent);
        });
    }

    private renderPathLine(pathEl: SVGElement, datum: VisualDataPoint, transition: boolean, resizeEvent: boolean): void {
        if (datum.pathDistances == undefined || datum.fill == undefined || this.currentGroupIndex == undefined || !this.axes || !this.visualSize) {
            return;
        }

        const d3_pathEl = d3select(pathEl);

        // Making this value a little bit greater. By this, we avoid some rendering bugs
        const pathLength: number = PlayAxis.getEntirePathLength(datum.pathDistances) + Constants.PathLengthReserve;

        const dashOffset: number = PlayAxis.getPathDashOffset(datum, pathLength, this.currentGroupIndex);

        if (!pathEl.hasAttribute('d') || resizeEvent) {
            const dAttr: string = PlayAxis.buildDAttribute(this.axes, datum, this.visualSize);
            d3_pathEl.attr('stroke-dasharray', pathLength)
                .attr('stroke-dashoffset', pathLength)
                .attr('d', dAttr)
                .attr('stroke', datum.fill)
                .attr('display', '');
        }

        if (transition) {
            d3_pathEl.transition()
                .duration(Constants.PathDrawingDuration)
                .ease(d3easeLinear)
                .attr('stroke-dashoffset', dashOffset);
        } else {
            d3_pathEl.attr('stroke-dashoffset', dashOffset);
        }
    }

    private removeExcessSVGPathElements(): void {
        if (!this.scatterSelect) {
            return;
        }

        this.scatterSelect.each(function (d: VisualDataPoint) {
            if (!d.selected && d.pathElement) {
                d.pathElement.remove();
                d.pathElement = <any>null;
            }
        });
    }

    private addLackingSVGPathElements(): void {
        if (!this.pathOwners || !this.pathLinesContainer) {
            return;
        }

        for (let i: number = 0; i < this.pathOwners.length; i++) {
            const pathOwner: VisualDataPoint = this.pathOwners[i];

            if (!pathOwner.pathElement || !pathOwner.pathElement.parentNode) {
                const d3_pathElement = this.pathLinesContainer.append('path').attr('class', Constants.PathLineClassName);
                d3_pathElement.datum(pathOwner);
                pathOwner.pathElement = d3_pathElement.node() as SVGElement;
            }
        }
    }

    private renderPathCircleGroups(transition?: boolean) {
        if (!this.pathCirclesContainer || !this.pathOwners) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self: PlayAxis = this;

        const groups = this.pathCirclesContainer.selectAll('g').data(this.pathOwners);
        groups.enter().append('g');
        groups.exit().remove();

        this.pathCirclesContainer.attr('display', '');

        groups.each(function (datum) {
            if (!datum.entirePath) {
                return;
            }

            const group = d3select(this);
            // slicing path so it doesn't go farther than current category
            const slicedPath = datum.entirePath.filter((d: VisualDataPoint, i: number) => i <= <number>self.currentGroupIndex);

            const circles = group.selectAll('circle').data(slicedPath);

            circles.enter().append('circle');
            circles.exit().remove();

            self.renderPathCircles(circles, transition);
        });
    }

    private renderPathCircles(circles: d3Selection<BaseType, VisualDataPoint, BaseType, unknown>, transition: boolean = false): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self: PlayAxis = this;
        circles.each(function (d: VisualDataPoint) {
            const circle = d3select<BaseType, VisualDataPoint>(this);

            let opacity: number, display: string;
            if (d.selected && d.playAxisValue === self.getCurrentPlayAxisValue()) {
                opacity = 0;
                display = 'none';
            } else {
                opacity = 1;
                display = '';

                circles
                    .classed(Constants.PathCircleClassName, true)
                    .attr('r', Constants.PathCircleRadius)
                    .attr('cx', (d: VisualDataPoint) => d.x ? self.axes?.x.scale(d.x) : <number>self.visualSize?.width / 2)
                    .attr('cy', (d: VisualDataPoint) => d.y ? self.axes?.y.scale(d.y) : <number>self.visualSize?.height / 2)
                    .style('stroke', () => d.fill ?? null);

                // adding tooltip
                bindTooltip(self.tooltipServiceWrapper, circle);
            }

            if (transition) {
                circle.attr('display', display)
                    .transition()
                    .duration(Constants.PathDrawingDuration)
                    .style('opacity', opacity);
            } else {
                circle.attr('display', display)
                    .style('opacity', opacity);
            }
        });
    }

    private static buildDAttribute(axes: IAxes, selectedDataPoint: VisualDataPoint, visualSize: ISize): string {
        // building 'd' attribute for the 'path' element

        const path = selectedDataPoint.entirePath;

        let dAttr: string = '';
        if (!path) {
            return dAttr;
        }

        for (let i: number = 0, lastPointIndex: number = -1; i < path.length; i++) {
            if (!path[i]) {
                continue;
            }

            const x: number = path[i].x ? axes.x.scale(path[i].x) : visualSize.width / 2;
            const y: number = path[i].y ? axes.y.scale(path[i].y) : visualSize.height / 2;

            if (lastPointIndex === -1) {
                lastPointIndex = i;
                dAttr += `M${x}, ${y}`;
                continue;
            }

            dAttr += `L${x} ${y}`;
        }

        return dAttr;
    }

    private static getEntirePathLength(pathDistances: number[]): number {
        let l: number = 0;
        for (let i: number = 0; i < pathDistances.length; i++) {
            if (pathDistances[i]) {
                l += pathDistances[i];
            }
        }

        return l;
    }

    private static getPathDashOffset(datum: VisualDataPoint, pathLength: number, currentGroupIndex: number): number {
        let slicedPathLength: number = 0;
        if (datum.pathDistances) {
            for (let i: number = 0; i <= currentGroupIndex; i++) {
                if (datum.pathDistances[i]) {
                    slicedPathLength += datum.pathDistances[i];
                }
            }
        }

        return pathLength - slicedPathLength;
    }

    private static getDistanceBetweenTwoPoints(axes: IAxes, a: VisualDataPoint, b: VisualDataPoint): number {
        // Calculating the distance between the centers of two circles.
        // Using the mathematical formula for this.

        return Math.sqrt(
            (axes.x.scale(b.x) - axes.x.scale(a.x)) ** 2
            + (axes.y.scale(b.y) - axes.y.scale(a.y)) ** 2,
        );
    }

    // End: Path

    // Utils

    private getCurrentPlayAxisValue(): PrimitiveValue | undefined {
        if (!this.groupedDataPoints || !this.currentGroupIndex) {
            return undefined;
        }

        return this.groupedDataPoints[this.currentGroupIndex][0]?.playAxisValue;
    }

    private static getFormattedGroupNames(groupedDataPoints: VisualDataPoint[][], valuesType: PlayAxisValueType): string[] {
        // We get an array of values by which the grouping takes place.
        // These values are displayed on the play axis.

        const names: string[] = [];
        for (let i: number = 0; i < groupedDataPoints.length; i++) {
            const name = PlayAxis.formatValue(groupedDataPoints[i][0].playAxisValue, valuesType);
            names.push(name);
        }

        return names;
    }

    private static formatValue(value: PrimitiveValue | undefined, valueType): string {
        // formatting the value depending on its type
        if (value == undefined) {
            return '';
        }

        switch (valueType) {
            case PlayAxisValueType.Date:
                return new Date(value.toString()).toLocaleDateString('en-US');
            case PlayAxisValueType.Number:
                return value.toString();
            default:
                return value.toString();
        }
    }

    private static getMeasures(update: PlayAxisUpdateData): PlayAxisMeasures {
        // getting the box which contains play axis elements

        return {
            top: update.visualMargin.top
                + update.visualSize.height
                + update.axesSize.xAxisHeight
                + update.xTickOffset
                + Constants.MarginTop,
            left: update.visualMargin.left,
            width: update.viewport.width - update.visualMargin.left - update.visualMargin.right,
            height: Constants.Height,
        };
    }

    private static getValuesType(dataPoints: VisualDataPoint[]): PlayAxisValueType {
        // we determine the type basing on all values

        let valuesType: PlayAxisValueType;

        // firstly we check if the values are numbers
        valuesType = PlayAxisValueType.Number;
        for (let i: number = 0; i < dataPoints.length; i++) {
            if (isNaN(+<PrimitiveValue>dataPoints[i].playAxisValue)) {
                valuesType = PlayAxisValueType.String;
                break;
            }
        }

        // if not we check for the dates
        if (valuesType !== PlayAxisValueType.Number) {
            valuesType = PlayAxisValueType.Date;
            for (let i: number = 0; i < dataPoints.length; i++) {
                if (isNaN(Date.parse(dataPoints[i].playAxisValue?.toString() ?? ''))) {
                    valuesType = PlayAxisValueType.String;
                    break;
                }
            }
        }

        return valuesType;
    }

    private static buildGroupedDataPoints(dataPoints: VisualDataPoint[], valuesType: PlayAxisValueType): VisualDataPoint[][] {
        // grouping dataPoints by their playAxisValue
        const groups: VisualDataPoint[][] = [];
        for (let i: number = 0; i < dataPoints.length; i++) {
            const groupingValue = dataPoints[i].playAxisValue;

            const groupIndex: number = PlayAxis.getGroupIndexByGroupingValue(groups, groupingValue);

            let group: VisualDataPoint[];

            if (groupIndex === -1) {
                group = [];
                groups.push(group);
            } else {
                group = groups[groupIndex];
            }

            group.push(dataPoints[i]);
        }

        // sorting ascending
        switch (valuesType) {
            // checking if group names are dates
            case PlayAxisValueType.Date:
                return groups.sort((a: VisualDataPoint[], b: VisualDataPoint[]) =>
                    new Date(a[0].playAxisValue?.toString() ?? '')
                    > new Date(b[0].playAxisValue?.toString() ?? '')
                        ? 1 : -1,
                );
            // checking if group names are numbers
            case PlayAxisValueType.Number:
                return groups.sort((a, b) =>
                    +<PrimitiveValue>a[0].playAxisValue
                    > +<PrimitiveValue>b[0].playAxisValue
                        ? 1 : -1,
                );
        }

        return (
            // trying to sort as month strings
            PlayAxis.sortGroupsByMonth(groups)
            // otherwise just sorting as strings
            || groups.sort((a, b) => <PrimitiveValue>a[0].playAxisValue > <PrimitiveValue>b[0].playAxisValue ? 1 : -1)
        );
    }

    private static sortGroupsByMonth(groups: VisualDataPoint[][]): VisualDataPoint[][] | null {
        // if first value is not a month we don't do anything here
        if (Constants.Months.indexOf(groups[0][0].playAxisValue as string) === -1) {
            return null;
        }

        let sort: boolean = true;

        const result: VisualDataPoint[][] = groups.sort((a, b) => {
            if (!sort) {
                return 1;
            }

            const indexA: number = Constants.Months.indexOf(a[0].playAxisValue as string);
            const indexB: number = Constants.Months.indexOf(b[0].playAxisValue as string);

            // if we find that one of the values is not a month we don't do the excess work here
            if (indexA === -1 || indexB === -1) {
                sort = false;
            }

            return indexA - indexB;
        });

        return sort ? result : null;
    }

    private static getGroupIndexByGroupingValue(groupsArray: VisualDataPoint[][], groupingValue: PrimitiveValue | undefined): number {
        for (let i: number = 0; i < groupsArray.length; i++) {
            if (groupingValue === groupsArray[i][0].playAxisValue) {
                return i;
            }
        }

        return -1;
    }

    // End: Utils
}
