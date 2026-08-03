import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

const createPillIcon = (text: string, bgColor: string, delayMs: number) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%) scale(0);
        opacity: 0;
        animation: popOutLoop 4s ease-in-out infinite;
        animation-delay: ${delayMs}ms;
        transform-origin: bottom center;
      ">
        <div style="
          background-color: ${bgColor};
          color: black;
          border: 2px solid black;
          border-radius: 8px;
          padding: 4px 10px;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 2px 2px 0px rgba(0,0,0,1);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          <div style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid black; background: white;"></div>
          ${text}
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid black;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export default function UnilagMap() {
  const position: [number, number] = [6.5175, 3.3960];
  
  const locations = [
    { name: "Main Library", coords: [6.52011, 3.39981], color: "#a78bfa" },
    { name: "King Jaja", coords: [6.51624, 3.39804], color: "#f87171" },
    { name: "Moremi", coords: [6.51751, 3.39677], color: "#4ade80" },
    { name: "Mariere", coords: [6.51813, 3.39807], color: "#60a5fa" },
    { name: "Sodeinde", coords: [6.51900, 3.39380], color: "#fcd34d" },
    { name: "Eni Njoku", coords: [6.51925, 3.39350], color: "#facc15" },
    { name: "New Hall", coords: [6.51997, 3.39260], color: "#fb923c" },
    { name: "Madam Tinubu", coords: [6.51950, 3.39200], color: "#fb7185" },
    { name: "Fagunwa", coords: [6.52050, 3.39220], color: "#c084fc" },
    { name: "Makama Bida", coords: [6.52000, 3.39300], color: "#34d399" },
    { name: "Queen Amina", coords: [6.51300, 3.39100], color: "#f472b6" },
    { name: "Biobaku", coords: [6.51150, 3.39250], color: "#2dd4bf" },
    { name: "Kofo Ademola", coords: [6.51200, 3.39000], color: "#818cf8" },
    { name: "Honors", coords: [6.51850, 3.39900], color: "#94a3b8" },
    { name: "Women Society", coords: [6.51320, 3.39150], color: "#ec4899" },
    { name: "Elkanemi", coords: [6.51350, 3.39103], color: "#3b82f6" },
    { name: "Gbaja", coords: [6.51417, 3.39052], color: "#eab308" }
  ];
  
  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes popOutLoop {
          0%, 100% { transform: translate(-50%, -100%) scale(0); opacity: 0; }
          5% { transform: translate(-50%, -100%) scale(1.1); opacity: 1; }
          8%, 92% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
          95% { transform: translate(-50%, -100%) scale(1.1); opacity: 1; }
        }
      `}</style>
      <MapContainer 
        center={position} 
        zoom={16} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {locations.map((loc, idx) => (
          <Marker 
            key={idx} 
            position={loc.coords as [number, number]} 
            icon={createPillIcon(loc.name, loc.color, idx * 80)}
          >
            <Popup className="font-sans font-bold">{loc.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Floating Info Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] md:w-auto pointer-events-none">
        <div className="bg-white text-black border-2 border-black rounded-full px-4 py-2 md:px-6 md:py-3 font-bold text-xs md:text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-center pointer-events-auto mx-auto max-w-sm">
          <MapPin className="w-4 h-4 text-green-500 fill-current shrink-0" />
          <span>Tap a hall to see restaurants</span>
        </div>
      </div>
    </div>
  );
}
