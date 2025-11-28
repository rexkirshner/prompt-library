import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Input Atlas - A curated collection of high-quality AI prompts'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-900
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              background: 'linear-gradient(to bottom right, #60a5fa, #3b82f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
              letterSpacing: '-0.05em',
            }}
          >
            Input Atlas
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 36,
              color: '#94a3b8', // slate-400
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            A curated collection of high-quality AI prompts
          </div>

          {/* Badge */}
          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: '#cbd5e1', // slate-300
                padding: '12px 24px',
                backgroundColor: '#1e293b', // slate-800
                borderRadius: '999px',
                border: '2px solid #334155', // slate-700
              }}
            >
              🤖 AI Prompts
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#cbd5e1',
                padding: '12px 24px',
                backgroundColor: '#1e293b',
                borderRadius: '999px',
                border: '2px solid #334155',
              }}
            >
              📚 Community Curated
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#cbd5e1',
                padding: '12px 24px',
                backgroundColor: '#1e293b',
                borderRadius: '999px',
                border: '2px solid #334155',
              }}
            >
              🆓 Public Domain
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
