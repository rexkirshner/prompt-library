import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  // This creates a minimal server.js that can run without node_modules
  output: 'standalone',
}

export default withBundleAnalyzer(nextConfig)
