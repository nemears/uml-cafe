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
        case 'Abstraction': {
            return AbstractionSVG;
        }
        case 'Association' : {
            return AssociationSVG;
        }
        case 'Class': {
            return ClassSVG;
        }
        case 'Comment': {
            return CommentSVG;
        }
        case 'DataType': {
            return DataTypeSVG;
        }
        case 'Dependency': {
            return DependencySVG;
        }
        case 'Enumeration': {
            return EnumerationSVG;
        }
        case 'EnumerationLiteral': {
            return PropertySVG;
        }
        case 'Extension': {
            return AssociationSVG;
        }
        case 'Generalization': {
            return GeneralizationSVG;
        }
        case 'InstanceSpecification': {
            return InstanceSpecificationSVG;
        }
        case 'InstanceValue': {
            return InstanceValueSVG;
        }
        case 'Interface': {
            return InterfaceSVG;
        }
        case 'LiteralBool': {
            return LiteralBoolSVG;
        }
        case 'LiteralInt': {
            return LiteralIntSVG;
        }
        case 'LiteralNull': {
            return LiteralNullSVG;
        }
        case 'LiteralReal': {
            return LiteralRealSVG;
        }
        case 'LiteralString': {
            return LiteralStringSVG;
        }
        case 'LiteralUnlimitedNatural': {
            return LiteralUnlimitedNaturalSVG;
        }
        case 'Package': {
            return PackageSVG;
        }
        case 'PrimitiveType': {
            return PrimitiveTypeSVG;
        }
        case 'Profile': {
            return PackageSVG;
        }
        case 'Property': {
            return PropertySVG;
        }
        case 'Realization': {
            return RealizationSVG;
        }
        case 'Signal': {
            return SignalSVG;
        }
        case 'Slot': {
            return SlotSVG;
        }
        case 'Stereotype': {
            return StereotypeSVG;
        }
        case 'Usage': {
            return UsageSVG;
        }
    }
    return undefined;
}
</script>
