import {BaseType, Selection as d3Selection} from 'd3-selection';
import {ITooltipServiceWrapper} from 'powerbi-visuals-utils-tooltiputils';
import {VisualDataPoint} from './visualInterfaces';

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
//     private visualSize: ISize;
    private groupedDataPoints: VisualDataPoint[][];
//     private groupNames: string[];
//     private currentGroupIndex: number;
//     private valuesType: PlayAxisValueType;
//
    // slider
    private sliderEl: HTMLElement | undefined = undefined;
    // private $sliderEl: JQuery;

    // axis
    private axisGroup: d3Selection<null, undefined, null, undefined> | undefined = undefined;

    // play button
    private playButtonEl: d3Selection<null, undefined, null, undefined> | undefined = undefined;
//     private playButtonTimer: number;
//
//     // caption
    private captionGroup: d3Selection<null, undefined, null, undefined> | undefined = undefined;
//     private caption: d3.Selection<SVGElement>;
//
//     // visual
//     private axes: IAxes;
//     private scatterSelect: d3.Selection<any>;
//     private selectedItems: d3.Selection<any>;
//
//     // path
//     private pathOwners: VisualDataPoint[];
//     private pathLinesContainer: d3.Selection<any>;
//     private pathCirclesContainer: d3.Selection<any>;

    // tooltip
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(
        mainElement: HTMLElement,
        mainSvgElement: d3Selection<SVGSVGElement, unknown, null, undefined>,
        tooltipServiceWrapper: ITooltipServiceWrapper) {
        this.tooltipServiceWrapper = tooltipServiceWrapper;

        // slider
        this.initSlider(mainElement);

        // // axis
        // this.createAxisContainer(mainSvgElement);
        //
        // // play button
        // this.initPlayButton(mainElement);
        //
        // // caption
        // this.createCaptionElements(mainSvgElement);
        //
        // // paths
        // this.initPaths(mainSvgElement);
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

        // // showing all the dataPoints
        // if (this.scatterSelect) {
        //     this.scatterSelect.style({
        //         display: '',
        //         opacity: '',
        //     });
        // }
        //
        // this.stopAutoPlay();
        //
        // this.removePaths();

        this.enabled = false;
    }

//     isEnabled(): boolean {
//         return this.enabled;
//     }

    getHeight(): number {
        // getting the space needed for rendering the playAxis elements
        return this.enabled ? Constants.MarginTop + Constants.Height : 0;
    }

    onSelect(currentSelection: d3Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>, transition: boolean): void {
        // this method is called when any of data points are being selected or deselected
        if (!this.enabled || !this.groupedDataPoints) {
            return;
        }

        // this.selectedItems = currentSelection;
        //
        // this.stopAutoPlay();
        //
        // const pathOwners: VisualDataPoint[] = this.updatePathOwners();
        //
        // this.renderPaths(pathOwners, transition);
    }

