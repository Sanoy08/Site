// src/components/shop/MapPicker.tsx

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ১. ইউজারের ক্লিক ও ড্র্যাগ হ্যান্ডেল করার জন্য
function LocationMarker({ position, setPosition, onDragEnd }: any) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onDragEnd(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker
      draggable={true}
      position={position}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos);
          onDragEnd(pos.lat, pos.lng); // ম্যাপ ড্র্যাগ করলে CheckoutPage কে জানাবে
          map.flyTo(pos, map.getZoom());
        },
      }}
    ></Marker>
  );
}

// ২. টেক্সট সার্চ থেকে লোকেশন আসলে ম্যাপকে সেখানে নিয়ে যাওয়ার জন্য
function MapController({ center, setPosition }: any) {
   const map = useMap();
   
   useEffect(() => {
      if (center && center.lat && center.lng) {
         const newPos = new L.LatLng(center.lat, center.lng);
         setPosition(newPos);
         map.flyTo(newPos, 16, { animate: true, duration: 1.5 }); // Smooth animation
      }
   }, [center, map, setPosition]);

   return null;
}

export default function MapPicker({ onLocationSelect, selectedLocation }: any) {
   const [position, setPosition] = useState<L.LatLng | null>(null);
   const [isLocating, setIsLocating] = useState(true);

   // Current GPS Location বের করার ফাংশন
   const locateUser = () => {
       setIsLocating(true);
       if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((pos) => {
             const { latitude, longitude } = pos.coords;
             const newPos = new L.LatLng(latitude, longitude);
             setPosition(newPos);
             onLocationSelect(latitude, longitude); // CheckoutPage কে জানাবে
             setIsLocating(false);
         }, (err) => {
             console.log("Geolocation error:", err);
             // GPS না পেলে Janai এর লোকেশন ডিফল্ট করে দেবে
             const defaultPos = new L.LatLng(22.717958, 88.260207);
             setPosition(defaultPos);
             onLocationSelect(defaultPos.lat, defaultPos.lng);
             setIsLocating(false);
         }, { enableHighAccuracy: true });
      }
   };

   // পেজ লোড হলে একবার GPS লোকেশন নেবে, যদি আগে থেকে সিলেক্ট করা না থাকে
   useEffect(() => {
      if (!selectedLocation) {
         locateUser();
      } else {
         setPosition(new L.LatLng(selectedLocation.lat, selectedLocation.lng));
         setIsLocating(false);
      }
   }, []);

   if (!position && !selectedLocation) {
       return <div className="h-[250px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground">Loading Map...</div>;
   }

   return (
      <div className="relative h-[250px] w-full rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm z-10 group">
         <MapContainer 
            center={selectedLocation || position || [22.717958, 88.260207]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            attributionControl={false}
         >
            <TileLayer 
    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
    maxZoom={20}
/>
            
            {/* Markers & Controllers */}
            <LocationMarker position={position} setPosition={setPosition} onDragEnd={onLocationSelect} />
            <MapController center={selectedLocation} setPosition={setPosition} />
         </MapContainer>
         
         {/* Current Location Button */}
         <button 
             onClick={(e) => { e.preventDefault(); locateUser(); }} 
             disabled={isLocating} 
             className="absolute bottom-4 right-4 z-[400] bg-white text-primary p-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
         >
             <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-pulse opacity-50' : ''}`} />
         </button>
         
         <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-black/70 text-white text-[10px] px-3 py-1 rounded-full font-medium pointer-events-none shadow-md backdrop-blur-sm">
            Drag the pin to your exact location
         </div>
      </div>
   );
}