import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
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
        <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 240 }}>
          <span style={{ color: '#facc15', letterSpacing: '-10px' }}>L</span>
          <span style={{ color: 'white', letterSpacing: '-10px' }}>V</span>
          <span style={{ color: '#facc15' }}>.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
