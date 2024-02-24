export default class UserSelection {

    users = new Map();

    constructor(diagramEmitter, eventBus, elementRegistry, canvas, umlWebClient, selectionVisuals) {
        diagramEmitter.on('user.selected', (event) => {
            // TODO add relevant marker to element
            const elementSelected = elementRegistry.get(event.id);
            if (elementSelected) {
                const marker = getMarkerForColor(event.color);
                if (!marker) {
                    throw Error("bad color given for user selection in diagram!");
                }
                let selectedElements = this.users.get(event.color);
                if (!selectedElements) {
                    selectedElements = [];
                    this.users.set(event.color, selectedElements);
                }
                if (!selectedElements.includes(elementSelected)) {
                    selectedElements.push(elementSelected);
                }
                canvas.addMarker(elementSelected, marker);
            }
        });
        diagramEmitter.on('user.deselected', (event) => {
            for (const elementID of event.elements) {
                const elementSelected = elementRegistry.get(elementID);
                if (elementSelected) {
                    const marker = getMarkerForColor(event.color);
                    if (!marker) {
                        throw Error("bad color given for user deselect in diagram!");
                    }
                    let selectedElements = this.users.get(event.color);
                    if (!selectedElements) {
                        throw Error("bad state, deselection given for element not selected by that user in diagram!");
                    }
                    selectedElements.splice(selectedElements.indexOf(elementSelected), 1);
                    canvas.removeMarker(elementSelected, marker);
                }
            }
        });
        eventBus.on('selection.changed', (event) => {
            const oldSelection = event.oldSelection;
            const newSelection = event.newSelection;
            const elsToDeselect = oldSelection.filter(el => !newSelection.includes(el));
            const elsToSelect = newSelection.filter(el => !oldSelection.includes(el));
            for (const el of elsToDeselect) {
                umlWebClient.deselect(el.id)
            }
            for (const el of elsToSelect) {
                umlWebClient.select(el.id);
            }
        });

        eventBus.on('selection.changed', 900, function(event) {

            function select(s) {
                canvas.removeMarker(s, 'selected');
                canvas.addMarker(s, getMarkerForColor(umlWebClient.client.color));
            }

            const oldSelection = event.oldSelection,
            newSelection = event.newSelection;

            oldSelection.forEach((e) => {
                if (newSelection.indexOf(e) === -1) {
                    canvas.removeMarker(e, getMarkerForColor(umlWebClient.client.color));
                }
            });

            newSelection.forEach((e) => {
                if (oldSelection.indexOf(e) === -1) {
                    select(e);
                }
            });

            selectionVisuals._updateSelectionOutline(newSelection);
});
    }
}

UserSelection.$inject = ['diagramEmitter', 'eventBus', 'elementRegistry', 'canvas', 'umlWebClient', 'selectionVisuals'];

function getMarkerForColor(color) {
    switch (color) {
        case 'var(--uml-cafe-red-user)':
        case 'Red':
            return 'redUser';
        case 'var(--uml-cafe-blue-user)':
        case 'Blue':
            return 'blueUser';
        case 'var(--uml-cafe-green-user)':
        case 'Green':
            return 'greenUser';
        case 'var(--uml-cafe-yellow-user)':
        case 'Yellow':
            return 'yellowUser';
        case 'var(--uml-cafe-magenta-user)':
        case 'Magenta':
            return 'magentaUser';
        case 'var(--uml-cafe-lime-user)':
        case 'Lime':
            return 'limeUser';
        case 'var(--uml-cafe-orange-user)':
        case 'Orange':
            return 'orangeUser';
        case 'var(--uml-cafe-cyan-user)':
        case 'Cyan':
            return 'cyanUser'
        default: return undefined;
    }
}
