import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Icon component - Creates a simple prompt/text bubble icon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '6px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Chat bubble / prompt icon */}
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
            fill="white"
            opacity="0.9"
          />
          {/* Text lines inside bubble */}
          <rect x="6" y="7" width="12" height="1.5" rx="0.75" fill="#667eea" />
          <rect x="6" y="11" width="8" height="1.5" rx="0.75" fill="#667eea" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
