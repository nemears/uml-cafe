import { randomID } from "uml-client/lib/element";
import { createClassDiagram } from "./diagram/api/diagramInterchange";
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

export async function createUmlClassDiagram(diagramID, owner, umlWebClient) {
    const diagramPackage = umlWebClient.post('package', {id:diagramID});
    owner.packagedElements.add(diagramPackage);
    diagramPackage.name = owner.name;
    const diagramStereotypeInstance = umlWebClient.post('instanceSpecification');
    diagramStereotypeInstance.classifiers.add(await umlWebClient.get('Diagram_nuc1IC2Cavgoa4zMBlVq'));
    // TODO slots

    diagramPackage.appliedStereotypes.add(diagramStereotypeInstance);
    umlWebClient.put(diagramStereotypeInstance);

    // setup diagram instance
    const diagramContext = {
        diagram : diagramPackage,
        context: owner,
    };
    const proxyDiagramObject = {
        id: randomID(),
        modelElement: owner,
        children: [],
    };
    await createClassDiagram(proxyDiagramObject, umlWebClient, diagramContext);
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

export function mapClientColor(color) {
    switch (color) {
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
            return mapClientColor(umlWebClient.color) + 'Light';
        } else {
            return mapClientColor(umlWebClient.color);
        }
    }
}

export function getProjectLoginObject(wholeProjectName, serverAddress) {
    const projectNameSplit = wholeProjectName.split('/');
    const groupName = projectNameSplit[projectNameSplit.length - 2];
    const projectName = projectNameSplit[projectNameSplit.length - 1];

    // check for stashed user and passwordHash
    let user = sessionStorage.getItem('user');
    let passwordHash = sessionStorage.getItem('passwordHash');
    if (user === 'null' || user === 'undefined') {
        user = undefined;
    }
    if (passwordHash === 'null' || user === 'undefined') {
        passwordHash = undefined;
    }

    return {
        address: serverAddress,
        group: groupName,
        project: projectName,
        user: user,
        passwordHash: passwordHash,
        create: groupName !== 'sessions',
    }
}