//     // End: Public
//
//     // Update
//
//     update(update: PlayAxisUpdateData): void {
//         this.updateProps(update);
//
//         this.stopAutoPlay();
//
//         this.render(update);
//     }
//
//     private updateProps(update: PlayAxisUpdateData): void {
//         this.scatterSelect = update.scatterSelect;
//         this.axes = update.axes;
//
//         this.valuesType = PlayAxis.getValuesType(update.dataPoints);
//
//         this.groupedDataPoints = PlayAxis.buildGroupedDataPoints(update.dataPoints, this.valuesType);
//
//         this.groupNames = PlayAxis.getFormattedGroupNames(this.groupedDataPoints, this.valuesType);
//     }
//
//     private render(update: PlayAxisUpdateData): void {
//         this.visualSize = update.visualSize;
//
//         const measures: PlayAxisMeasures = PlayAxis.getMeasures(update);
//
//         this.renderAxis(update, measures);
//
//         this.renderPlayButton(update, measures);
//
//         this.renderCaption(update);
//
//         this.renderSlider(update, measures, this.groupedDataPoints.length - 1);
//
//         this.slice(this.currentGroupIndex, false);
//
//         this.renderPathContainers(update);
//
//         if (update.updateType === VisualUpdateType.Resize || update.updateType === Visual.ResizeEndCode) {
//             // on resize we just redraw the existing paths
//             this.renderPaths(null, false, true);
//         } else {
//             // in other case we remove all the paths
//             this.removePaths();
//         }
//     }
//
//     // End: Update
//
//     // Visual
//
//     private slice(groupIndex: number, transition?: boolean) {
//         // Slicing data points respective to the provided group index.
//         // It means - showing circles of this group and hiding all other circles.
//         // Also setting the group caption.
//
//         const group: VisualDataPoint[] = this.groupedDataPoints[groupIndex];
//
//         this.scatterSelect.each(function (d: VisualDataPoint) {
//             const el: d3.Selection<any> = d3.select(this);
//             if (d.playAxisValue === group[0].playAxisValue) {
//                 d.isShown = true;
//                 el.style('display', '');
//                 if (transition) {
//                     el.transition().duration(Constants.SlicingDuration).style('opacity', 1);
//                 } else {
//                     el.style('opacity', 1);
//                 }
//             } else {
//                 d.isShown = false;
//                 if (transition) {
//                     el.transition().duration(Constants.SlicingDuration).style('opacity', 0).each('end', function () {
//                         el.style('display', 'none');
//                     });
//                 } else {
//                     el.style({
//                         opacity: 0,
//                         display: 'none'
//                     });
//                 }
//             }
//         });
//
//         const captionValue: string = PlayAxis.formatValue(group[0].playAxisValue, this.valuesType);
//         this.setCaptionText(captionValue);
//     }
//
//     // End: Visual

    // Slider
    // Slider is the main thing here which controls the state

    private initSlider(mainElement: HTMLElement): void {
        // Changing the jQuery's global setting
        // $.easing._default = 'linear' as any;

        // this.sliderEl = document.createElement('div');
        // this.sliderEl.style.display = 'none';
        // this.$sliderEl = $(this.sliderEl).attr({
        //     id: 'playAxisSlider',
        //     class: 'playAxisSlider'
        // });
        //
        // // Creating jQuery UI Slider
        // // Demo: https://jqueryui.com/slider/
        // // API: http://api.jqueryui.com/slider/
        // const jqueryUiSliderParams = {
        //     min: 0,
        //     max: 1,
        //     value: 0,
        //     animate: Constants.Slider.AnimationDuration,
        //     slide: (e, ui) => {
        //         this.currentGroupIndex = ui.value;
        //         this.onSlide(+ui.value);
        //     },
        //     change: (e, ui) => {
        //         this.currentGroupIndex = ui.value;
        //         this.onChange(+ui.value);
        //     }
        // };
        // this.$sliderEl
        //     .css('height', Constants.Slider.Height)
        //     .appendTo(mainElement)
        //     .slider(jqueryUiSliderParams);
    }

