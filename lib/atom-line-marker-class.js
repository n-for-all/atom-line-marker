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
                this.updateMarker(mark.row, mark.comment);
            });
        }
        let element = atom.views.getView(textEditor);
        let container = element.querySelector(".gutter-container .gutter.line-numbers");
        this.path = textEditor.buffer && textEditor.buffer.file ? textEditor.buffer.file.path : "";
        container.addEventListener("mousedown", event => {
            var handler = this.toggle;
            if (event.which == 1 && (event.metaKey || event.altKey)) {
                handler = this.setupModal;
            }
            for (var target = event.target; target && target != this; target = target.parentNode) {
                if (target.matches(".line-number")) {
                    event.preventDefault();
                    event.stopPropagation();
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
    setupModal = () => {
        if (!this.editor) {
            return;
        }
        let point = this.editor.getCursorBufferPosition();
        if (!this.editor.gutterWithName("line-number").visible) return;

        let marker = this.createMarker(point.row);
        let modal = this.parent.getModal();
        if (modal) {
            modal.updateMarker(this, point.row);
            modal.show();
        }
    };
    updateMarker(row, comment) {
        let marker = null;
        if ((marker = this.hasMarker(row))) {
            marker.comment = comment;
        } else {
            marker = this.createMarker(row);
            marker.comment = comment;
        }
        this.fixTooltip(marker, row - 1, 20000);
        return marker;
    }
    createMarker(row) {
        let marker = null;
        if ((marker = this.hasMarker(row))) return marker;
        let editorMarker = this.editor.markBufferPosition({ row: row - 1, column: 0 });
        this.editor.decorateMarker(editorMarker, {
            type: "line-number",
            class: "atom-marked"
        });

        editorMarker.onDidChange((point, any) => {
            if (!point) {
                return;
            }

            //if we added or removed 1 line
            if (point.newHeadBufferPosition.row == point.oldHeadBufferPosition.row + 1 || point.newHeadBufferPosition.row == point.oldHeadBufferPosition.row - 1) {
                let mark = this.hasMarker(point.oldHeadBufferPosition.row + 1);

                if (mark) {
                    delete this.marks[point.oldHeadBufferPosition.row + 1];
                    this.marks[point.newHeadBufferPosition.row + 1] = mark;
                    row = point.newHeadBufferPosition.row + 1;
                    this.fixTooltip(mark, row - 1);
                }
            } else {
                //if the line difference is more, i.e beautify (ruins the marker position), in such case keep the marker where it is
                let mark = this.hasMarker(row);

                if (mark) {
                    delete this.marks[row];
                    let newMark = this.createMarker(row);
                    newMark.comment = mark.comment;
                    if (mark.marker) mark.marker.destroy();
                    if (mark.tooltip) mark.tooltip.dispose();
                    this.fixTooltip(newMark, row - 1);
                }
            }
        });

        marker = this.setMarker(row, editorMarker);
        this.updateStatusBar();
        return marker;
    }
    fixTooltip(mark, row, wait?) {
        if(!wait){
            wait = 0;
        }
        if (mark.tooltip) mark.tooltip.dispose();
        if (mark.comment != "") {
            setTimeout(() => {
                let element = document.querySelector('.gutter.line-numbers .line-number.atom-marked[data-buffer-row="' + (row) + '"]');
                if(element){
                    mark.tooltip = atom.tooltips.add(element, { title: mark.comment });
                }
            }, wait);
        }
    }
    updateStatusBar() {
        let statusBar = this.parent.getStatusBar();
        if (statusBar) {
            statusBar.updateCount(Object.keys(this.marks).length);
        }
    }
    hasMarker(row) {
        return this.marks[row] ? this.marks[row] : null;
    }
    hasComment(row) {
        return this.marks[row] && this.marks[row].comment && this.marks[row].comment != "" ? this.marks[row].comment : "";
    }
    clearMarker(row) {
        if (!this.hasMarker(row)) return;
        this.marks[row].marker.destroy();
        delete this.marks[row];
        this.updateStatusBar();
    }
    clearMarkers(row) {
        Object.keys(this.marks).map(key => {
            if (this.marks[key] && this.marks[key].marker) {
                this.marks[key].marker.destroy();
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
        if (this.hasMarker(point.row)) {
            this.clearMarker(point.row);
        } else {
            this.createMarker(point.row);
        }
    };
    addComment(row, comment) {
        let mark = this.createMarker(row);
        if (mark) {
            mark.comment = comment;
        }
        this.marks[row] = mark;
        this.fixTooltip(mark, row - 1);
    }
    setResolved(row) {
        let mark = this.createMarker(row);
        if (mark) {
            mark.resolved = true;
        }
        this.marks[row] = mark;
    }
    getMarker(row) {
        return this.marks[row];
    }
    setMarker(row, marker) {
        this.marks[row] = { comment: "", marker: marker };
        return this.marks[row];
    }

    goToMarkerIndex(index) {
        let keys = Object.keys(this.marks);
        if (keys.length == 0) {
            return;
        }
        if (keys[index] && this.marks[keys[index]] && this.marks[keys[index]].marker) {
            let markerPoint = this.marks[keys[index]].marker.getHeadBufferPosition();
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
                marks.push({ row: key, comment: this.marks[key].comment });
            });
            return marks;
        }
        return null;
    }
}
