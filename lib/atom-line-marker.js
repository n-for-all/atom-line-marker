"use babel";

import AtomLineMarkerView from "./atom-line-marker-view";
import { CompositeDisposable } from "atom";
import AtomLineMarker from "./atom-line-marker-class";

export default {
    atomLineMarkerView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.atomLineMarkerView = new AtomLineMarkerView(state.atomLineMarkerViewState);

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(
            atom.workspace.observeTextEditors(textEditor => {
                var textEditorDisposable = new CompositeDisposable(
                    new AtomLineMarker(textEditor),

                    textEditor.onDidDestroy(() => {
                        textEditorDisposable.dispose();
                        this.disposables.remove(textEditorDisposable);
                    })
                );

                this.subscriptions.add(textEditorDisposable);
            })
        );
    },

    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.atomLineMarkerView.destroy();
    },

    serialize() {
        return {
            atomLineMarkerViewState: this.atomLineMarkerView.serialize()
        };
    },

    toggle() {
        console.log("AtomLineMarker was toggled!");
        return this.modalPanel.isVisible() ? this.modalPanel.hide() : this.modalPanel.show();
    }
};
