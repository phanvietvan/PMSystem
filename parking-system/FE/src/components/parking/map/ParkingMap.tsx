import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RoutingMachine from "./RoutingMachine";

const { BaseLayer } = LayersControl;

// Fix Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
    });
}

// Custom icons
const parkingIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2892/2892900.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const FitBounds = ({ userLoc, destLoc }: { userLoc: any, destLoc: any }) => {
  const map = useMap();
  useEffect(() => {
    if (userLoc && destLoc) {
      const bounds = L.latLngBounds([
        [userLoc.lat, userLoc.lng],
        [parseFloat(destLoc.latitude), parseFloat(destLoc.longitude)]
      ]);
      map.fitBounds(bounds, { padding: [40, 40], duration: 1.5 });
    }
  }, [userLoc, destLoc, map]);
  return null;
};

const ParkingMap = ({ selectedDestination, allParkingLots }: { selectedDestination?: any, allParkingLots?: any[] }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Local state for destination, initialized by prop or fallback
  const [destination, setDestination] = useState(selectedDestination || {
    id: 1,
    name: "Bãi đỗ xe PM System - Landmark 81",
    latitude: "10.7949",
    longitude: "106.7218",
  });

  // Update destination when prop changes
  useEffect(() => {
    if (selectedDestination) {
      setDestination(selectedDestination);
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation({ lat: 10.7900, lng: 106.7150 });
        }
      );
    }
  }, []);

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden">
      <MapContainer
        center={[10.7949, 106.7218]}
        zoom={16}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Bản đồ (Standard)">
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>
          <BaseLayer name="Cổ điển (OSM)">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="Giao thông (Voyager)">
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>
          <BaseLayer name="Vệ tinh (Satellite)">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
        </LayersControl>

        <style>{`
          .leaflet-control-layers {
            border: none !important;
            border-radius: 1.5rem !important;
            padding: 0.5rem !important;
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(12px) !important;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1) !important;
            font-family: inherit !important;
          }
          .leaflet-control-layers-base label {
            padding: 8px 12px;
            border-radius: 1rem;
            transition: all 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
          }
          .leaflet-control-layers-base label:hover {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
          }
          .leaflet-control-layers-selector {
            accent-color: #2563eb;
          }
          .leaflet-control-layers-toggle {
            width: 40px !important;
            height: 40px !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='12 2 2 7 12 12 22 7 12 2'/%3E%3Cpolyline points='2 17 12 22 22 17'/%3E%3Cpolyline points='2 12 12 17 22 12'/%3E%3C/svg%3E") !important;
            background-size: 20px 20px !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            border-radius: 50% !important;
          }
          .pulse {
            width: 24px;
            height: 24px;
            background: rgba(37, 99, 235, 0.5);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
            pointer-events: none;
            z-index: -1;
          }
          @keyframes pulse-ring {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
            80%, 100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
          }
        `}</style>

        {/* Render All Parking Lot Markers */}
        {allParkingLots && allParkingLots.map(lot => (
          <Marker 
            key={lot.id}
            position={[parseFloat(lot.latitude), parseFloat(lot.longitude)]}
            icon={parkingIcon}
            opacity={destination.id === lot.id ? 1 : 0.6}
          >
            <Popup>
              <div className="font-bold text-slate-800">{lot.name}</div>
              {destination.id === lot.id ? (
                <p className="text-xs text-blue-600 font-bold">Điểm đến đã chọn</p>
              ) : (
                <p className="text-xs text-slate-500">Bãi đỗ xe hệ thống</p>
              )}
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="pulse"></div>
                <img src="https://cdn-icons-png.flaticon.com/512/744/744465.png" style="width: 32px; height: 32px; position: relative; z-index: 10;" />
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}

        {userLocation && (
          <RoutingMachine 
            userLocation={userLocation} 
            destination={destination} 
          />
        )}

        <FitBounds userLoc={userLocation} destLoc={destination} />
      </MapContainer>
    </div>
  );
};

export default ParkingMap;
