'use client'

/**
 * Global Error Boundary
 *
 * Catches errors that occur in the root layout.
 * This is a fallback for catastrophic failures.
 */

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '32rem',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{
              marginBottom: '2rem',
            }}>
              <div style={{
                width: '6rem',
                height: '6rem',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  color: '#dc2626',
                }}>⚠</div>
              </div>
            </div>

            <h2 style={{
              marginBottom: '1rem',
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#111827',
            }}>
              Critical Error
            </h2>

            <p style={{
              marginBottom: '2rem',
              fontSize: '1.125rem',
              color: '#6b7280',
            }}>
              We encountered a critical error. Please refresh the page to continue.
            </p>

            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
