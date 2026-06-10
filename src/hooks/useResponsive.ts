import { useState, useEffect, useCallback } from 'react'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '@/utils/constants'

interface ResponsiveInfo {
  width: number
  height: number
  scale: number
  isLandscape: boolean
  isTablet: boolean
  isMobile: boolean
}

export function useResponsive(): ResponsiveInfo {
  const calc = useCallback((): ResponsiveInfo => {
    const sw = window.innerWidth
    const sh = window.innerHeight
    const aspect = DESIGN_WIDTH / DESIGN_HEIGHT
    let w: number, h: number

    if (sw / sh > aspect) {
      h = sh
      w = h * aspect
    } else {
      w = sw
      h = w / aspect
    }

    const isTablet = sw >= 768 && sw < 1024
    const isMobile = sw < 768

    return {
      width: Math.floor(w),
      height: Math.floor(h),
      scale: w / DESIGN_WIDTH,
      isLandscape: sw >= sh,
      isTablet,
      isMobile,
    }
  }, [])

  const [info, setInfo] = useState<ResponsiveInfo>(calc)

  useEffect(() => {
    const onResize = () => setInfo(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [calc])

  return info
}
