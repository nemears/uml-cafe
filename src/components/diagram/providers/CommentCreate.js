import { randomID } from '../umlUtil';

function createCommentClick (event) {
    const commentID = randomID();
    const shapeID = randomID();
    var comment = elementFactory.createShape({
      width: 100,
      height: 80,
      id: shapeID,
      modelElement : {
        id: commentID,
        elementType() {
          return 'comment';
        }
      },
      newUMLElement: true,
    });

    create.start(event, comment);
}