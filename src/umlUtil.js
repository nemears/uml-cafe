import { randomID } from "./components/diagram/umlUtil";

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
