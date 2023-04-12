export default function InteractWithModel(eventBus, umlWebClient, diagramEmitter, diagramContext) {
    eventBus.on('shape.added', async function(event) {
        if (!event.element.newUMLElement) {
            return;
        }

        const classID = event.element.elementID;

        let clazz = await umlWebClient.post('class', {id:classID});
        diagramContext.context.packagedElements.add(clazz);
        umlWebClient.put(clazz);
        umlWebClient.put(diagramContext.context);
        let newClazz = await umlWebClient.get(classID);
        console.log(newClazz.name);
        diagramEmitter.fire('shape.added', event);
        

        // send message to server
        // umlWebClient.write({
        //     createClass:
        //     {
        //         id: event.element.elementID,
        //         shape: event.element.shapeID,
        //         x: event.element.x,
        //         y: event.element.y
        //     }
        // });

        // containmentTree.refresh();
        // vscode.postMessage({
        //     createClass:
        //     {
        //         id: event.element.elementID,
        //         shape: event.element.shapeID,
        //         x: event.element.x,
        //         y: event.element.y
        //     }
        //   });
    });

    eventBus.on('shape.remove', (event) => {
        if (event.element.classLabel) {
            return;
        }
        vscode.postMessage({
            removeShape : {
                id: event.element.shapeID
            }
        });
        for (let path of event.element.incoming) {
            vscode.postMessage({
                removeShape : {
                    id: path.shapeID
                }
            });
        }
        for (let path of event.element.outgoing) {
            vscode.postMessage({
                removeShape : {
                    id: path.shapeID
                }
            });
        }
    });

    eventBus.on('shape.move.end', function(event) {
        vscode.postMessage({
            moveShape:
            {
                shape: event.shape.shapeID,
                x: event.shape.x,
                y: event.shape.y
            }
        });
        if (event.shape.incoming) {
            for (let path of event.shape.incoming) {
                vscode.postMessage({
                    movePath:
                    {
                        path: path.shapeID,
                        waypoints: path.waypoints
                    }
                });
            }
        }
        if (event.shape.outgoing) {
            for (let path of event.shape.outgoing) {
                vscode.postMessage({
                    movePath:
                    {
                        path: path.shapeID,
                        waypoints: path.waypoints
                    }
                });
            }
        }
    });

    eventBus.on('element.dblclick', function(event) {
        if (event.element.classLabel) {
            vscode.postMessage({
                nameElement:
                {
                    id: event.element.labelTarget.elementID,
                    name: event.element.labelTarget.name ? event.element.labelTarget.name : ''
                }
            });
        } else if (event.element.umlType === 'class' || event.element.umlType === 'generalization') {
            vscode.postMessage({
                specification: event.element.elementID
            });
        }
    });
}

InteractWithModel.$inject = ['eventBus', 'umlWebClient', 'diagramEmitter', 'diagramContext'];