//     private renderSlider(update: PlayAxisUpdateData, measures: PlayAxisMeasures, maxValue: number): void {
//         this.$sliderEl.css({
//             top: measures.top
//                 + (
//                     update.legendPosition === LegendPosition.Top
//                         || update.legendPosition === LegendPosition.TopCenter
//                         ? update.legendSize.height : 0
//                 ),
//             left: measures.left
//                 + (
//                     update.legendPosition === LegendPosition.Left
//                         || update.legendPosition === LegendPosition.LeftCenter
//                         ? update.legendSize.width : 0
//                 )
//                 + Constants.PlayButton.Space
//                 - Constants.Slider.BorderWidth,
//             width: measures.width
//                 - Constants.PlayButton.Space
//                 - (
//                     update.legendPosition === LegendPosition.Right
//                         || update.legendPosition === LegendPosition.RightCenter
//                         || update.legendPosition === LegendPosition.Left
//                         || update.legendPosition === LegendPosition.LeftCenter
//                         ? update.legendSize.width : 0
//                 )
//                 + Constants.Slider.BorderWidth * 2 // considering left and right border
//         });
//
//         if (update.updateType !== VisualUpdateType.Resize && update.updateType !== Visual.ResizeEndCode) {
//             this.$sliderEl.slider('option', {
//                 min: 0,
//                 max: maxValue,
//                 value: maxValue
//             });
//         }
//     }
//
//     private onSlide(index: number): void {
//         this.stopAutoPlay();
//         this.slice(index, true);
//         this.renderPaths(null, true);
//     }
//
//     private onChange(index: number): void {
//         this.slice(index, true);
//     }
//
//     // End: Slider
//
//     // Axis
//
//     private createAxisContainer(mainSvgElement: d3.Selection<any>): void {
//         this.axisGroup = mainSvgElement.append('g').style('display', 'none').attr({
//             id: 'playAxis',
//             class: 'playAxis'
//         });
//     }
//
//     private renderAxis(update: PlayAxisUpdateData, measures: PlayAxisMeasures): void {
//         this.axisGroup.attr('transform', svg.translate(
//             measures.left + Constants.PlayButton.Space,
//             measures.top + (Constants.Height - Constants.Axis.Height)
//         ));
//
//         const pixelSpan: number = measures.width
//             - Constants.PlayButton.Space
//             - (
//                 update.legendPosition === LegendPosition.Left
//                     || update.legendPosition === LegendPosition.LeftCenter
//                     || update.legendPosition === LegendPosition.Right
//                     || update.legendPosition === LegendPosition.RightCenter
//                     ? update.legendSize.width : 0
//             );
//         const xAxisProperties = createAxis({
//             pixelSpan,
//             dataDomain: this.groupNames as any[],
//             metaDataColumn: update.metadataColumn,
//             formatString: valueFormatter.getFormatStringByColumn(update.metadataColumn),
//             outerPadding: 0,
//             innerPadding: 0,
//             isCategoryAxis: true,
//             useRangePoints: true
//         });
//         xAxisProperties.axis
//             .innerTickSize(Constants.Axis.InnerTickSize)
//             .tickPadding(Constants.Axis.TickPadding)
//             .tickValues(this.groupNames);
//
//         this.axisGroup.call(xAxisProperties.axis);
//
//         // doing some fixes after the rendering
//         const labelsMap = PlayAxis.getAxisLabelsMap(this.groupNames, pixelSpan);
//         PlayAxis.formatTicksAndLabels(this.axisGroup, labelsMap);
//     }
//
//     private static formatTicksAndLabels(axisGroup: d3.Selection<any>, labelsMap: boolean[]): void {
//         // 1. Normalizing labels so they don't overlap each other
//         // 2. Ticks that have a visible label, we make two times higher
//
//         axisGroup.selectAll('.tick').each(function (d, i) {
//             const tick: d3.Selection<SVGGElement> = d3.select(this);
//             const line: d3.Selection<any> = tick.select('line');
//             if (labelsMap[i]) {
//                 tick.classed(Constants.Axis.BigTickClass, true);
//                 line.attr('y2', Constants.Axis.InnerTickSize * 2);
//             } else {
//                 tick.classed(Constants.Axis.BigTickClass, false);
//                 line.attr('y2', Constants.Axis.InnerTickSize);
//             }
//         });
//     }
//
//     private static getAxisLabelsMap(groupNames: string[], pixelSpan: number): boolean[] {
//         // Determining which ticks have to be rendered with no label
//         // and which ticks have to be rendered with label and more bright color.
//         // Mapping values are: null and true respectively.
//
//         const textProperties: interfaces.TextProperties = {
//             fontFamily: Visual.DefaultFontFamily,
//             fontSize: Constants.FontSize.toString()
//         };
//
//         const labelsWidths: number[] = [];
//         for (let i: number = 0; i < groupNames.length; i++) {
//             const width: number = textMeasurementService.measureSvgTextWidth(textProperties, groupNames[i]) + Constants.Axis.LabelsMargin;
//             labelsWidths.push(width);
//         }
//
//         const maxLabelWidth: number = Math.max(...labelsWidths);
//         const capacity: number = Math.floor(pixelSpan / maxLabelWidth);
//         const factor: number = Math.ceil(groupNames.length / capacity); // determining the factor for axis dividing
//
//         const map: boolean[] = [];
//         for (let i: number = 0; i < groupNames.length; i++) {
//             if (i % factor === 0) {
//                 map[i] = true;
//             }
//         }
//
//         return map;
//     }
//
//     // End: Axis
//
//     // Play button
//
//     private initPlayButton(mainElement): void {
//         this.playButtonEl = d3.select(mainElement).append('button').style('display', 'none').attr({
//             id: 'playButton',
//             class: 'playButton'
//         });
//
//         this.playButtonEl.on('click', () => {
//             if (this.playButtonTimer) {
//                 this.stopAutoPlay();
//             } else {
//                 this.startAutoPlay();
//             }
//         });
//     }
//
//     private renderPlayButton(update, measures: PlayAxisMeasures): void {
//         this.playButtonEl.style({
//             top: measures.top
//                 + (update.legendPosition === LegendPosition.Top || update.legendPosition === LegendPosition.TopCenter ? update.legendSize.height : 0)
//                 + Constants.PlayButton.MarginTop + 'px',
//             left: measures.left
//                 + (update.legendPosition === LegendPosition.Left || update.legendPosition === LegendPosition.LeftCenter ? update.legendSize.width : 0)
//                 + 'px'
//         });
//     }
//
//     private startAutoPlay(): void {
//         this.playButtonEl.classed(Constants.PlayButton.PlayingClass, true);
//
//         if (this.$sliderEl.slider('value') === this.groupedDataPoints.length - 1) {
//             this.setGroupByIndex(0);
//         } else {
//             this.setNextGroup();
//         }
//
//         this.setAutoPlayTimeout();
//     }
//
//     private setAutoPlayTimeout() {
//         this.playButtonTimer = setTimeout(
//             () => {
//                 if (this.$sliderEl.slider('value') >= this.groupedDataPoints.length - 1) {
//                     this.stopAutoPlay();
//                     return;
//                 }
//                 this.setNextGroup();
//                 this.setAutoPlayTimeout();
//             },
//             Constants.PlayButton.TimeInterval
//         );
//     }
//
//     private stopAutoPlay(): void {
//         this.playButtonEl.classed(Constants.PlayButton.PlayingClass, false);
//         clearTimeout(this.playButtonTimer);
//         this.playButtonTimer = null;
//     }
//
//     private setGroupByIndex(index: number): void {
//         // when slider value changes slider launches the 'change' callback
//         this.$sliderEl.slider('value', index);
//
//         this.renderPaths(null, true);
//     }
//
//     private setNextGroup(): void {
//         let nextIndex: number = this.$sliderEl.slider('value') + 1;
//
//         if (nextIndex >= this.groupedDataPoints.length) {
//             this.stopAutoPlay();
//         } else {
//             this.setGroupByIndex(nextIndex);
//         }
//     }
//
//     // End: Play button
//
//     // Caption
//
//     private createCaptionElements(mainSvgElement: d3.Selection<any>): void {
//         this.captionGroup = mainSvgElement.append('g').style('display', 'none').attr({
//             id: 'playCaption',
//             class: 'playCaption'
//         });
//         this.caption = this.captionGroup.append('text');
//     }
//
//     private renderCaption(update: PlayAxisUpdateData) {
//         // rendering empty caption, the text will be set later by the 'slice' method
//
//         const x: number = update.viewport.width
//             - (update.legendPosition === LegendPosition.Right
//                 || update.legendPosition === LegendPosition.RightCenter
//                 || update.legendPosition === LegendPosition.Left
//                 || update.legendPosition === LegendPosition.LeftCenter
//                 ? update.legendSize.width : 0)
//             - update.visualMargin.right
//             - update.axesSize.yAxisWidth
//             - Constants.Caption.PaddingRight;
//
//         const y: number = update.visualMargin.top;
//
//         this.captionGroup.attr('transform', `translate(${x}, ${y})`);
//
//         const fontSize = Math.min(Constants.Caption.FontSize.MaxValue, update.viewport.height / Constants.Caption.FontSize.Factor);
//         this.caption.style('font-size', fontSize);
//     }
//
//     private setCaptionText(text: string): void {
//         this.caption.text(text);
//     }
//
//     // End: Caption
//
//     // Path - it shows up when some data points are selected
//
//     private initPaths(mainSvgElement: d3.Selection<SVGElement>): void {
//         this.pathLinesContainer = mainSvgElement.append('g').attr('display', 'none');
//         this.pathCirclesContainer = mainSvgElement.append('g').attr('display', 'none');
//     }
//
//     private renderPathContainers(update: PlayAxisUpdateData) {
//         // rendering containers for the paths which are displayed when some dataPoints are selected
//
//         const transform: string = svg.translate(
//             update.visualMargin.left + update.axesSize.yAxisWidth + update.yTickOffset,
//             update.visualMargin.top
//         );
//         this.pathLinesContainer.attr('transform', transform);
//         this.pathCirclesContainer.attr('transform', transform);
//     }
//
//     private updatePathOwners(): VisualDataPoint[] {
//         // updating selected points' data and returning those of them that have a path
//
//         const pathOwners: VisualDataPoint[] = [];
//         this.selectedItems.each((selected: VisualDataPoint) => {
//             // building the path
//             selected.entirePath = this.getDataPointPathArray(selected);
//
//             if (selected.entirePath.length > 1) {
//                 // building the distances array for the lines animation
//
//                 selected.pathDistances = [];
//                 for (let i: number = 0, lastPoint: VisualDataPoint; i < selected.entirePath.length; i++) {
//                     if (!selected.entirePath[i]) {
//                         continue;
//                     }
//
//                     if (!lastPoint) {
//                         lastPoint = selected.entirePath[i];
//                         continue;
//                     }
//
//                     selected.pathDistances[i] = PlayAxis.getDistanceBetweenTwoPoints(
//                         this.axes,
//                         lastPoint,
//                         selected.entirePath[i]
//                     );
//
//                     lastPoint = selected.entirePath[i];
//                 }
//
//                 pathOwners.push(selected);
//             }
//         });
//
//         return pathOwners;
//     }
//
//     private getDataPointPathArray(selectedDataPoint: VisualDataPoint): VisualDataPoint[] {
//         return (
//             PlayAxis.buildPath(this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByBoth)
//             // || PlayAxis.buildPath( this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByCategory )
//             // || PlayAxis.buildPath( this.groupedDataPoints, selectedDataPoint, PathBuildingMode.ByLegend )
//             || []
//         );
//     }
//
//     private static buildPath(
//         groupedDataPoints: VisualDataPoint[][],
//         selectedDataPoint: VisualDataPoint,
//         pathBuildingMode: PathBuildingMode
//     ): VisualDataPoint[] {
//         const filteringFunction: (d: VisualDataPoint) => boolean = PlayAxis.getPathFilteringFunction(pathBuildingMode, selectedDataPoint);
//
//         const path: VisualDataPoint[] = [];
//         for (let i: number = 0; i < groupedDataPoints.length; i++) {
//             const grouppedBy: PrimitiveValue = groupedDataPoints[i][0].playAxisValue;
//
//             if (selectedDataPoint.playAxisValue === grouppedBy) {
//                 // forcing the selected element to be presented in the path
//                 path[i] = selectedDataPoint;
//                 continue;
//             }
//
//             const groupDataPoints: VisualDataPoint[] = groupedDataPoints[i];
//
//             const filtered: VisualDataPoint[] = groupDataPoints.filter(filteringFunction);
//
//             // adding only the first suiting data point to the path
//             if (filtered[0]) {
//                 path[i] = filtered[0];
//             }
//         }
//
//         const definedPathElements: VisualDataPoint[] = path.filter((d: VisualDataPoint) => d != null);
//
//         // returning only the paths which contain elements except the selected element itself
//         return definedPathElements.length > 1 ? path : null;
//     }
//
//     private static getPathFilteringFunction(pathBuildingMode: PathBuildingMode, selectedDataPoint: VisualDataPoint): (d: VisualDataPoint) => boolean {
//         const selectedDataPointCategory: string = selectedDataPoint.formattedCategory();
//
//         switch (pathBuildingMode) {
//             case PathBuildingMode.ByBoth:
//                 return (d: VisualDataPoint) =>
//                     d.formattedCategory() === selectedDataPointCategory
//                     && d.columnGroup.name === selectedDataPoint.columnGroup.name;
//             case PathBuildingMode.ByCategory:
//                 return (d: VisualDataPoint) => d.formattedCategory() === selectedDataPointCategory;
//             case PathBuildingMode.ByLegend:
//                 return (d: VisualDataPoint) => d.columnGroup.name === selectedDataPoint.columnGroup.name;
//         }
//     }
//
//     private renderPaths(pathOwners?: VisualDataPoint[], transition?: boolean, resizeEvent?: boolean): void {
//         // updating pathOwners (or using saved ones if not provided) and rendering according to their data
//
//         this.pathOwners = pathOwners || this.pathOwners;
//
//         if (this.pathOwners.length === 0) {
//             this.removePaths();
//             return;
//         }
//
//         this.renderPathLines(transition, resizeEvent);
//         this.renderPathCircleGroups(transition);
//     }
//
//     private removePaths(): void {
//         this.pathOwners = [];
//
//         this.pathLinesContainer.attr('display', 'none').transition(); // using 'transition' method for stopping the animation immediately
//         this.pathCirclesContainer.attr('display', 'none').transition(); // using 'transition' method for stopping the animation immediately
//
//         this.pathLinesContainer.selectAll('*').remove();
//         this.pathCirclesContainer.selectAll('*').remove();
//     }
//
//     private renderPathLines(transition?: boolean, resizeEvent?: boolean): void {
//         const self: PlayAxis = this;
//
//         this.addLackingSVGPathElements();
//         this.removeExcessSVGPathElements();
//
//         const paths: d3.Selection<any> = this.pathLinesContainer.selectAll('path');
//
//         this.pathLinesContainer.attr('display', '');
//
//         paths.each(function (datum: VisualDataPoint) {
//             const pathEl: SVGElement = this;
//             self.renderPathLine(pathEl, datum, transition, resizeEvent);
//         });
//     }
//
//     private renderPathLine(pathEl: SVGElement, datum: VisualDataPoint, transition: boolean, resizeEvent: boolean): void {
//         const d3_pathEl: d3.Selection<any> = d3.select(pathEl);
//
//         // Making this value a little bit greater. By this, we avoid some rendering bugs
//         const pathLength: number = PlayAxis.getEntirePathLength(datum.pathDistances) + Constants.Path.LengthReserve;
//
//         let dashOffset: number = PlayAxis.getPathDashOffset(datum, pathLength, this.currentGroupIndex);
//
//         if (!pathEl.hasAttribute('d') || resizeEvent) {
//             const dAttr: string = PlayAxis.buildDAttribute(this.axes, datum, this.visualSize);
//             d3_pathEl.attr({
//                 'stroke-dasharray': pathLength,
//                 'stroke-dashoffset': pathLength,
//                 d: dAttr,
//                 stroke: datum.fill,
//                 display: ''
//             });
//         }
//
//         if (transition) {
//             d3_pathEl.transition()
//                 .duration(Constants.Path.DrawingDuration)
//                 .ease('linear')
//                 .attr('stroke-dashoffset', dashOffset);
//         } else {
//             d3_pathEl.attr('stroke-dashoffset', dashOffset);
//         }
//     }
//
//     private removeExcessSVGPathElements(): void {
//         this.scatterSelect.each(function (d: VisualDataPoint) {
//             if (!d.selected && d.pathElement) {
//                 d.pathElement.remove();
//                 d.pathElement = null;
//             }
//         });
//     }
//
//     private addLackingSVGPathElements(): void {
//         for (let i: number = 0; i < this.pathOwners.length; i++) {
//             const pathOwner: VisualDataPoint = this.pathOwners[i];
//
//             if (!pathOwner.pathElement || !pathOwner.pathElement.parentNode) {
//                 const d3_pathElement: d3.Selection<any> = this.pathLinesContainer.append('path').attr('class', Constants.Path.LineClassName);
//                 d3_pathElement.datum(pathOwner);
//                 pathOwner.pathElement = d3_pathElement.node() as SVGElement;
//             }
//         }
//     }
//
//     private renderPathCircleGroups(transition?: boolean) {
//         const self: PlayAxis = this;
//
//         const groups: d3.selection.Update<any> = this.pathCirclesContainer.selectAll('g').data(this.pathOwners);
//         groups.enter().append('g');
//         groups.exit().remove();
//
//         this.pathCirclesContainer.attr('display', '');
//
//         groups.each(function (datum: VisualDataPoint) {
//             const group: d3.Selection<any> = d3.select(this);
//             // slicing path so it doesn't go farther than current category
//             const slicedPath = datum.entirePath.filter((d: VisualDataPoint, i: number) => i <= self.currentGroupIndex);
//
//             const circles: d3.selection.Update<any> = group.selectAll('circle').data(slicedPath);
//
//             circles.enter().append('circle');
//             circles.exit().remove();
//
//             self.renderPathCircles(circles, transition);
//         });
//     }
//
//     private renderPathCircles(circles: d3.selection.Update<any>, transition: boolean): void {
//         const self: PlayAxis = this;
//         circles.each(function (d: VisualDataPoint) {
//             let circle: d3.Selection<any> = d3.select(this);
//
//             let opacity: number, display: string;
//
//             if (d.selected && d.playAxisValue === self.getCurrentPlayAxisValue()) {
//                 opacity = 0;
//                 display = 'none';
//             } else {
//                 opacity = 1;
//                 display = '';
//
//                 circles.attr({
//                     class: Constants.Path.Circle.ClassName,
//                     r: Constants.Path.Circle.Radius,
//                     cx: (d: VisualDataPoint) => d.x ? self.axes.x.scale(d.x) : self.visualSize.width / 2,
//                     cy: (d: VisualDataPoint) => d.y ? self.axes.y.scale(d.y) : self.visualSize.height / 2
//                 });
//                 circles.style('stroke', d.fill);
//
//                 // adding tooltip
//                 tooltipBuilder.bindTooltip(self.tooltipServiceWrapper, circle);
//             }
//
//             if (transition) {
//                 circle.attr({ display }).transition().duration(Constants.Path.DrawingDuration).style('opacity', opacity);
//             } else {
//                 circle.attr({ display }).style('opacity', opacity);
//             }
//         });
//     }
//
//     private static buildDAttribute(axes: IAxes, selectedDataPoint: VisualDataPoint, visualSize: ISize): string {
//         // building 'd' attribute for the 'path' element
//
//         const path = selectedDataPoint.entirePath;
//
//         let dAttr: string = '';
//
//         for (let i: number = 0, lastPointIndex: number = -1; i < path.length; i++) {
//             if (!path[i]) {
//                 continue;
//             }
//
//             const x: number = path[i].x ? axes.x.scale(path[i].x) : visualSize.width / 2;
//             const y: number = path[i].y ? axes.y.scale(path[i].y) : visualSize.height / 2;
//
//             if (lastPointIndex === -1) {
//                 lastPointIndex = i;
//                 dAttr += `M${x}, ${y}`;
//                 continue;
//             }
//
//             dAttr += `L${x} ${y}`;
//         }
//
//         return dAttr;
//     }
//
//     private static getEntirePathLength(pathDistances: number[]): number {
//         let l: number = 0;
//         for (let i: number = 0; i < pathDistances.length; i++) {
//             if (pathDistances[i]) {
//                 l += pathDistances[i];
//             }
//         }
//
//         return l;
//     }
//
//     private static getPathDashOffset(datum: VisualDataPoint, pathLength: number, currentGroupIndex: number): number {
//         let slicedPathLength: number = 0;
//         for (let i: number = 0; i <= currentGroupIndex; i++) {
//             if (datum.pathDistances[i]) {
//                 slicedPathLength += datum.pathDistances[i];
//             }
//         }
//
//         const dashOffset: number = pathLength - slicedPathLength;
//
//         return dashOffset;
//     }
//
//     private static getDistanceBetweenTwoPoints(axes: IAxes, a: VisualDataPoint, b: VisualDataPoint): number {
//         // Calculating the distance between the centers of two circles.
//         // Using the mathematical formula for this.
//
//         return Math.sqrt(
//             (axes.x.scale(b.x) - axes.x.scale(a.x)) ** 2
//             + (axes.y.scale(b.y) - axes.y.scale(a.y)) ** 2
//         );
//     }
//
//     // End: Path
//
//     // Utils
//
//     private getCurrentPlayAxisValue(): PrimitiveValue {
//         return this.groupedDataPoints[this.currentGroupIndex][0].playAxisValue;
//     }
//
//     private static getFormattedGroupNames(groupedDataPoints: VisualDataPoint[][], valuesType: PlayAxisValueType): string[] {
//         // We get an array of values by which the grouping takes place.
//         // These values are displayed on the play axis.
//
//         const names: string[] = [];
//         for (let i: number = 0; i < groupedDataPoints.length; i++) {
//             const name = PlayAxis.formatValue(groupedDataPoints[i][0].playAxisValue, valuesType);
//             names.push(name);
//         }
//
//         return names;
//     }
//
//     private static formatValue(value: PrimitiveValue, valueType): string {
//         // formatting the value depending on its type
//
//         switch (valueType) {
//             case PlayAxisValueType.Date:
//                 return new Date(value.toString()).toLocaleDateString("en-US");
//             case PlayAxisValueType.Number:
//                 return value.toString();
//             default:
//                 return value.toString();
//         }
//     }
//
//     private static getMeasures(update: PlayAxisUpdateData): PlayAxisMeasures {
//         // getting the box which contains play axis elements
//
//         return {
//             top: update.visualMargin.top
//                 + update.visualSize.height
//                 + update.axesSize.xAxisHeight
//                 + update.xTickOffset
//                 + Constants.MarginTop,
//             left: update.visualMargin.left,
//             width: update.viewport.width - update.visualMargin.left - update.visualMargin.right,
//             height: Constants.Height
//         };
//     }
//
//     private static getValuesType(dataPoints: VisualDataPoint[]): PlayAxisValueType {
//         // we determine the type basing on all values
//
//         let valuesType: PlayAxisValueType;
//
//         // firstly we check if the values are numbers
//         valuesType = PlayAxisValueType.Number;
//         for (let i: number = 0; i < dataPoints.length; i++) {
//             if (isNaN(+dataPoints[i].playAxisValue)) {
//                 valuesType = PlayAxisValueType.String;
//                 break;
//             }
//         }
//
//         // if not we check for the dates
//         if (valuesType !== PlayAxisValueType.Number) {
//             valuesType = PlayAxisValueType.Date;
//             for (let i: number = 0; i < dataPoints.length; i++) {
//                 if (isNaN(Date.parse(dataPoints[i].playAxisValue.toString()))) {
//                     valuesType = PlayAxisValueType.String;
//                     break;
//                 }
//             }
//         }
//
//         return valuesType;
//     }
//
//
//     private static buildGroupedDataPoints(dataPoints: VisualDataPoint[], valuesType: PlayAxisValueType): VisualDataPoint[][] {
//         // grouping dataPoints by their playAxisValue
//         const groups: VisualDataPoint[][] = [];
//         for (let i: number = 0; i < dataPoints.length; i++) {
//             const groupingValue: PrimitiveValue = dataPoints[i].playAxisValue;
//
//             const groupIndex: number = PlayAxis.getGroupIndexByGroupingValue(groups, groupingValue);
//
//             let group: VisualDataPoint[];
//
//             if (groupIndex === -1) {
//                 group = [];
//                 groups.push(group);
//             } else {
//                 group = groups[groupIndex];
//             }
//
//             group.push(dataPoints[i]);
//         }
//
//         // sorting ascending
//         switch (valuesType) {
//             // checking if group names are dates
//             case PlayAxisValueType.Date:
//                 return groups.sort((a: VisualDataPoint[], b: VisualDataPoint[]) =>
//                     new Date(a[0].playAxisValue.toString())
//                         > new Date(b[0].playAxisValue.toString())
//                         ? 1 : -1
//                 );
//             // checking if group names are numbers
//             case PlayAxisValueType.Number:
//                 return groups.sort((a, b) =>
//                     +a[0].playAxisValue
//                         > +b[0].playAxisValue
//                         ? 1 : -1
//                 );
//         }
//
//         return (
//             // trying to sort as month strings
//             PlayAxis.sortGroupsByMonth(groups)
//             // otherwise just sorting as strings
//             || groups.sort((a, b) => a[0].playAxisValue > b[0].playAxisValue ? 1 : -1)
//         );
//     }
//
//     private static sortGroupsByMonth(groups: VisualDataPoint[][]): VisualDataPoint[][] {
//         // if first value is not a month we don't do anything here
//         if (Constants.Months.indexOf(groups[0][0].playAxisValue as string) === -1) {
//             return null;
//         }
//
//         let sort: boolean = true;
//
//         const result: VisualDataPoint[][] = groups.sort((a, b) => {
//             if (!sort) {
//                 return 1;
//             }
//
//             const indexA: number = Constants.Months.indexOf(a[0].playAxisValue as string);
//             const indexB: number = Constants.Months.indexOf(b[0].playAxisValue as string);
//
//             // if we find that one of the values is not a month we don't do the excess work here
//             if (indexA === -1 || indexB === -1) {
//                 sort = false;
//             }
//
//             return indexA - indexB;
//         });
//
//         return sort ? result : null;
//     }
//
//     private static getGroupIndexByGroupingValue(groupsArray: VisualDataPoint[][], groupingValue: PrimitiveValue): number {
//         for (let i: number = 0; i < groupsArray.length; i++) {
//             if (groupingValue === groupsArray[i][0].playAxisValue) {
//                 return i;
//             }
//         }
//
//         return -1;
//     }
//
//     // End: Utils
}
