import {Selection as d3Selection, select as d3select, selectAll as d3selectAll, BaseType} from 'd3-selection';
import {VisualBehavior} from './visualBehavior';
import powerbi from 'powerbi-visuals-api';
import DataViewObject = powerbi.DataViewObject;
import {Visual} from './visual';
import {AxesDimensions, VisualData, VisualDataPoint} from './visualInterfaces';

interface Selection {
    action: string;
    rect: d3Selection<HTMLDivElement, unknown, null, undefined>;
    rect_node: HTMLDivElement | null;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    mousemoved: boolean;
    clickEvent: MouseEvent;
}

interface CursorPos {
    x: number;
    y: number;
}

interface Circles {
    all: Element[];
    selected: Element[];
    justSelected: Element[];
    justRemoved: Element[];
    previousSelected: Element[] | null;
}

const selection: Selection = {
    action: 'add',
    active: false,
    mousemoved: false,
} as Selection;

const _circles: Circles = {
    all: [],
    selected: [],
    justSelected: [],
    justRemoved: [],
    previousSelected: null,
};

let notifyVisual: ((selectedItems: d3Selection<Element, unknown, null, undefined>) => void) | undefined = undefined;
let axesDimensions: AxesDimensions | undefined = undefined;

let transparencyProps: DataViewObject | undefined = undefined;
let fillPoint: boolean | undefined = undefined;

let visualBehavior: VisualBehavior | undefined = undefined;

// Interaction with visual
export function lassoSelectorInit(mainElement: d3Selection<HTMLElement, unknown, null, undefined>, behavior: VisualBehavior): void {
    visualBehavior = behavior;

    selection.rect = mainElement.append('div').classed('selection-rect', true);
    selection.rect_node = selection.rect.node();

    d3select('.lasso-scatter-chart-svg').on('mousedown.selection', onMousedown);
    d3select('html')
        .on('mousemove.selection', onMousemove)
        .on('mouseup.selection', onMouseup);
}

export function lassoSelectorUpdate(
    circles: d3Selection<Element, VisualDataPoint, BaseType, VisualDataPoint[]>,
    pointsTransparencyProperties: DataViewObject,
    visualFillPoint: boolean,
    data: VisualData,
    callback: (circles: d3Selection<Element, VisualDataPoint, never, unknown>) => void,
): void {
    transparencyProps = pointsTransparencyProperties;
    axesDimensions = data?.axesDimensions;

    _circles.all = [];
    circles.each(function () {
        _circles.all.push(this);
    });
    notifyVisual = callback;
    fillPoint = visualFillPoint;
}

export function passSavedPointsToLassoUtil(dataPoints: VisualDataPoint[]): void {
    for (let i: number = 0; i < dataPoints.length; i++) {
        if (dataPoints[i].selected) {
            _circles.selected.push(_circles.all[i]);
            _circles.all[i].setAttribute('data-selection', 'selected');
        }
    }
    if (_circles.previousSelected === null) {
        _circles.previousSelected = _circles.selected;
    }
}

function uploadUpdateToVisual(): void {
    if (_circles.justSelected.length > 0 && _circles.justRemoved.length > 0) {
        throw new Error('_circles.justSelected and _circles.justRemoved can\'t contain items at the same time!');
    }
    for (let i: number = 0; i < _circles.justSelected.length; i++) {
        _circles.justSelected[i].setAttribute('data-selection', 'selected');
        _circles.selected.push(_circles.justSelected[i]);
    }
    for (let i: number = 0; i < _circles.justRemoved.length; i++) {
        _circles.justRemoved[i].removeAttribute('data-selection');
        removeItemFromArray(_circles.selected, _circles.justRemoved[i]);
    }
    _circles.justSelected = [];
    _circles.justRemoved = [];
    if (thereAreSelectionChanges() && notifyVisual !== null) {
        const selectedItems = d3selectAll(_circles.selected);
        notifyVisual?.(selectedItems);
    }

    _circles.previousSelected = _circles.selected.slice(0);
}

// /Interaction with visual

