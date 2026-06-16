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

interface BaseMapProps {
  checkIns: CheckIn[];
  onMapClick: (lat: number, lng: number) => void;
  userLocation: { lat: number, lng: number } | null;
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
function UserLocationMarker({ location }: { location: { lat: number, lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { animate: true });
    }
  }, [location, map]);

  return location ? (
    <Marker position={[location.lat, location.lng]}>
      <Popup>Bạn đang ở đây!</Popup>
    </Marker>
  ) : null;
}

export default function BaseMap({ checkIns, onMapClick, userLocation }: BaseMapProps) {
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
      <UserLocationMarker location={userLocation} />

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
                <p className="text-sm">{checkIn.activityText}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
