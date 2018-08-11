"use babel";
export default class AtomLineMarkerModal {
    constructor(serializedState) {
        // Create root element
        this.element = document.createElement("div");
        this.element.classList.add("alm-modal");

        // Create message element
        const message = document.createElement("div");
        message.innerHTML = "<h3>Comment</h3>";
        message.classList.add("message");

        this.input = document.createElement("textarea");
        this.input.classList.add("alm-input");

        const actionBar = document.createElement("div");
        actionBar.classList.add("alm-actionbar");

        this.resolve = document.createElement("a");
        this.resolve.classList.add("btn", "btn-secondary", "left");
        this.resolve.textContent = "Resolve";
        this.resolve.addEventListener("click", event => {
            event.preventDefault();
            if (this._onResolve) {
                this._onResolve.apply(null, this.data);
            }
        });
        actionBar.appendChild(this.resolve);

        const confirm = document.createElement("a");
        confirm.classList.add("btn", "btn-primary");
        confirm.textContent = "Save";
        confirm.addEventListener("click", event => {
            event.preventDefault();
            if (this._onSave) {
                this._onSave.apply(null, this.data);
            }
        });
        actionBar.appendChild(confirm);

        const cancel = document.createElement("a");
        cancel.classList.add("btn");
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", event => {
            event.preventDefault();
            if (this._onCancel) {
                this._onCancel.apply(null, null);
            }
        });
        actionBar.appendChild(cancel);

        message.appendChild(this.input);
        message.appendChild(actionBar);
        this.element.appendChild(message);
    }

    updateMarker(marker, row) {
        if (marker && marker.hasComment(row) != "") {
            this.resolve.style.display = "inline-block";
        } else {
            this.resolve.style.display = "none";
        }
        this.input.value = marker.hasComment(row);
        this.data = [marker, row];
    }

    onSave(callback) {
        this._onSave = callback;
    }
    onCancel(callback) {
        this._onCancel = callback;
    }
    onResolve(callback) {
        this._onResolve = callback;
    }
    onShow(callback) {
        this._onShow = callback;
    }
    show() {
        if (this._onShow) {
            this._onShow();
        }
    }
    // Returns an object that can be retrieved when package is activated
    serialize() {}

    // Tear down any state and detach
    destroy() {
        if (this.element) this.element.remove();
    }

    getElement() {
        return this.element;
    }
}