// Events
function onMousedown(e: MouseEvent): void {
    if (!axesDimensions) {
        return;
    }

    if (
        e.button !== 0 || // ignore if it is not main mouse button  
        e === null
        || e.clientX < axesDimensions.x
        || e.clientX > axesDimensions.x + axesDimensions.width
        || e.clientY < axesDimensions.y
        || e.clientY > axesDimensions.y + axesDimensions.height
    ) {
        return;
    }

    selection.active = true;
    selection.clickEvent = e;
    [selection.startX, selection.startY] = [e.clientX, e.clientY];

    setRectPos(e.clientX, e.clientY);
    showRect();
    if (!e.ctrlKey) {
        emptyCirclesSelection();
        visualBehavior?.selectionHandler?.handleClearSelection();
    }
}

function onMousemove(e: MouseEvent): void {
    if (!selection.active) {
        return;
    }

    if (!selection.mousemoved && e.clientX === selection.clickEvent.clientX && e.clientY === selection.clickEvent.clientY) {
        return;
    }

    if (!selection.mousemoved) {
        selection.mousemoved = true;
        return;
    }

    calculateRectDimensions({
        x: e.clientX,
        y: e.clientY,
    });

    setRectPos(selection.x, selection.y);
    setRectSize(selection.width, selection.height);
    for (let i: number = 0; i < _circles.all.length; i++) {
        const _this = _circles.all[i];
        const collided: boolean = detectCollision(_this);
        const state = _this.getAttribute('data-selection');
        if (collided) {
            // Firstly catch the case when we enable the "remove" mode
            if (
                (_circles.justSelected.length === 0 || _circles.justRemoved.length > 0)
                && state === 'selected'
            ) {
                selection.action = 'remove';
                _this.setAttribute('data-selection', 'justRemoved');
                _circles.justRemoved.push(_this);
                continue;
            }

            if (
                selection.action === 'add'
                && state !== 'selected'
                && state !== 'justSelected'
            ) {
                _this.setAttribute('data-selection', 'justSelected');
                _circles.justSelected.push(_this);
            } else if (
                selection.action === 'remove'
                && state !== 'justRemoved'
            ) {
                _this.setAttribute('data-selection', 'justRemoved');
                _circles.justRemoved.push(_this);
            }

        } else if (selection.action === 'add' && state === 'justSelected') {
            _this.removeAttribute('data-selection');
            removeItemFromArray(_circles.justSelected, _this);
        }
    }
    updateFillOpacity();
}

function onMouseup(): void {
    if (!selection.active) {
        deactivateRect();
        return;
    }

    if (!selection.mousemoved) { // Selection by click
        const target = selection.clickEvent.target as Element;

        if (d3select(target).classed('scatter-dot')) {
            if (selection.clickEvent.ctrlKey) {
                if (target.hasAttribute('data-selection')) {
                    target.removeAttribute('data-selection');
                    removeItemFromArray(_circles.selected, target);
                } else {
                    target.setAttribute('data-selection', 'justSelected');
                    _circles.justSelected.push(target);
                }
            } else {
                emptyCirclesSelection();
                target.setAttribute('data-selection', 'justSelected');
                _circles.justSelected.push(target);
            }
        }
    }

    deactivateRect();
    updateFillOpacity();
    /* launching "uploadUpdateToVisual" function a little later so that the rectangle can disappear immediately
      which looks much better than if it hung on the screen for a while.
      In general, setTimeout is not necessary, it works well just with "uploadUpdateToVisual();"
      */
    setTimeout(uploadUpdateToVisual);
}

// /Events

