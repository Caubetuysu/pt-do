"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { CheckIn } from '@/services/diaryService';
import { MapPin, Plus } from 'lucide-react';

// Fix Leaflet's default icon path issues with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom div icon using Lucide if needed (for clustering or custom markers)
const createCustomIcon = () => {
  return L.divIcon({
    html: `<div class="bg-red-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

function SearchField() {
  const map = useMap();
  useEffect(() => {
    // @ts-ignore
    const provider = new OpenStreetMapProvider();
    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Nhập địa điểm...',
      keepResult: true,
    });

    map.addControl(searchControl);
    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);
  return null;
}

import { CircleMarker } from 'react-leaflet';

// ... other imports ...

interface BaseMapProps {
  checkIns: CheckIn[];
  onMapClick: (lat: number, lng: number) => void;
  userLocation: { lat: number, lng: number } | null;
  draftLocation?: { lat: number, lng: number } | null;
  draftAddress?: string;
  onConfirmDraft?: () => void;
  onCancelDraft?: () => void;
  hotspots?: { lat: number, lng: number, count: number }[];
}

// Map Event Handler Component
function MapEventHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// User Location Centering Component
function UserLocationMarker({ location, onClick }: { location: { lat: number, lng: number } | null, onClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { animate: true });
    }
  }, [location, map]);

  return location ? (
    <Marker position={[location.lat, location.lng]}>
      <Popup>
        <div className="p-1 text-center min-w-[120px]">
          <p className="font-bold mb-3">Bạn đang ở đây!</p>
          <button 
            onClick={() => onClick?.(location.lat, location.lng)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 px-3 rounded-md transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
          >
            <MapPin className="w-3 h-3" />
            Ghim vị trí này
          </button>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

// Draft Location Auto-open Component
function DraftMarker({ 
  location, address, onConfirm, onCancel 
}: { 
  location: { lat: number, lng: number } | null, 
  address?: string, 
  onConfirm?: () => void,
  onCancel?: () => void
}) {
  const map = useMap();
  const markerRef = React.useRef<L.Marker>(null);
  
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], map.getZoom(), { animate: true });
      if (markerRef.current) {
        // Need a tiny timeout to let the map finish rendering the marker before opening popup
        setTimeout(() => {
          markerRef.current?.openPopup();
        }, 100);
      }
    }
  }, [location, map]);

  if (!location) return null;

  return (
    <Marker position={[location.lat, location.lng]} ref={markerRef}>
      <Popup 
        eventHandlers={{ remove: () => onCancel?.() }}
        autoPan={false}
      >
        <div className="p-2 min-w-[200px]">
          <h4 className="font-bold text-base mb-2 text-foreground">Vị trí đã chọn</h4>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {address}
          </p>
          <button 
            onClick={() => onConfirm?.()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            📝 Thêm Nhật Ký
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default function BaseMap({ 
  checkIns, onMapClick, userLocation, draftLocation, draftAddress, onConfirmDraft, onCancelDraft, hotspots 
}: BaseMapProps) {
  const defaultCenter: [number, number] = [10.762622, 106.660172]; // HCMC Default

  return (
    <MapContainer 
      center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter} 
      zoom={13} 
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <SearchField />
      <MapEventHandler onClick={onMapClick} />
      <UserLocationMarker location={userLocation} onClick={onMapClick} />
      <DraftMarker 
        location={draftLocation || null} 
        address={draftAddress} 
        onConfirm={onConfirmDraft} 
        onCancel={onCancelDraft}
      />

      {hotspots && hotspots.map((spot, idx) => (
        <CircleMarker 
          key={`hotspot-${idx}`}
          center={[spot.lat, spot.lng]}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4 }}
          radius={30}
        >
          <Popup>
            <div className="font-bold text-amber-500">🔥 Địa điểm hay đi</div>
            <div className="text-sm">Bạn đã check-in {spot.count} lần ở khu vực này!</div>
          </Popup>
        </CircleMarker>
      ))}

      <MarkerClusterGroup>
        {checkIns.map((checkIn) => (
          <Marker 
            key={checkIn.id} 
            position={[checkIn.location.lat, checkIn.location.lng]}
            icon={createCustomIcon()}
          >
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-sm mb-1">
                  {checkIn.timestamp.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {checkIn.address && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{checkIn.address}</p>}
                <p className="text-sm">{checkIn.activityText}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
