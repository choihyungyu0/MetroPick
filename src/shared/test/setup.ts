import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('@react-pdf/renderer', async () => {
  const React = await import('react')

  type MockPDFChildren =
    | React.ReactNode
    | ((state: { loading: boolean }) => React.ReactNode)

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children)

  return {
    Document: Passthrough,
    Font: {
      register: () => undefined,
    },
    Image: () => null,
    PDFDownloadLink: ({
      children,
      fileName,
    }: {
      children: MockPDFChildren
      fileName: string
    }) =>
      React.createElement(
        'a',
        { download: fileName, href: '#' },
        typeof children === 'function' ? children({ loading: false }) : children,
      ),
    Page: Passthrough,
    StyleSheet: {
      create: <TStyles extends Record<string, unknown>>(styles: TStyles) => styles,
    },
    Text: Passthrough,
    View: Passthrough,
  }
})

afterEach(() => {
  cleanup()
})

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
