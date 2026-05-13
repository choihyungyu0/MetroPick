const BACKEND_ORIGIN_ENV = 'METROPICK_BACKEND_ORIGIN'

type RewriteConfig = {
  source: string
  destination: string
}

type VercelConfig = {
  rewrites: RewriteConfig[]
}

function getBackendOrigin(): string {
  const backendOrigin = process.env[BACKEND_ORIGIN_ENV]

  if (!backendOrigin) {
    throw new Error(`${BACKEND_ORIGIN_ENV} is required for Vercel API rewrites.`)
  }

  const parsedOrigin = new URL(backendOrigin)

  if (parsedOrigin.pathname !== '/' && parsedOrigin.pathname !== '') {
    throw new Error(`${BACKEND_ORIGIN_ENV} must be an origin without a path.`)
  }

  return parsedOrigin.origin
}

export const config: VercelConfig = {
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${getBackendOrigin()}/api/:path*`,
    },
  ],
}
