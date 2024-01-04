import { randomID } from '../umlUtil';
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'
import { createDiagramEdge } from '../api/diagramInterchange';

export default class CommentHandler {
  constructor(eventBus, umlWebClient, diagramContext, modelElementMap, elementRegistry, modeling) {
    eventBus.on('shape.added', (event) => {
      if (event.element.newUMLElement && event.element.modelElement.elementType() === 'comment') {
        const createComment = async () =>{
          const commentID = event.element.modelElement.id;
          const annotatedElements = event.element.modelElement.annotatedElements;
          let comment = await umlWebClient.post('comment', {id:commentID});
          for (let el of annotatedElements) {
              comment.annotatedElements.add(el);
              const elMap = modelElementMap.get(el);
              for (let elm of elMap) {
                  const target = elementRegistry.get(elm);
                  const anchor = modeling.connect(
                      event.element,
                      target,
                      {
                        source: event.element,
                          target: target,
                          waypoints: connectRectangles(event.element, target, getMid(event.element), getMid(target)),
                          id: randomID(),
                          modelElement: comment,
                      }
                  );
                  createDiagramEdge(anchor, umlWebClient, diagramContext);
              }
          }
          diagramContext.context.ownedComments.add(comment);
          umlWebClient.put(comment);
          umlWebClient.put(diagramContext.context);
          await umlWebClient.get(commentID);
          event.element.modelElement = comment;
        }
        createComment();
      }
    });
  }
}

CommentHandler.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'modelElementMap', 'elementRegistry', 'modeling'];