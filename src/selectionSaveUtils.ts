// module powerbi.extensibility.visual.selectionSaveUtils {
//     export function saveSelection(selection: VisualDataPoint[], host: IVisualHost): void {
//         const storedSelection: VisualDataPoint[] = createStoredSelection(selection);
//
//         const instance: VisualObjectInstance = {
//             objectName: "selectionSaveSettings",
//             selector: undefined,
//             properties: {
//                 selection: JSON.stringify(storedSelection)
//             }
//         };
//
//         host.persistProperties({
//             replace: [
//                 instance
//             ]
//         });
//     }
//
//     function createStoredSelection(selection: VisualDataPoint[]): VisualDataPoint[] {
//         // Here we prevent storing of the 'entirePath' and 'pathElement' properties
//         // because they can have a circular object links
//         // which causes endless loop when trying to convert to JSON
//         const storedSelection: VisualDataPoint[] = selection.map((dataPoint: VisualDataPoint) => {
//             const storedDataPoint = {} as VisualDataPoint;
//             for (let key in dataPoint) {
//                 storedDataPoint[key] = dataPoint[key];
//             }
//             storedDataPoint.entirePath = null;
//             storedDataPoint.pathElement = null;
//             return storedDataPoint;
//         });
//
//         return storedSelection;
//     }
//
// }
