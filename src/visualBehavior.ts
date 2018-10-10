module powerbi.extensibility.visual {
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import LegendDataPoint = powerbi.extensibility.utils.chart.legend.LegendDataPoint;

    export interface VisualBehaviorOptions {
        clearCatcher: d3.Selection<any>;
        selection: d3.Selection<VisualDataPoint>;
        legendItems: d3.Selection<LegendDataPoint>;
        getFillOpacity: (dataPoint: VisualDataPoint) => number;
        pointsTransparencyProperties: DataViewObject;
        lassoSelectorUpdate?: <VisualDataPoint>(circles: d3.Selection<VisualDataPoint>, pointsTransparencyProperties, fillPoint, data, callback: (circles: d3.Selection<VisualDataPoint>) => void) => void;
        host?: IVisualHost;
        data?: VisualData;
        fillPoint?: boolean;
        selectionSaveSettings?: ISelectionId[];
    }

    export class VisualBehavior implements IInteractiveBehavior {
        // Implementation of IInteractiveBehavior
        options: VisualBehaviorOptions;
        visual: Visual;

        private skipNextRendering: boolean = false;

        public selectionHandler: ISelectionHandler;

        constructor(visual: Visual) {
            this.visual = visual;
        }

        public bindEvents(
            behaviorOptions: VisualBehaviorOptions,
            selectionHandler: ISelectionHandler): void {

            const multiSelect: boolean = true;

            this.options = behaviorOptions;
            this.selectionHandler = selectionHandler;

            behaviorOptions.legendItems.on("click", (item: any) => {
                selectionHandler.handleSelection(item, false); // Selects the dataPoint
            });

            if (this.options.lassoSelectorUpdate) {
                this.options.lassoSelectorUpdate(this.options.selection, this.options.pointsTransparencyProperties, this.options.fillPoint, this.options.data, (circles) => {
                    Visual.skipNextUpdate = true; // we prevent the next update so that the Play Axis doesn't get resetted
                    this.skipNextRendering = true;
                    selectionHandler.handleClearSelection();
                    if (circles.data().length > 0) {
                        selectionHandler.handleSelection(circles.data(), false);
                    } else {
                        selectionSaveUtils.saveSelection(circles.data(), this.options.host);
                    }
                });
            }
        }

        public renderSelection(hasSelection: boolean): void {
            if (this.skipNextRendering) {
                this.skipNextRendering = false;
                return;
            }
            const currentSelection = this.options.selection.filter(d => d.selected && d.isShown);
            const selectedDataPoints: VisualDataPoint[] = currentSelection.data();

            Visual.skipNextUpdate = true;
            this.visual.playAxis.onSelect(currentSelection, true);

            // Style for legend filter
            this.options.selection.style({
                "fill-opacity": d => this.options.fillPoint ? this.options.getFillOpacity(d) : 0,
                "stroke-opacity": d => {
                    if (this.options.fillPoint) {
                        if (d.selected) {
                            return 1;
                        } else {
                            return 0;
                        }
                    } else {
                        return this.options.getFillOpacity(d);
                    }
                },
                "stroke": d => {
                    if (this.options.fillPoint) {
                        if (d.selected) {
                            return Visual.DefaultStrokeSelectionColor;
                        }
                    }

                    return d.fill;
                },
                "stroke-width": d => {
                    if (d.selected) {
                        return Visual.DefaultStrokeSelectionWidth;
                    }

                    return Visual.DefaultStrokeWidth;
                }
            });

            if (!visualUtils.compareObjects(selectedDataPoints, this.options.selectionSaveSettings, "identity.key") && hasSelection) {
                selectionSaveUtils.saveSelection(selectedDataPoints, this.options.host);
            }
        }
    }
}