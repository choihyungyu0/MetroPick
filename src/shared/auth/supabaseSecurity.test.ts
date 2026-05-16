import { describe, expect, it } from 'vitest'

const sourceFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>
const forbiddenTokens = [
  ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_'),
  ['sb', 'secret'].join('_'),
]

describe('Supabase frontend security', () => {
  it('does not reference backend-only Supabase secrets in frontend source', () => {
    const matches = Object.entries(sourceFiles)
      .filter(([path]) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
      .flatMap(([path, content]) =>
        forbiddenTokens
          .filter((token) => content.includes(token))
          .map((token) => ({ path, token })),
      )

    expect(matches).toEqual([])
  })
})
