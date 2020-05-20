/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import DataViewCategoricalColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import { IFilterColumnTarget, BasicFilter } from "powerbi-models";
import FilterAction = powerbi.FilterAction;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { fabric } from "fabric";

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    private scale: number = .85;
    private canvas: fabric.Canvas;
    private visualHost: IVisualHost;
    private dataViews: powerbi.DataView[];
    private xScale = Math.round(54 * this.scale);
    private yScale = Math.round(94 * this.scale);
    private x = [];
    private y = [];
    private c = ['#d4c685', '#f7ef81', '#cfe795', '#a7d3a6', '#add2c2'];

    constructor(options: VisualConstructorOptions) {
        // console.log('Visual constructor', options);
        this.target = options.element;
        this.visualHost = options.host;
        for (let i = 0; i != 9; ++i) this.x.push(i * this.xScale);
        for (let i = 0; i != 9; ++i) this.y.push(i * this.yScale);
        this.updateCount = 0;
        if (document) {
            const canvasE: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
            canvasE.id = 'c';
            canvasE.width = 600;
            canvasE.height = 800;
            this.target.appendChild(canvasE);
            this.canvas = new fabric.Canvas(canvasE);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        //console.log('Visual update', options);
        this.dataViews = options.dataViews
        console.log('Visual update ok');
        let categories: DataViewCategoricalColumn = this.dataViews[0].categorical.categories[0];
        let names: DataViewCategoricalColumn = this.dataViews[0].categorical.categories[1];
        let hexval: DataViewValueColumns = this.dataViews[0].categorical.values

        if (this.textNode) {
            this.textNode.textContent = (this.updateCount++).toString();
        }
        this.canvas.clear();
        this.canvas.off();
        for (var i = 0; i < categories.values.length; i++) {
            this.canvas.add(this.makeHex(names.values[i].toString(),
                this.x[parseInt(hexval[0].values[i].toString())],
                this.y[parseInt(hexval[1].values[i].toString())],
                this.c[parseInt(hexval[2].values[i].toString())],
                parseInt(categories.values[i].toString())))
        }
        this.canvas.on('mouse:down', e => {
            let thisobject = 'canvas'
            if (e.target != null) {
                thisobject = ('name' in e.target) ? 'group' : 'other'
            }
            console.log("mouse down: ", typeof (e.target), thisobject);
            if (this.updateCount != null) {
                console.log("data ready")
            } else {
                console.log("data not present")
            }
            if (thisobject == 'group') {
                let categories: DataViewCategoricalColumn = this.dataViews[0].categorical.categories[0];

                let columnTarget: IFilterColumnTarget = {
                    table: categories.source.queryName.substr(0, categories.source.queryName.indexOf('.')),
                    column: categories.source.displayName
                };
                let values = [e.target.name];
                let filter = new BasicFilter(columnTarget, "In", values);
                this.visualHost.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
            }
        })


    }


    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
    private makeHex(id: string, left: number, top: number, colour: string, code: number): fabric.Group {
        let poly = new fabric.Polygon([{ x: 112, y: 30 }, { x: 60, y: 0 }, { x: 8, y: 30 },
        { x: 8, y: 90 }, { x: 60, y: 120 }, { x: 112, y: 90 }],
            {
                left: 0,
                top: 0,
                height: 200,
                width: 200,
                fill: colour,
                scaleX: this.scale,
                scaleY: this.scale
            }
        )
        let s = id.split("\n");
        let m = Math.max(...s.map(el => el.length));
        let t = (s.length == 1 ? 40 : 30)
        t = (s.length == 3 ? 20 : t)
        let l = (m < 9 ? 23 - m / 2 : 7)

        let textbox = new fabric.Textbox(id, {
            left: l,
            top: t,
            width: 25,
            fontSize: 16,
            textAlign: 'center'
        });
        //   canvas.add(textbox);
        let group = new fabric.Group([poly, textbox],
            {
                left: left,
                top: top,
                name: code.toString(),
                selectable: false,
                hoverCursor: "pointer"
            });

        // Add shadow
        let shadow = "2px 5px 5px rgba(94, 128, 191, 0.5)";
        group.setShadow(shadow);
        //

        group.on('mouseover', function (e) {
            group.animate('opacity', .8, {
                duration: 1000,
                onChange: this.canvas.renderAll.bind(this.canvas),
                onComplete: function () {
                    group.set({ opacity: 1 });
                }
            });
            this.canvas.renderAll();
            //console.log(e.target.name);
        });

        return group;
    }
    public hexClick(name: string) {

        let categories: DataViewCategoricalColumn = this.dataViews[0].categorical.categories[0];

        let target: IFilterColumnTarget = {
            table: categories.source.queryName.substr(0, categories.source.queryName.indexOf('.')),
            column: categories.source.displayName
        };
        // console.log("Target: " + target);
        let values = [name];
        let filter = new BasicFilter(target, "In", values);
        this.visualHost.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
    }
}
