import { randomID } from "uml-client/lib/types/element";
import { generate } from 'uml-client/lib/generate';

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
    if (newElement.is('NamedElement')) {
        return newElement.name;
    } else if (newElement.is('Comment')) {
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

export async function createUmlClassDiagram(diagramID, owner, umlWebClient, umlCafeModule) {
    console.log('diagram id : ' + diagramID);
    await umlCafeModule.initialization;
    const diagramPackage = umlWebClient.post('Package', {id:diagramID});
    owner.packagedElements.add(diagramPackage);
    diagramPackage.name = owner.name;
    
    const diManager = new umlCafeModule.module.UMLManager(diagramPackage);
    const umlDiagram = await diManager.apply(diagramPackage, 'uml-cafe-profile.Diagram');
    umlDiagram.isFrame = false; // TODO turn to true when https://forum.bpmn.io/t/contextpad-dom-events-untriggered-in-frame/10818 is resolved 
    const proxyElement = diManager.post('uml-cafe-profile.ProxyElement');
    proxyElement.modelElementID = owner.id;
    
    await diManager.put(proxyElement);
    await umlDiagram.modelElement.add(proxyElement);
    umlDiagram.name = owner.name;
    
    await diManager.put(umlDiagram);
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

export function getPanelClass(selected, hover, currentUsers, umlWebClient, theme) {
    if (!selected) {
        if (currentUsers.length > 0) {
            return currentUsers[0];
        }
        let ret = 'elementExplorerPanel';
        ret += theme.charAt(0).toUpperCase() + theme.slice(1);
        if (hover) {
            return ret + 'Hover';
        }
        return ret;
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
    let password = sessionStorage.getItem('password');
    if (user === 'null' || user === 'undefined') {
        user = undefined;
    }
    if (password === 'null' || user === 'undefined') {
        password = undefined;
    }

    return {
        address: serverAddress,
        group: groupName,
        project: projectName,
        user: user,
        password: password,
        create: groupName !== 'sessions',
    }
}
export function isTypedElement(elementType) {
    return elementType === 'Property';
}

export class UmlCafeModule {
    constructor(umlClient) {
        const initializationPromise = async () => {
            await umlClient.initialization;
            const uml = await umlClient.get('UML_r67OnwwyTHCtCmWnZsd8ePh5');
            this.module = await generate(uml, umlClient);
        };
        this.initialization = initializationPromise();
    }
}
