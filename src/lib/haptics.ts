/**
 * Haptic feedback helper utility for mobile web browsers using navigator.vibrate.
 * Safely checks for support before invoking vibration patterns.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return
  }

  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate(50)
        break
      case 'success':
        navigator.vibrate([15, 30, 30])
        break
      case 'warning':
        navigator.vibrate([30, 50, 15])
        break
      case 'error':
        navigator.vibrate([50, 40, 50, 40, 50])
        break
      default:
        navigator.vibrate(15)
    }
  } catch {
    // Ignore any vibration errors or permission restrictions
  }
}
