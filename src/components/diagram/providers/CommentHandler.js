import { randomID } from '../umlUtil';
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout'
import { createDiagramEdge } from '../api/diagramInterchange';
import { createElementUpdate } from '../../../umlUtil';

export default class CommentHandler {
	constructor(eventBus, umlWebClient, diagramContext, modelElementMap, elementRegistry, elementFactory, canvas, diagramEmitter) {
		eventBus.on('diagramElementCreated', (event) => {
			const element = event.element;
			if (element.modelElement && element.modelElement.elementType() === 'comment') {
				// draw anchors
				let annotatedElements = element.modelElement.annotatedElements;
				if (annotatedElements.subSets) {
					// make work with set
					annotatedElements = annotatedElements.ids();
				}
				for (let el of annotatedElements) {
					const elMap = modelElementMap.get(el);
					for (let elm of elMap) {
						const target = elementRegistry.get(elm);
						const anchor = elementFactory.createConnection({
							id: randomID(),
							source: element,
							target: target,
							waypoints: connectRectangles(element, target, getMid(element), getMid(target)),
							modelElement: element.modelElement,
							children: [],
						});
						canvas.addConnection(anchor);
						createDiagramEdge(anchor, umlWebClient, diagramContext);
					}
				}
			}
		});
		eventBus.on('elementCreated', (event) => {
			const element = event.element;
			if (element.modelElement.elementType() === 'comment') {
				// create comment
				const commentID = element.modelElement.id;
				let annotatedElements = element.modelElement.annotatedElements;
				if (annotatedElements.subSets) {
					// make work with set
					annotatedElements = annotatedElements.ids();
				}
				let comment = umlWebClient.post('comment', {id:commentID});
				for (let el of annotatedElements) {
					comment.annotatedElements.add(el);
				}
				diagramContext.context.ownedComments.add(comment);
				umlWebClient.put(comment);
				umlWebClient.put(diagramContext.context);
				for (const el of modelElementMap.get(commentID)) {
					elementRegistry.get(el).modelElement = comment;
				}
				diagramEmitter.fire('elementUpdate', createElementUpdate(diagramContext.context));
			}
		});
		eventBus.on('diagramElementDeleted', (event) => {
			const element = event.element;
			if (element.modelElement.elementType() === 'comment') {
				// remove anchors
				for (const anchor of element.incoming) {
					canvas.removeConnection(anchor);
				}
				for (const anchor of element.outgoing) {
					canvas.removeConnection(anchor);
				}
			}
		});
		eventBus.on('elementDeleted', (event) => {
			const element = event.element;
			if (element.modelElement.elementType() === 'comment') {
				// delete comment
				const doLater = async () => {
					umlWebClient.deleteElement(await umlWebClient.get(element.modelElement.id));
				}
				doLater();
			}
		});
	}
}

CommentHandler.$inject = ['eventBus', 'umlWebClient', 'diagramContext', 'modelElementMap', 'elementRegistry', 'elementFactory', 'canvas', 'diagramEmitter'];
