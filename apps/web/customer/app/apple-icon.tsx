import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

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
          background: '#09090b',
          fontWeight: '900',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 80 }}>
          <span style={{ color: '#facc15', letterSpacing: '-2px' }}>L</span>
          <span style={{ color: 'white', letterSpacing: '-2px' }}>C</span>
          <span style={{ color: '#facc15' }}>.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
