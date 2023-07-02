import { getMid } from 'diagram-js/lib/layout/LayoutUtil.js';
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout.js'

export default class UmlLayouter {
    layoutConnection(connection, hints) {
        const source = hints.source || connection.source;
        const target = hints.target || connection.target;
        return connectRectangles(source, target, getMid(source), getMid(target));       
    }
}
