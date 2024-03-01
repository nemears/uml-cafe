import { randomID } from "./diagram/umlUtil";
import { createDiagramElementFeatures } from "./diagram/api/diagramInterchange";
export function createElementUpdate() {
    const ret = {
        updatedElements: []
    };
    for (const el of arguments) {
        ret.updatedElements.push({
            newElement: el,
            oldElement: undefined, // TODO add a way to handle this for in client updates if needed probably not
        });
    }

    return ret;
}

export function deleteElementElementUpdate() {
    const ret = {
        updatedElements: []
    };
    for (const el of arguments) {
        ret.updatedElements.push({
            newElement: undefined,
            oldElement: el, // TODO add a way to handle this for in client updates if needed probably not
        });
    }

    return ret; 
}

export function createCommentClick (event, element, create, elementFactory) {
    const commentID = randomID();
    const shapeID = randomID();
    var comment = elementFactory.createShape({
      width: 100,
      height: 80,
      id: shapeID,
      modelElement : {
        id: commentID,
        annotatedElements: [element.modelElement.id],
        elementType() {
          return 'comment';
        }
      },
      newUMLElement: true,
      shapeType: 'shape',
    });

    create.start(event, comment);
}

export async function assignTabLabel(newElement) {
    if (newElement.isSubClassOf('namedElement')) {
        if (!newElement.name || newElement.name === '') {
            return '< >';
        } else if (newElement.name) {
            return newElement.name;
        }
    } else if (newElement.isSubClassOf('comment')) {
        if (newElement.annotatedElements.size() === 0) {
            return '< >';
        } else if (newElement.annotatedElements) {
            let label = "Comment of "
            for await (let el of newElement.annotatedElements) {
                if (el.name) {
                    label = label + el.name;

                } else {
                    label = label + '< >';
                }
            }
            return label;
        } 
    }
}

export async function createClassDiagram(diagramID, owner, umlWebClient) {
    const diagramPackage = umlWebClient.post('package', {id:diagramID});
    owner.packagedElements.add(diagramPackage);
    diagramPackage.name = owner.name;
    const diagramStereotypeInstance = umlWebClient.post('instanceSpecification');
    diagramStereotypeInstance.classifiers.add(await umlWebClient.get('Diagram_nuc1IC2Cavgoa4zMBlVq'));
    // TODO slots

    // setup diagram instance
    const diagramContext = {
        diagram : diagramPackage
    }
    const diagramInstance = await umlWebClient.post('instanceSpecification');
    await createDiagramElementFeatures(
        {
            id: diagramInstance.id,
            modelElement: {
                id: owner.id
            },
            children: []
        },
        umlWebClient,
        diagramInstance,
        diagramContext
    );
    diagramInstance.classifiers.add(await umlWebClient.get('U3CQzJden20cL0mG0nQN_HuWfisB'));
    diagramPackage.packagedElements.add(diagramInstance);

    diagramPackage.appliedStereotypes.add(diagramStereotypeInstance);
    umlWebClient.put(diagramStereotypeInstance);
    umlWebClient.put(diagramInstance);
    umlWebClient.put(diagramPackage);
    umlWebClient.put(owner);
    return diagramPackage;
} 

export function mapColor(color) {
    switch (color) {
        case 'var(--uml-cafe-red-user)': return 'redUserPanel'
        case 'var(--uml-cafe-blue-user)': return 'blueUserPanel'
        case 'var(--uml-cafe-green-user)': return 'greenUserPanel'
        case 'var(--uml-cafe-yellow-user)': return 'yellowUserPanel'
        case 'var(--uml-cafe-magenta-user)': return 'magentaUserPanel'
        case 'var(--uml-cafe-orange-user)': return 'orangeUserPanel'
        case 'var(--uml-cafe-cyan-user)': return 'cyanUserPanel'
        case 'var(--uml-cafe-lime-user)': return 'limeUserPanel'
    }
    return undefined;
}

export function getPanelClass(selected, hover, currentUsers, umlWebClient) {
    if (!selected) {
        if (currentUsers.length > 0) {
            return currentUsers[0];
        }
        if (hover) {
            return 'elementExplorerPanelLight';
        } else {
            return 'elementExplorerPanel'
        }
    } else {
        if (hover) {
            switch (umlWebClient.color) {
                case 'Blue':
                    return 'blueUserPanelLight';
                case 'Green':
                    return 'greenUserPanelLight';
                case 'Red':
                    return 'redUserPanelLight';
                case 'Yellow':
                    return 'yellowUserPanelLight';
                case 'Orange':
                    return 'orangeUserPanelLight';
                case 'Cyan':
                    return 'cyanUserPanelLight';
                case 'Magenta':
                    return 'magentaUserPanelLight';
                case 'Lime':
                    return 'limeUserPanelLight';
                default:
                    throw Error('Bad user color!');
            }
        } else {
            switch (umlWebClient.color) {
                case 'Blue':
                    return 'blueUserPanel';
                case 'Green':
                    return 'greenUserPanel';
                case 'Red':
                    return 'redUserPanel';
                case 'Yellow':
                    return 'yellowUserPanel';
                case 'Orange':
                    return 'orangeUserPanel';
                case 'Cyan':
                    return 'cyanUserPanel';
                case 'Magenta':
                    return 'magentaUserPanel';
                case 'Lime':
                    return 'limeUserPanel';
                default:
                    throw Error('Bad user color!'); 
            } 
        }
    }
}
