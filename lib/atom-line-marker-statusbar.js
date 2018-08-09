"use babel";
export default class AtomLineMarkerStatusBar {
    constructor(markers) {
        // Create root element
        this.element = document.createElement("span");
        this.element.classList.add("atom-line-marker-status");

        this.count = document.createElement("span");
        this.count.classList.add("alm-count");
        this.element.appendChild(this.count);

        this.previous = document.createElement("a");
        this.previous.classList.add("alm-previous");
        this.previous.innerHTML = '<span class="icon"></span>';
        // this.previous.textContent = 'prev';
        this.previous.addEventListener('click', (event) => {
            event.preventDefault();
            let editor = atom.workspace.getActivePaneItem();
            let file = editor && editor.buffer && editor.buffer.file ? editor.buffer.file.path : null;
            if (file) {
                markers.some((obj) => {
                    if(obj.path == file){
                        obj.marker.goToMarker(-1);
                    }
                });
            }
        });
        this.element.appendChild(this.previous);

        this.next = document.createElement("a");
        this.next.classList.add("alm-next");
        this.next.innerHTML = '<span class="icon"></span>';
        this.next.addEventListener('click', (event) => {
            event.preventDefault();
            let editor = atom.workspace.getActivePaneItem();
            let file = editor && editor.buffer && editor.buffer.file ? editor.buffer.file.path : null;
            if (file) {
                markers.some((obj) => {
                    if(obj.path == file){
                        obj.marker.goToMarker(1);
                    }
                });
            }
        });
        this.element.appendChild(this.next);
    }
    updateCount(count){
        if(this.count){
            this.count.textContent = count;
        }
    }
    // Returns an object that can be retrieved when package is activated
    serialize() {}

    // Tear down any state and detach
    destroy() {
        if(this.element) this.element.remove();
    }

    getElement() {
        return this.element;
    }
}
