<script>
import PackageSVG from './components/icons/package.svg';
import ClassSVG from './components/icons/class.svg';
import PropertySVG from './components/icons/property.svg';
import AssociationSVG from './components/icons/association.svg';
import GeneralizationSVG from './components/icons/generalization.svg';
import StereotypeSVG from './components/icons/stereotype.svg';
export default function getImage(el) {
    switch(el.elementType()) {
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