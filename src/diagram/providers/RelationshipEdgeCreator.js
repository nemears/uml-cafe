import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout';
import { randomID } from 'uml-client/lib/types/element.js'
import { getTextDimensions } from './ClassDiagramPaletteProvider';

export default class RelationshipEdgeCreator {

    constructor(commandStack, elementRegistry, elementFactory, umlRenderer, modelElementMap) {
        this._commandStack = commandStack;
        this._elementRegistry = elementRegistry;
        this._elementFactory = elementFactory;
        this._umlRenderer = umlRenderer;
        this._modelElementMap = modelElementMap;
    }
    
    /**
     * context:
     *  {
     *      elements: [] // list of uml relationships to draw
     *  }
    **/
    async create(context) {
        const commandStack = this._commandStack,
        elementRegistry = this._elementRegistry,
        elementFactory = this._elementFactory,
        umlRenderer = this._umlRenderer,
        modelElementMap = this._modelElementMap;
        const elementsToCreate = [];
        for (const element of context.elements) {
            if (element.elementType() === 'association') {
                const association = element;
                let targets, sources;
                for await (const end of association.memberEnds) {
                    if (!end.type.has()) {
                        throw Error('Invalid association state, all ends must have types to draw!');
                    }
                    if (association.navigableOwnedEnds.contains(end) && !sources) {
                        sources = modelElementMap.get(end.type.id());
                    } else if (association.ownedEnds.contains(end) && !sources) {
                        sources = modelElementMap.get(end.type.id());
                    } else if (!targets) {
                        targets = modelElementMap.get(end.type.id());
                    } else if (!sources) {
                        sources = modelElementMap.get(end.type.id());
                    } else {
                        throw Error('bad state');
                    }
                }

                for (const sourceID of sources) {
                    const source = elementRegistry.get(sourceID);
                    if (source.elementType !== 'classifierShape') {
                        continue;
                    }
                    for (const targetID of targets) {
                        const target = elementRegistry.get(targetID);
                        if (target.elementType !== 'classifierShape') {
                            continue;
                        }
                        const associationEdge = elementFactory.createConnection({
                            id: randomID(),
                            source: source,
                            target: target,
                            waypoints: connectRectangles(source, target, getMid(source), getMid(target)),
                            modelElement: association,
                            elementType: 'edge',
                            children: [],
                            numCenterLabels: 0,
                            numTargetLabels: 0,
                            numSourceLabels: 0,
                        });
                        elementsToCreate.push(associationEdge);
                        
                        if (association.name !== '') {
                            elementsToCreate.push(createAssociationNameLabel(associationEdge, elementFactory, umlRenderer));
                        }
                        
                        for await (const end of association.memberEnds) {
                            const createEndLabels = (end, placement) => {
                                if (end.name !== '') {
                                    const textDimensions = getTextDimensions(end.name, umlRenderer);
                                    elementsToCreate.push(elementFactory.createLabel({
                                        id: randomID(),
                                        text: end.name,
                                        width: Math.round(textDimensions.width) + 15,
                                        height: 24,
                                        modelElement: end,
                                        placement: placement,
                                        elementType: 'associationEndLabel',
                                        labelTarget: associationEdge,
                                        owningElement: associationEdge,
                                    }));
                                }
                                if (end.lowerValue.has() && end.upperValue.has()) {
                                    // TODO
                                } 
                            };
                            if (end.type.id() === source.modelElement.id) {
                                createEndLabels(end, 'source');
                            } else if (end.type.id() === target.modelElement.id) {
                                createEndLabels(end, 'target');
                            }
                        }
                    }
                }

                
            } else {
                throw Error('TODO modelElementEdgeCreator create ' + element.elementType() + '!');
            }
        }

        commandStack.execute('elementCreation', {
            elements: elementsToCreate
        });
    }
}

RelationshipEdgeCreator.$inject = ['commandStack', 'elementRegistry', 'elementFactory', 'umlRenderer', 'modelElementMap']; 

export function createAssociationNameLabel(associationEdge, elementFactory, umlRenderer) {
    const association = associationEdge.modelElement;
    const textDimensions = getTextDimensions(association.name, umlRenderer);
    return elementFactory.createLabel({
        id: randomID(),
        text: association.name,
        width: Math.round(textDimensions.width) + 15,
        height: 24,
        placement: 'center',
        elementType: 'nameLabel',
        modelElement: association,
        labelTarget: associationEdge,
        parent: associationEdge,
    });
}
