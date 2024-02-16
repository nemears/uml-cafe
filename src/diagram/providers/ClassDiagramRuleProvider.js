import inherits from 'inherits';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default function ClassDiagramRuleProvider(eventBus) {
  RuleProvider.call(this, eventBus);
}

ClassDiagramRuleProvider.$inject = [ 'eventBus' ];

inherits(ClassDiagramRuleProvider, RuleProvider);


ClassDiagramRuleProvider.prototype.init = function() {
  this.addRule('shape.create', function(context) {
    var target = context.target,
        shape = context.shape;

    return target.parent === shape.target;
  });

  this.addRule('connection.create', function(context) {
    var source = context.source,
        target = context.target;

    return source.parent === target.parent;
  });
};
