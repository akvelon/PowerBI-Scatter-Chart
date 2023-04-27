import {
    IBehaviorOptions,
    IInteractiveBehavior,
    ISelectionHandler,
} from 'powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService';
import {VisualData, VisualDataPoint} from './visualInterfaces';
import {Visual} from './visual';
import {LegendDataPoint} from 'powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces';
import {Selection, BaseType, Selection as d3Selection} from 'd3-selection';
import powerbi from 'powerbi-visuals-api';
import DataViewObject = powerbi.DataViewObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.extensibility.ISelectionId;
import {saveSelection} from './selectionSaveUtils';
import {compareObjects} from './utils';

export interface VisualBehaviorOptions extends IBehaviorOptions<VisualDataPoint> {
    clearCatcher: Selection<any, any, any, any>;
    selection: Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>;
    legendItems: Selection<BaseType, LegendDataPoint, SVGSVGElement, unknown>;
    getFillOpacity: (dataPoint: VisualDataPoint) => number;
    pointsTransparencyProperties: DataViewObject | null;
    lassoSelectorUpdate: (
        circles: Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>,
        pointsTransparencyProperties: DataViewObject | null,
        visualFillPoint: boolean | null,
        data: VisualData | null,
        callback: (circles: d3Selection<Element, VisualDataPoint, never, unknown>) => void,
    ) => void;
    host: IVisualHost;
    data: VisualData | null;
    fillPoint: boolean | null;
    selectionSaveSettings: ISelectionId[] | null;
}

export class VisualBehavior implements IInteractiveBehavior {
    private visual: Visual;

    public selectionHandler: ISelectionHandler | undefined = undefined;

    private options: VisualBehaviorOptions | undefined = undefined;
    private skipNextRendering: boolean = false;


    constructor(visual: Visual) {
        this.visual = visual;
    }

    public bindEvents(
        behaviorOptions: VisualBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        this.options = behaviorOptions;
        this.selectionHandler = selectionHandler;

        behaviorOptions.legendItems.on('click', (item: any) => {
            selectionHandler.handleSelection(item, false); // Selects the dataPoint
        });

        if (this.options.lassoSelectorUpdate) {
            this.options.lassoSelectorUpdate(
                this.options.selection,
                this.options.pointsTransparencyProperties,
                this.options.fillPoint,
                this.options.data,
                (circles) => {
                    Visual.skipNextUpdate = true; // we prevent the next update so that the Play Axis doesn't get resetted
                    this.skipNextRendering = true;
                    selectionHandler.handleClearSelection();
                    if (circles.data().length > 0) {
                        selectionHandler.handleSelection(circles.data(), false);
                    } else {
                        saveSelection(circles.data(), behaviorOptions.host);
                    }
                });
        }
    }

    public renderSelection(hasSelection: boolean): void {
        if (this.skipNextRendering) {
            this.skipNextRendering = false;
            return;
        }

        const thisOptions = this.options;
        if (!thisOptions) {
            return;
        }

        const currentSelection = thisOptions.selection.filter(d => d.selected && (d.isShown ?? false));
        const selectedDataPoints = currentSelection.data();

        Visual.skipNextUpdate = true;
        this.visual.playAxis.onSelect(currentSelection, true);

        // Style for legend filter
        thisOptions.selection
            .style('fill-opacity', d => thisOptions.fillPoint ? thisOptions.getFillOpacity(d) : 0)
            .style('stroke-opacity', d =>
                thisOptions.fillPoint
                    ? d.selected ? 1 : 0
                    : thisOptions?.getFillOpacity(d) ?? null)
            .style('stroke', d =>
                thisOptions?.fillPoint && d.selected
                    ? Visual.DefaultStrokeSelectionColor
                    : d.fill ?? null)
            .style('stroke-width', d => d.selected
                ? Visual.DefaultStrokeSelectionWidth
                : Visual.DefaultStrokeWidth);

        if (!compareObjects(selectedDataPoints, thisOptions.selectionSaveSettings, 'identity.key') && hasSelection) {
            saveSelection(selectedDataPoints, thisOptions.host);
        }
    }
}
