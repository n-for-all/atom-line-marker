"use babel";
import { CompositeDisposable } from "atom";
import { AtomLineMarkerColors } from "./atom-line-marker-colors";

export default class AtomLineMarker {
    marks = {};
    path = "";
    current = -1;
    parent = null;
    constructor(textEditor, data, parent) {
        this.parent = parent;
        this.editor = textEditor;
        this.disposables = new CompositeDisposable(
            atom.commands.add(atom.views.getView(textEditor), {
                "atom-line-marker:toggle": () => this.toggle(),
                "atom-line-marker:clear-markers": () => this.clearMarkers(),
                "atom-line-marker:next-marker": () => this.goToMarker(1),
                "atom-line-marker:previous-marker": () => this.goToMarker(-1)
            })
        );
        if (data && data.length > 0) {
            data.forEach(mark => {
                this.createMarker(mark.row);
            });
        }
        let element = atom.views.getView(textEditor);
        let container = element.querySelector(".gutter-container .gutter.line-numbers");
        this.path = textEditor.buffer && textEditor.buffer.file ? textEditor.buffer.file.path : "";
        container.addEventListener("click", event => {
            event.preventDefault();
            var handler = this.toggle;
            for (var target = event.target; target && target != this; target = target.parentNode) {
                if (target.matches(".line-number")) {
                    handler.call(target, event);
                    break;
                }
            }
        });
    }

    dispose() {
        if (this.disposables.disposed) return;
        this.disposables.dispose();
        this.clearMarkers();
        [this.editor, this.marker, this.disposables] = [];
    }

    createMarker(row) {
        if (this.hasMarker(row)) return;
        let marker = this.editor.markBufferPosition({ row: row - 1, column: 0 });
        this.editor.decorateMarker(marker, {
            type: "line-number",
            class: "atom-marked"
        });

        // marker.onDidChange(({ isValid }) => {
        //     console.log("called", isValid);
        //     !isValid && this.clearMarker(row);
        // });
        this.setMarker(row, marker);
        this.updateStatusBar();
    }
    updateStatusBar() {
        let statusBar = this.parent.getStatusBar();
        if (statusBar) {
            statusBar.updateCount(Object.keys(this.marks).length);
        }
    }
    hasMarker(row) {
        return this.marks[row] ? true : false;
    }
    clearMarker(row) {
        if (!this.hasMarker(row)) return;
        this.marks[row].destroy();
        delete this.marks[row];
        this.updateStatusBar();
    }
    clearMarkers(row) {
        Object.keys(this.marks).map(key => {
            if (this.marks[key]) {
                this.marks[key].destroy();
            }
        });
        this.marks = {};
        this.updateStatusBar();
    }

    toggle = () => {
        if (!this.editor) {
            return;
        }
        let point = this.editor.getCursorBufferPosition();
        if (!this.editor.gutterWithName("line-number").visible) return;
        let marker = this.getMarker(point.row);
        if (marker) {
            this.clearMarker(point.row);
        } else {
            this.createMarker(point.row);
        }
    };
    getMarker(row) {
        return this.marks[row];
    }
    setMarker(row, marker) {
        this.marks[row] = marker;
    }

    goToMarkerIndex(index) {
        let keys = Object.keys(this.marks);
        if (keys.length == 0) {
            return;
        }
        if (keys[index] && this.marks[keys[index]]) {
            let markerPoint = this.marks[keys[index]].getHeadBufferPosition();
            if (!markerPoint) return;
            this.editor.setCursorBufferPosition(markerPoint);
            this.current = keys[index];
        }
    }
    goToMarker(direction) {
        let keys = Object.keys(this.marks);
        switch (direction) {
            case -1:
                if (this.current > 0 && this.marks[this.current]) {
                    let index = keys.indexOf(this.current);
                    this.goToMarkerIndex(keys[index - 1] ? index - 1 : keys.length - 1);
                } else {
                    //go to the end
                    this.goToMarkerIndex(keys.length - 1);
                }
                break;
            default:
                if (this.current > 0 && this.marks[this.current]) {
                    let index = keys.indexOf(this.current);
                    this.goToMarkerIndex(keys[index + 1] ? index + 1 : 0);
                } else {
                    //go to the first
                    this.goToMarkerIndex(0);
                }
                break;
        }
    }
    serialize() {
        let keys = Object.keys(this.marks);
        if (this.path != "" && keys.length > 0) {
            let marks = [];
            keys.forEach(key => {
                marks.push({ row: key });
            });
            return marks;
        }
        return null;
    }
}
