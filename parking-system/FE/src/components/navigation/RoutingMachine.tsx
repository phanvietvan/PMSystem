import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface RoutingMachineProps {
  userLocation: { lat: number; lng: number } | null;
  destination: { latitude: string; longitude: string } | null;
}

const RoutingMachine = ({ userLocation, destination }: RoutingMachineProps) => {
  const map = useMap();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !userLocation || !destination) return;

    // Xóa route cũ nếu có
    if (routingRef.current) {
      map.removeControl(routingRef.current);
    }

    // Tạo route
    try {
      const control = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(parseFloat(destination.latitude), parseFloat(destination.longitude)),
        ],
        router: (L as any).Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
        lineOptions: { 
          styles: [
            { color: "#ffffff", weight: 10, opacity: 0.9 }, // White border
            { color: "#3b82f6", weight: 6, opacity: 1 }      // Blue core
          ] 
        },
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false // Ẩn bảng chỉ dẫn chi tiết
      }).addTo(map);

      routingRef.current = control;
    } catch (error) {
      console.error("Lỗi khi tạo lộ trình:", error);
    }

    return () => {
      if (routingRef.current && map) {
        map.removeControl(routingRef.current);
      }
    };
  }, [map, userLocation, destination]);

  return null;
};

export default RoutingMachine;
