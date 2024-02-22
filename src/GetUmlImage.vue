<script>
import PackageSVG from './assets/icons/general/package.svg';
import ClassSVG from './assets/icons/general/class.svg';
import CommentSVG from './assets/icons/general/comment.svg';
import PropertySVG from './assets/icons/general/property.svg';
import AssociationSVG from './assets/icons/general/association.svg';
import GeneralizationSVG from './assets/icons/general/generalization.svg';
import StereotypeSVG from './assets/icons/general/stereotype.svg';
import LiteralBoolSVG from './assets/icons/general/literal_bool.svg';
import LiteralIntSVG from './assets/icons/general/literal_int.svg';
import LiteralNullSVG from './assets/icons/general/literal_null.svg';
import LiteralRealSVG from './assets/icons/general/literal_real.svg';
import LiteralStringSVG from './assets/icons/general/literal_string.svg';
import LiteralUnlimitedNaturalSVG from './assets/icons/general/literal_unlimited_natural.svg';
import InstanceSpecificationSVG from './assets/icons/general/instance_specification.svg';
import InstanceValueSVG from './assets/icons/general/instance_value.svg';
import SlotSVG from './assets/icons/general/slot.svg';
import DependencySVG from './assets/icons/general/dependency.svg';
import AbstractionSVG from './assets/icons/general/abstraction.svg';
import RealizationSVG from './assets/icons/general/realization.svg';
import UsageSVG from './assets/icons/general/usage.svg';
import DataTypeSVG from './assets/icons/general/data_type.svg';
import EnumerationSVG from './assets/icons/general/enumeration.svg';
import InterfaceSVG from './assets/icons/general/interface.svg';
import PrimitiveTypeSVG from './assets/icons/general/primitive_type.svg';
import SignalSVG from './assets/icons/general/signal.svg';

export default function getImage(el) {
    let elementType = typeof el === 'string' ? el : el.elementType();
    switch(elementType) {
        case 'abstraction': {
            return AbstractionSVG;
        }
        case 'association' : {
            return AssociationSVG;
        }
        case 'class': {
            return ClassSVG;
        }
        case 'comment': {
            return CommentSVG;
        }
        case 'dataType': {
            return DataTypeSVG;
        }
        case 'dependency': {
            return DependencySVG;
        }
        case 'enumeration': {
            return EnumerationSVG;
        }
        case 'enumerationLiteral': {
            return PropertySVG;
        }
        case 'extension': {
            return AssociationSVG;
        }
        case 'generalization': {
            return GeneralizationSVG;
        }
        case 'instanceSpecification': {
            return InstanceSpecificationSVG;
        }
        case 'instanceValue': {
            return InstanceValueSVG;
        }
        case 'interface': {
            return InterfaceSVG;
        }
        case 'literalBool': {
            return LiteralBoolSVG;
        }
        case 'literalInt': {
            return LiteralIntSVG;
        }
        case 'literalNull': {
            return LiteralNullSVG;
        }
        case 'literalReal': {
            return LiteralRealSVG;
        }
        case 'literalString': {
            return LiteralStringSVG;
        }
        case 'literalUnlimitedNatural': {
            return LiteralUnlimitedNaturalSVG;
        }
        case 'package': {
            return PackageSVG;
        }
        case 'primitiveType': {
            return PrimitiveTypeSVG;
        }
        case 'profile': {
            return PackageSVG;
        }
        case 'property': {
            return PropertySVG;
        }
        case 'realization': {
            return RealizationSVG;
        }
        case 'signal': {
            return SignalSVG;
        }
        case 'slot': {
            return SlotSVG;
        }
        case 'stereotype': {
            return StereotypeSVG;
        }
        case 'usage': {
            return UsageSVG;
        }
    }
    return undefined;
}
</script>
