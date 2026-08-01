const fs = require('fs');
const path = require('path');

const apps = ['customer', 'vendor', 'rider', 'admin'];
const files = ['icon.tsx', 'apple-icon.tsx'];

const content = `import { ImageResponse } from 'next/og';

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
        <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 110, letterSpacing: '-4px' }}>
          <span style={{ color: '#facc15' }}>Lag</span>
          <span style={{ color: 'white' }}>Chow</span>
          <span style={{ color: '#facc15' }}>.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
`;

apps.forEach(app => {
  files.forEach(file => {
    const filePath = path.join(__dirname, 'apps/web', app, 'app', file);
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  });
});
