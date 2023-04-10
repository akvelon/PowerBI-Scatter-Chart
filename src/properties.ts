// /*
//  *  Power BI Visualizations
//  *
//  *  Copyright (c) Microsoft Corporation
//  *  All rights reserved.
//  *  MIT License
//  *
//  *  Permission is hereby granted, free of charge, to any person obtaining a copy
//  *  of this software and associated documentation files (the ""Software""), to deal
//  *  in the Software without restriction, including without limitation the rights
//  *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  *  copies of the Software, and to permit persons to whom the Software is
//  *  furnished to do so, subject to the following conditions:
//  *
//  *  The above copyright notice and this permission notice shall be included in
//  *  all copies or substantial portions of the Software.
//  *
//  *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  *  THE SOFTWARE.
//  */
//
// // TODO: We have to migrate it to DataViewObjectsParser. You can find it in powerbi-visuals-utils-dataviewutils
// export const PropertiesOfCapabilities = {
//     "dataPoint": {
//         "defaultColor": {
//             "objectName": "dataPoint",
//             "propertyName": "defaultColor"
//         },
//         "showAllDataPoints": {
//             "objectName": "dataPoint",
//             "propertyName": "showAllDataPoints"
//         },
//         "fill": {
//             "objectName": "dataPoint",
//             "propertyName": "fill"
//         },
//         "fillRule": {
//             "objectName": "dataPoint",
//             "propertyName": "fillRule"
//         }
//     },
//     "categoryAxis": {
//         "show": {
//             "objectName": "categoryAxis",
//             "propertyName": "show"
//         },
//         "axisScale": {
//             "objectName": "categoryAxis",
//             "propertyName": "axisScale"
//         },
//         "start": {
//             "objectName": "categoryAxis",
//             "propertyName": "start"
//         },
//         "end": {
//             "objectName": "categoryAxis",
//             "propertyName": "end"
//         },
//         "axisColor": {
//             "objectName": "categoryAxis",
//             "propertyName": "axisColor"
//         },
//         "fontSize": {
//             "objectName": "categoryAxis",
//             "propertyName": "fontSize"
//         },
//         "fontFamily": {
//             "objectName": "categoryAxis",
//             "propertyName": "fontFamily"
//         },
//         "labelDisplayUnits": {
//             "objectName": "categoryAxis",
//             "propertyName": "labelDisplayUnits"
//         },
//         "valueDecimalPlaces": {
//             "objectName": "categoryAxis",
//             "propertyName": "valueDecimalPlaces"
//         },
//         "showAxisTitle": {
//             "objectName": "categoryAxis",
//             "propertyName": "showAxisTitle"
//         },
//         "axisStyle": {
//             "objectName": "categoryAxis",
//             "propertyName": "axisStyle"
//         },
//         "axisTitleColor": {
//             "objectName": "categoryAxis",
//             "propertyName": "axisTitleColor"
//         },
//         "axisTitle": {
//             "objectName": "categoryAxis",
//             "propertyName": "axisTitle"
//         },
//         "titleFontSize": {
//             "objectName": "categoryAxis",
//             "propertyName": "titleFontSize"
//         },
//         "showGridlines": {
//             "objectName": "categoryAxis",
//             "propertyName": "showGridlines"
//         },
//         "gridlinesColor": {
//             "objectName": "categoryAxis",
//             "propertyName": "gridlinesColor"
//         },
//         "strokeWidth": {
//             "objectName": "categoryAxis",
//             "propertyName": "strokeWidth"
//         },
//         "lineStyle": {
//             "objectName": "categoryAxis",
//             "propertyName": "lineStyle"
//         }
//     },
//     "valueAxis": {
//         "show": {
//             "objectName": "valueAxis",
//             "propertyName": "show"
//         },
//         "axisScale": {
//             "objectName": "valueAxis",
//             "propertyName": "axisScale"
//         },
//         "start": {
//             "objectName": "valueAxis",
//             "propertyName": "start"
//         },
//         "end": {
//             "objectName": "valueAxis",
//             "propertyName": "end"
//         },
//         "axisColor": {
//             "objectName": "valueAxis",
//             "propertyName": "axisColor"
//         },
//         "fontSize": {
//             "objectName": "valueAxis",
//             "propertyName": "fontSize"
//         },
//         "fontFamily": {
//             "objectName": "valueAxis",
//             "propertyName": "fontFamily"
//         },
//         "labelDisplayUnits": {
//             "objectName": "valueAxis",
//             "propertyName": "labelDisplayUnits"
//         },
//         "valueDecimalPlaces": {
//             "objectName": "valueAxis",
//             "propertyName": "valueDecimalPlaces"
//         },
//         "showAxisTitle": {
//             "objectName": "valueAxis",
//             "propertyName": "showAxisTitle"
//         },
//         "axisStyle": {
//             "objectName": "valueAxis",
//             "propertyName": "axisStyle"
//         },
//         "axisTitleColor": {
//             "objectName": "valueAxis",
//             "propertyName": "axisTitleColor"
//         },
//         "axisTitle": {
//             "objectName": "valueAxis",
//             "propertyName": "axisTitle"
//         },
//         "titleFontSize": {
//             "objectName": "valueAxis",
//             "propertyName": "titleFontSize"
//         },
//         "showGridlines": {
//             "objectName": "valueAxis",
//             "propertyName": "showGridlines"
//         },
//         "gridlinesColor": {
//             "objectName": "valueAxis",
//             "propertyName": "gridlinesColor"
//         },
//         "strokeWidth": {
//             "objectName": "valueAxis",
//             "propertyName": "strokeWidth"
//         },
//         "lineStyle": {
//             "objectName": "valueAxis",
//             "propertyName": "lineStyle"
//         }
//     },
//     "legend": {
//         "show": {
//             "objectName": "legend",
//             "propertyName": "show"
//         },
//         "position": {
//             "objectName": "legend",
//             "propertyName": "position"
//         },
//         "showTitle": {
//             "objectName": "legend",
//             "propertyName": "showTitle"
//         },
//         "titleText": {
//             "objectName": "legend",
//             "propertyName": "titleText"
//         },
//         "labelColor": {
//             "objectName": "legend",
//             "propertyName": "labelColor"
//         },
//         "fontSize": {
//             "objectName": "legend",
//             "propertyName": "fontSize"
//         },
//         "fontFamily": {
//             "objectName": "legend",
//             "propertyName": "fontFamily"
//         }
//     },
//     "categoryLabels": {
//         "show": {
//             "objectName": "categoryLabels",
//             "propertyName": "show"
//         },
//         "color": {
//             "objectName": "categoryLabels",
//             "propertyName": "color"
//         },
//         "fontSize": {
//             "objectName": "categoryLabels",
//             "propertyName": "fontSize"
//         },
//         "fontFamily": {
//             "objectName": "categoryLabels",
//             "propertyName": "fontFamily"
//         },
//         "showBackground": {
//             "objectName": "categoryLabels",
//             "propertyName": "showBackground"
//         },
//         "backgroundColor": {
//             "objectName": "categoryLabels",
//             "propertyName": "backgroundColor"
//         }
//     },
//     "xConstantLine": {
//         "show": {
//             "objectName": "xConstantLine",
//             "propertyName": "show"
//         },
//         "value": {
//             "objectName": "xConstantLine",
//             "propertyName": "value"
//         },
//         "color": {
//             "objectName": "xConstantLine",
//             "propertyName": "color"
//         }
//     },
//     "yConstantLine": {
//         "show": {
//             "objectName": "yConstantLine",
//             "propertyName": "show"
//         },
//         "value": {
//             "objectName": "yConstantLine",
//             "propertyName": "value"
//         },
//         "color": {
//             "objectName": "yConstantLine",
//             "propertyName": "color"
//         }
//     },
//     "shapes": {
//         "size": {
//             "objectName": "shapes",
//             "propertyName": "size"
//         }
//     },
//     "selectionColor": {
//         "fillColor": {
//             "objectName": "selectionColor",
//             "propertyName": "fillColor"
//         }
//     },
//     "selectionSaveSettings": {
//         "selection": {
//             "objectName": "selectionSaveSettings",
//             "propertyName": "selection"
//         }
//     },
//     "pointsTransparency": {
//         "selected": {
//             "objectName": "pointsTransparency",
//             "propertyName": "selected"
//         },
//         "regular": {
//             "objectName": "pointsTransparency",
//             "propertyName": "regular"
//         },
//         "unselected": {
//             "objectName": "pointsTransparency",
//             "propertyName": "unselected"
//         }
//     },
//     "fillPoint": {
//         "show": {
//             "objectName": "fillPoint",
//             "propertyName": "show"
//         }
//     },
//     "backdrop": {
//         "show": {
//             "objectName": "backdrop",
//             "propertyName": "show"
//         },
//         "url": {
//             "objectName": "backdrop",
//             "propertyName": "url"
//         }
//     },
//     "crosshair": {
//         "show": {
//             "objectName": "crosshair",
//             "propertyName": "show"
//         }
//     },
//     "outline": {
//         "show": {
//             "objectName": "outline",
//             "propertyName": "show"
//         }
//     }
// };
