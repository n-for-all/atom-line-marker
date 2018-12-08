"use babel";

import AtomLineMarkerView from "./atom-line-marker-view";
import { CompositeDisposable } from "atom";
import AtomLineMarker from "./atom-line-marker-class";
import AtomLineMarkerStatusBar from "./atom-line-marker-statusbar";
import AtomLineMarkerModal from "./atom-line-marker-modal";

export default {
    atomLineMarkerView: null,
    modal: null,
    modalPanel: null,
    subscriptions: null,
    markers: [],
    statusBarTile: null,

    activate(state) {
        this.atomLineMarkerView = new AtomLineMarkerView(state.atomLineMarkerViewState);
        this.modal = new AtomLineMarkerModal("");
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.modal.getElement(),
            visible: false
        });
        this.modal.onSave((marker, row) => {
            marker.addComment(row, this.modal.input.value);
            if(this.modalPanel) this.modalPanel.hide();
        });
        this.modal.onCancel(() => {
            if(this.modalPanel) this.modalPanel.hide();
        });
        this.modal.onResolve((marker, row) => {
            marker.setResolved(row);
            if(this.modalPanel) this.modalPanel.hide();
        });
        this.modal.onShow(() => {
            this.modalPanel.show();
        });
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(
            atom.workspace.observeTextEditors(textEditor => {
                let marker = new AtomLineMarker(textEditor, this.getData(state, textEditor.buffer && textEditor.buffer.file ? textEditor.buffer.file.path : ""), this);
                this.markers.push({ path: textEditor.buffer && textEditor.buffer.file ? textEditor.buffer.file.path : "", marker: marker });
                var textEditorDisposable = new CompositeDisposable(
                    marker,
                    textEditor.onDidDestroy(() => {
                        textEditorDisposable.dispose();
                        this.subscriptions.remove(textEditorDisposable);
                    })
                );

                this.subscriptions.add(textEditorDisposable);
            })
        );
        this.subscriptions.add(
            atom.workspace.observeActivePaneItem(textEditor => {
                if (textEditor && textEditor.buffer && textEditor.buffer.file) {
                    let path = textEditor.buffer.file.path;
                    let marker = this.getMarkerByPath(path);
                    if (marker) {
                        marker.updateStatusBar();
                    }
                }
            })
        );
    },
    consumeStatusBar(statusBar) {
        this.statusBar = new AtomLineMarkerStatusBar(this.markers);
        this.statusBarTile = statusBar.addRightTile({ item: this.statusBar.getElement(), priority: 1 });
    },
    getStatusBar() {
        return this.statusBar ? this.statusBar : null;
    },
    getModal() {
        return this.modal ? this.modal : null;
    },
    getMarkerByPath(path) {
        if (this.markers) {
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i].path == path) {
                    return this.markers[i].marker;
                }
            }
        }
        return null;
    },
    getData(state, path) {
        if (path != "" && state && state.atomLineMarkerViewState && state.atomLineMarkerViewState.length > 0) {
            for (var i = 0; i < state.atomLineMarkerViewState.length; i++) {
                if (state.atomLineMarkerViewState[i].path == path) {
                    return state.atomLineMarkerViewState[i].marks;
                }
            }
        }
        return null;
    },

    deactivate() {
        this.subscriptions.dispose();
        this.atomLineMarkerView.destroy();
        if (this.statusBarTile) {
            this.statusBarTile.destroy();
            this.statusBarTile = null;
        }
    },

    serialize() {
        let markers = [];
        if (this.markers.length > 0) {
            this.markers.forEach(obj => {
                let data = obj.marker.serialize();
                if (data) {
                    markers.push({ path: obj.path, marks: data });
                }
            });
        }
        return {
            atomLineMarkerViewState: markers
        };
    }
};
