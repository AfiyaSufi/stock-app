import '@testing-library/jest-dom'
import 'jest-canvas-mock'

// Polyfill ResizeObserver for Chart.js in jsdom
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  class MockResizeObserver {
    constructor(_callback: unknown) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as any).ResizeObserver = MockResizeObserver
}
