import type { Theme } from '../app/theme'
import type { CanvasColors } from './render'

/** Keep in sync with CSS variables in `src/index.css`. */
export function canvasColorsFromTheme(theme: Theme): CanvasColors {
  if (theme === 'light') {
    return {
      background: '#f4f4f5',
      minor: 'rgba(0, 0, 0, 0.05)',
      major: 'rgba(0, 0, 0, 0.12)',
      origin: 'rgba(79, 70, 229, 0.45)',
      wall: '#3f3f46',
      wallSelected: '#4f46e5',
      wallDraft: 'rgba(79, 70, 229, 0.7)',
      labelFill: 'rgba(255, 255, 255, 0.92)',
      labelText: '#18181b',
      marqueeFill: 'rgba(79, 70, 229, 0.12)',
      marqueeStroke: 'rgba(79, 70, 229, 0.7)',
      roomFill: 'rgba(79, 70, 229, 0.07)',
      item: '#3f3f46',
      itemFill: 'rgba(79, 70, 229, 0.12)',
    }
  }
  return {
    background: '#121212',
    minor: 'rgba(255, 255, 255, 0.04)',
    major: 'rgba(255, 255, 255, 0.09)',
    origin: 'rgba(139, 147, 255, 0.45)',
    wall: '#d4d4d4',
    wallSelected: '#8b93ff',
    wallDraft: 'rgba(139, 147, 255, 0.75)',
    labelFill: 'rgba(28, 28, 28, 0.92)',
    labelText: '#ececec',
    marqueeFill: 'rgba(139, 147, 255, 0.16)',
    marqueeStroke: 'rgba(139, 147, 255, 0.75)',
    roomFill: 'rgba(139, 147, 255, 0.08)',
    item: '#d4d4d4',
    itemFill: 'rgba(139, 147, 255, 0.14)',
  }
}
