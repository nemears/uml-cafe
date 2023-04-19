<script>
import PackageSVG from './components/icons/package.svg';
import ClassSVG from './components/icons/class.svg';
import PropertySVG from './components/icons/property.svg';
import AssociationSVG from './components/icons/association.svg';
import GeneralizationSVG from './components/icons/generalization.svg';
import StereotypeSVG from './components/icons/stereotype.svg';
import LiteralIntSVG from './components/icons/literal_int.svg';
import LiteralUnlimitedNaturalSVG from './components/icons/literal_unlimited_natural.svg';
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
        case 'literalInt': {
            return LiteralIntSVG;
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
        case 'stereotype': {
            return StereotypeSVG;
        }
    }
    return undefined;
}
</script>