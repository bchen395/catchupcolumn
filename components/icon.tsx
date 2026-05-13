import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import type { IconDescriptor } from '@/constants/icons';

type Props = {
  icon: IconDescriptor;
  size?: number;
  color?: string;
};

// Tiny render-shim so consumers can pass an IconDescriptor without caring
// whether the glyph lives in FontAwesome or MaterialCommunityIcons. Add new
// sets here as they're introduced in `constants/icons.ts`.
export const Icon = ({ icon, size = 24, color }: Props) => {
  if (icon.set === 'materialcommunity') {
    return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  }
  return <FontAwesome name={icon.name} size={size} color={color} />;
};
