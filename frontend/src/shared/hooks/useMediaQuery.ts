import { useMediaQuery } from '@mantine/hooks';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';

/**
 * モバイル端末（768px以下）かどうかを判定するフック
 * @returns モバイル端末の場合true
 */
export const useIsMobile = () => {
  return useMediaQuery(`(max-width: ${LAYOUT_CONSTANTS.MOBILE_BREAKPOINT}px)`);
};

/**
 * タブレット端末（1024px以下）かどうかを判定するフック
 * @returns タブレット端末の場合true
 */
export const useIsTablet = () => {
  return useMediaQuery(`(max-width: ${LAYOUT_CONSTANTS.TABLET_BREAKPOINT}px)`);
};
