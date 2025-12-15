/**
 * API Documentation Page
 *
 * Public documentation for the Input Atlas API.
 * Provides endpoint reference, examples, and usage guidelines.
 */

import { Metadata } from 'next'
import { ApiDocsContent } from './ApiDocsContent'

export const metadata: Metadata = {
  title: 'API Documentation - Input Atlas',
  description: 'Documentation for the Input Atlas public API',
}

export default function ApiDocsPage() {
  return <ApiDocsContent />
}
