<script>
import PackageSVG from './components/icons/package.svg';
import ClassSVG from './components/icons/class.svg';
import PropertySVG from './components/icons/property.svg';
export default function getImage(el) {
    switch(el.elementType()) {
        case 'class': {
            return ClassSVG;
        }
        case 'package': {
            return PackageSVG;
        }
        case 'primitiveType': {
            return ClassSVG;
        }
        case 'property': {
            return PropertySVG;
        }
    }
    return undefined;
}
</script>