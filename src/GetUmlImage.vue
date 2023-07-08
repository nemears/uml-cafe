<script>
import PackageSVG from './components/icons/package.svg';
import ClassSVG from './components/icons/class.svg';
import PropertySVG from './components/icons/property.svg';
import AssociationSVG from './components/icons/association.svg';
import GeneralizationSVG from './components/icons/generalization.svg';
import StereotypeSVG from './components/icons/stereotype.svg';
import LiteralBoolSVG from './components/icons/literal_bool.svg';
import LiteralIntSVG from './components/icons/literal_int.svg';
import LiteralNullSVG from './components/icons/literal_null.svg';
import LiteralRealSVG from './components/icons/literal_real.svg';
import LiteralStringSVG from './components/icons/literal_string.svg';
import LiteralUnlimitedNaturalSVG from './components/icons/literal_unlimited_natural.svg';
import InstanceSpecificationSVG from './components/icons/instance_specification.svg';
import InstanceValueSVG from './components/icons/instance_value.svg';
import SlotSVG from './components/icons/slot.svg';
export default function getImage(el) {
    let elementType = typeof el === 'string' ? el : el.elementType();
    switch(elementType) {
        case 'association' : {
            return AssociationSVG;
        }
        case 'class': {
            return ClassSVG;
        }
        case 'dataType': {
            return ClassSVG;
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
            return ClassSVG;
        }
        case 'profile': {
            return PackageSVG;
        }
        case 'property': {
            return PropertySVG;
        }
        case 'slot': {
            return SlotSVG;
        }
        case 'stereotype': {
            return StereotypeSVG;
        }
    }
    return undefined;
}
</script>