// DOM
function updateFillOpacity(): void {
    if (_circles.selected.length === 0 && _circles.justSelected.length === 0) {
        for (let i: number = 0; i < _circles.all.length; i++) {
            d3select(_circles.all[i])
                .style('fill-opacity', fillPoint ? 1 - (+(transparencyProps?.regular ?? NaN) / 100) : 0)
                .style('stroke-opacity', !fillPoint ? 1 - (+(transparencyProps?.regular ?? NaN) / 100) : 0);
        }
    } else {
        for (let i: number = 0; i < _circles.all.length; i++) {
            const circle = _circles.all[i];
            const d3_circle = d3select(circle);
            if (
                circle.getAttribute('data-selection') === 'selected'
                || circle.getAttribute('data-selection') === 'justSelected'
            ) {
                d3_circle
                    .style('fill-opacity', fillPoint ? 1 - (+(transparencyProps?.selected ?? NaN) / 100) : 0)
                    .style('stroke-opacity', !fillPoint ? 1 - (+(transparencyProps?.selected ?? NaN) / 100) : 1)
                    .style('stroke', Visual.DefaultStrokeSelectionColor)
                    .style('stroke-width', Visual.DefaultStrokeSelectionWidth);
            } else {
                d3_circle
                    .style('fill-opacity', fillPoint ? 1 - (+(transparencyProps?.unselected ?? NaN) / 100) : 0)
                    .style('stroke-opacity', !fillPoint ? 1 - (+(transparencyProps?.unselected ?? NaN) / 100) : 0);
            }
        }
    }
}

// /DOM

// Arrays manipulate
function emptyCirclesSelection(): void {
    const targets: Element[][] = [_circles.selected, _circles.justSelected, _circles.justRemoved];
    for (let i: number = 0; i < targets.length; i++) {
        for (let j: number = 0; j < targets[i].length; j++) {
            targets[i][j].removeAttribute('data-selection');
        }
    }
    [_circles.selected, _circles.justSelected, _circles.justRemoved] = [[], [], []];
}

// / Arrays manipulate

// Rect
function showRect(): void {
    selection.rect.classed('selection-rect-active', true);
}

function hideRect(): void {
    selection.rect.classed('selection-rect-active', false);
}

function setRectPos(x: number, y: number): void {
    selection.rect
        .style('left', x.toString() + 'px')
        .style('top', y.toString() + 'px');
}

function setRectSize(width: number, height: number): void {
    selection.rect
        .style('width', width.toString() + 'px')
        .style('height', height.toString() + 'px');
}

function calculateRectDimensions(cursor: CursorPos): void {
    const s: Selection = selection;

    if (s.startX <= cursor.x) {
        s.x = s.startX;
        s.width = Math.min(cursor.x, (axesDimensions?.x ?? NaN) + (axesDimensions?.width ?? NaN)) - s.startX;
        s.endX = s.x + s.width;
    } else {
        s.x = Math.max(cursor.x, (axesDimensions?.x ?? NaN));
        s.width = s.startX - s.x;
        s.endX = s.x;
    }

    if (s.startY <= cursor.y) {
        s.y = s.startY;
        s.height = Math.min(cursor.y, (axesDimensions?.y ?? NaN) + (axesDimensions?.height ?? NaN)) - s.startY;
        s.endY = s.y + s.height;
    } else {
        s.y = Math.max(cursor.y, (axesDimensions?.y ?? NaN));
        s.height = s.startY - s.y;
        s.endY = s.y;
    }
}

function deactivateRect(): void {
    selection.mousemoved = false;
    selection.active = false;
    selection.action = 'add';
    hideRect();
    if (selection.rect_node) {
        const backgroundStyle = selection.rect_node.style.backgroundColor;
        selection.rect_node.setAttribute('style', '');
        selection.rect_node.style.backgroundColor = backgroundStyle;
    }
}

// /Rect

// Utils
function removeItemFromArray(arr: any[], item: any): void {
    for (let i: number = 0; i < arr.length; i++) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
}

function thereAreSelectionChanges(): boolean {
    if (_circles.previousSelected === null) {
        _circles.previousSelected = _circles.selected;
        return false;
    }
    if (_circles.previousSelected.length !== _circles.selected.length) {
        return true;
    }
    for (let i: number = 0; i < _circles.previousSelected.length; i++) {
        if (_circles.previousSelected[i] !== _circles.selected[i]) {
            return true;
        }
    }
    return false;
}

function detectCollision(circle: Element): boolean {
    const bounds = circle.getBoundingClientRect();
    // Consider circle as square and detect collision
    return selection.x <= bounds.right
        && selection.x + selection.width >= bounds.left
        && selection.y <= bounds.bottom
        && selection.y + selection.height >= bounds.top;
}

// /Utils
