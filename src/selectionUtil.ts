// module powerbi.extensibility.visual.visualUtils {
//     interface Selection {
//         action: string;
//         rect: d3.Selection<HTMLElement>;
//         rect_node: HTMLElement;
//         startX: number;
//         startY: number;
//         endX: number;
//         endY: number;
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//         active: boolean;
//         mousemoved: boolean;
//         clickEvent: MouseEvent;
//     }
//
//     interface CursorPos {
//         x: number;
//         y: number;
//     }
//
//     interface AxesDimensions {
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//     }
//
//     interface Circles {
//         all: HTMLElement[];
//         selected: HTMLElement[];
//         justSelected: HTMLElement[];
//         justRemoved: HTMLElement[];
//         previousSelected: HTMLElement[];
//     }
//
//     const selection: Selection = {
//         action: 'add',
//         active: false,
//         mousemoved: false
//     } as Selection;
//
//     const _circles: Circles = {
//         all: [],
//         selected: [],
//         justSelected: [],
//         justRemoved: [],
//         previousSelected: null
//     };
//
//     let notificateVisual: Function;
//     let axesDimensions: AxesDimensions;
//
//     let transparencyProps: DataViewObject;
//     let fillPoint: boolean;
//
//     let visualBehavior: VisualBehavior;
//
//     // Interaction with visual
//     export function lassoSelectorInit(mainElement: d3.Selection<HTMLElement>, behavior: VisualBehavior): void {
//         visualBehavior = behavior;
//
//         selection.rect = mainElement.append('div').classed('selection-rect', true);
//         selection.rect_node = selection.rect.node() as HTMLElement;
//
//         d3.select('.lasso-scatter-chart-svg').on('mousedown.selection', onMousedown);
//         d3.select('html')
//             .on('mousemove.selection', onMousemove)
//             .on('mouseup.selection', onMouseup);
//     }
//
//     export function lassoSelectorUpdate<Datum>(
//         circles: d3.selection.Update<Datum>,
//         pointsTransparencyProperties: DataViewObject,
//         visualfillPoint: boolean,
//         data: VisualData,
//         callback: (circles: d3.selection.Update<Datum>) => void
//     ): void {
//         transparencyProps = pointsTransparencyProperties;
//         axesDimensions = data.axesDimensions;
//         _circles.all = [];
//         circles.each(function (datum: Datum, index: number, outerIndex: number) {
//             _circles.all.push(this);
//         });
//         notificateVisual = callback;
//         fillPoint = visualfillPoint;
//     }
//
//     export function passSavedPointsToLassoUtil(dataPoints: VisualDataPoint[]): void {
//         for (let i: number = 0; i < dataPoints.length; i++) {
//             if (dataPoints[i].selected) {
//                 _circles.selected.push(_circles.all[i]);
//                 _circles.all[i].setAttribute('data-selection', 'selected');
//             }
//         }
//         if (_circles.previousSelected === null) {
//             _circles.previousSelected = _circles.selected;
//         }
//     }
//
//     function uploadUpdateToVisual(): void {
//         if (_circles.justSelected.length > 0 && _circles.justRemoved.length > 0) {
//             throw new Error('_circles.justSelected and _circles.justRemoved can\'t contain items at the same time!');
//         }
//         for (let i: number = 0; i < _circles.justSelected.length; i++) {
//             _circles.justSelected[i].setAttribute('data-selection', 'selected');
//             _circles.selected.push(_circles.justSelected[i]);
//         }
//         for (let i: number = 0; i < _circles.justRemoved.length; i++) {
//             _circles.justRemoved[i].removeAttribute('data-selection');
//             removeItemFromArray(_circles.selected, _circles.justRemoved[i]);
//         }
//         _circles.justSelected = [];
//         _circles.justRemoved = [];
//         if (thereAreSelectionChanges() && notificateVisual !== null) {
//             const selectedItems: d3.Selection<any> = d3.selectAll(_circles.selected);
//             notificateVisual(selectedItems);
//         }
//
//         _circles.previousSelected = _circles.selected.slice(0);
//     }
//     // /Interaction with visual
//
//
//     // Events
//     function onMousedown(): void {
//         if (!axesDimensions) {
//             return;
//         }
//         let e: MouseEvent = d3.event as MouseEvent;
//
//         if (
//             e === null
//             || e.clientX < axesDimensions.x
//             || e.clientX > axesDimensions.x + axesDimensions.width
//             || e.clientY < axesDimensions.y
//             || e.clientY > axesDimensions.y + axesDimensions.height
//         ) {
//             return;
//         }
//
//         selection.active = true;
//         selection.clickEvent = e;
//         [selection.startX, selection.startY] = [e.clientX, e.clientY];
//
//         setRectPos(e.clientX, e.clientY);
//         showRect();
//         if (!e.ctrlKey) {
//             emptyCirclesSelection();
//             visualBehavior.selectionHandler.handleClearSelection();
//         }
//     }
//
//     function onMousemove(): void {
//         if (!selection.active) {
//             return;
//         }
//
//         let e: MouseEvent = d3.event as MouseEvent;
//         if (!selection.mousemoved && e.clientX === selection.clickEvent.clientX && e.clientY === selection.clickEvent.clientY) {
//             return;
//         }
//
//         if (!selection.mousemoved) {
//             selection.mousemoved = true;
//             return;
//         }
//
//         calculateRectDimensions({
//             x: e.clientX,
//             y: e.clientY
//         });
//
//         setRectPos(selection.x, selection.y);
//         setRectSize(selection.width, selection.height);
//         for (let i: number = 0; i < _circles.all.length; i++) {
//             let _this: HTMLElement = _circles.all[i];
//             let collided: boolean = detectCollision(_this);
//             let state: string = _this.getAttribute('data-selection');
//             if (collided) {
//                 // Firstly catch the case when we enable the "remove" mode
//                 if (
//                     (_circles.justSelected.length === 0 || _circles.justRemoved.length > 0)
//                     && state === 'selected'
//                 ) {
//                     selection.action = 'remove';
//                     _this.setAttribute('data-selection', 'justRemoved');
//                     _circles.justRemoved.push(_this);
//                     continue;
//                 }
//
//                 if (
//                     selection.action === 'add'
//                     && state !== 'selected'
//                     && state !== 'justSelected'
//                 ) {
//                     _this.setAttribute('data-selection', 'justSelected');
//                     _circles.justSelected.push(_this);
//                 } else if (
//                     selection.action === 'remove'
//                     && state !== 'justRemoved'
//                 ) {
//                     _this.setAttribute('data-selection', 'justRemoved');
//                     _circles.justRemoved.push(_this);
//                 }
//
//             } else if (selection.action === 'add' && state === 'justSelected') {
//                 _this.removeAttribute('data-selection');
//                 removeItemFromArray(_circles.justSelected, _this);
//             }
//         }
//         updateFillOpacity();
//     }
//
//     function onMouseup(): void {
//         if (!selection.active) {
//             deactivateRect();
//             return;
//         }
//
//         if (!selection.mousemoved) { // Selection by click
//             let target: HTMLElement = selection.clickEvent.target as HTMLElement;
//
//             if (d3.select(target).classed('scatter-dot')) {
//                 if (selection.clickEvent.ctrlKey) {
//                     if (target.hasAttribute('data-selection')) {
//                         target.removeAttribute('data-selection');
//                         removeItemFromArray(_circles.selected, target);
//                     } else {
//                         target.setAttribute('data-selection', 'justSelected');
//                         _circles.justSelected.push(target);
//                     }
//                 } else {
//                     emptyCirclesSelection();
//                     target.setAttribute('data-selection', 'justSelected');
//                     _circles.justSelected.push(target);
//                 }
//             }
//         }
//
//         deactivateRect();
//         updateFillOpacity();
//         /* launching "uploadUpdateToVisual" function a little later so that the rectangle can disappear immediately
//           which looks much better than if it hung on the screen for a while.
//           In general, setTimeout is not necessary, it works well just with "uploadUpdateToVisual();"
//           */
//         setTimeout(uploadUpdateToVisual);
//     }
//     // /Events
//
//
//     // DOM
//     function updateFillOpacity(): void {
//         if (_circles.selected.length === 0 && _circles.justSelected.length === 0) {
//             for (let i: number = 0; i < _circles.all.length; i++) {
//                 d3.select(_circles.all[i]).style({
//                     'fill-opacity': fillPoint ? 1 - (+transparencyProps.regular / 100) : 0,
//                     'stroke-opacity': !fillPoint ? 1 - (+transparencyProps.regular / 100) : 0,
//                 });
//             }
//         } else {
//             for (let i: number = 0; i < _circles.all.length; i++) {
//                 let circle: HTMLElement = _circles.all[i];
//                 let d3_circle: d3.Selection<SVGCircleElement> = d3.select(circle);
//                 if (
//                     circle.getAttribute('data-selection') === 'selected'
//                     || circle.getAttribute('data-selection') === 'justSelected'
//                 ) {
//                     d3_circle.style({
//                         'fill-opacity': fillPoint ? 1 - (+transparencyProps.selected / 100) : 0,
//                         'stroke-opacity': !fillPoint ? 1 - (+transparencyProps.selected / 100) : 1,
//                         'stroke': Visual.DefaultStrokeSelectionColor,
//                         "stroke-width": Visual.DefaultStrokeSelectionWidth
//                     });
//                 } else {
//                     d3_circle.style({
//                         'fill-opacity': fillPoint ? 1 - (+transparencyProps.unselected / 100) : 0,
//                         'stroke-opacity': !fillPoint ? 1 - (+transparencyProps.unselected / 100) : 0,
//                     });
//                 }
//             }
//         }
//     }
//     // /DOM
//
//
//     // Arrays manipulate
//     function emptyCirclesSelection(): void {
//         let targets: HTMLElement[][] = [_circles.selected, _circles.justSelected, _circles.justRemoved];
//         for (let i: number = 0; i < targets.length; i++) {
//             for (let j: number = 0; j < targets[i].length; j++) {
//                 targets[i][j].removeAttribute('data-selection');
//             }
//         }
//         [_circles.selected, _circles.justSelected, _circles.justRemoved] = [[], [], []];
//     }
//     // / Arrays manipulate
//
//
//     // Rect
//     function showRect(): void {
//         selection.rect.classed('selection-rect-active', true);
//     }
//     function hideRect(): void {
//         selection.rect.classed('selection-rect-active', false);
//     }
//     function setRectPos(x: number, y: number): void {
//         selection.rect.style({
//             left: x.toString() + 'px',
//             top: y.toString() + 'px'
//         });
//     }
//     function setRectSize(width: number, height: number): void {
//         selection.rect.style({
//             width: width.toString() + 'px',
//             height: height.toString() + 'px'
//         });
//     }
//     function calculateRectDimensions(cursor: CursorPos): void {
//         let s: Selection = selection;
//
//         if (s.startX <= cursor.x) {
//             s.x = s.startX;
//             s.width = Math.min(cursor.x, axesDimensions.x + axesDimensions.width) - s.startX;
//             s.endX = s.x + s.width;
//         } else {
//             s.x = Math.max(cursor.x, axesDimensions.x);
//             s.width = s.startX - s.x;
//             s.endX = s.x;
//         }
//
//         if (s.startY <= cursor.y) {
//             s.y = s.startY;
//             s.height = Math.min(cursor.y, axesDimensions.y + axesDimensions.height) - s.startY;
//             s.endY = s.y + s.height;
//         } else {
//             s.y = Math.max(cursor.y, axesDimensions.y);
//             s.height = s.startY - s.y;
//             s.endY = s.y;
//         }
//     }
//     function deactivateRect(): void {
//         selection.mousemoved = false;
//         selection.active = false;
//         selection.action = 'add';
//         hideRect();
//         let backgroundStyle: string = selection.rect_node.style.backgroundColor;
//         selection.rect_node.setAttribute('style', '');
//         selection.rect_node.style.backgroundColor = backgroundStyle;
//     }
//     // /Rect
//
//
//     // Utils
//     function removeItemFromArray(arr: any[], item: any): void {
//         for (let i: number = 0; i < arr.length; i++) {
//             if (arr[i] === item) {
//                 arr.splice(i, 1);
//             }
//         }
//     }
//     function thereAreSelectionChanges(): boolean {
//         if (_circles.previousSelected === null) {
//             _circles.previousSelected = _circles.selected;
//             return false;
//         }
//         if (_circles.previousSelected.length !== _circles.selected.length) {
//             return true;
//         }
//         for (let i: number = 0; i < _circles.previousSelected.length; i++) {
//             if (_circles.previousSelected[i] !== _circles.selected[i]) {
//                 return true;
//             }
//         }
//         return false;
//     }
//     function detectCollision(circle: HTMLElement): boolean {
//         let bounds: ClientRect = circle.getBoundingClientRect();
//         // Consider circle as square and detect collision
//         if (
//             selection.x <= bounds.right
//             && selection.x + selection.width >= bounds.left
//             && selection.y <= bounds.bottom
//             && selection.y + selection.height >= bounds.top
//         ) {
//             return true;
//         } else {
//             return false;
//         }
//     }
//     // /Utils
// }
