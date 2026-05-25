// src/components/shop/MapPicker.tsx

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ★ ডিফল্ট লোকেশন (Janai) যাতে ম্যাপ ইনস্ট্যান্ট লোড হয়
const DEFAULT_LOC = new L.LatLng(22.717958, 88.260207);

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
          onDragEnd(pos.lat, pos.lng); 
          map.flyTo(pos, map.getZoom());
        },
      }}
    ></Marker>
  );
}

// ২. টেক্সট সার্চ থেকে লোকেশন আসলে ম্যাপকে সেখানে নিয়ে যাওয়ার জন্য
function MapController({ center, setPosition }: any) {
   const map = useMap();
   
   useEffect(() => {
      if (center && center.lat && center.lng) {
         const newPos = new L.LatLng(center.lat, center.lng);
         setPosition(newPos);
         map.flyTo(newPos, 16, { animate: true, duration: 1.5 }); 
      }
   }, [center, map, setPosition]);

   return null;
}

export default function MapPicker({ onLocationSelect, selectedLocation }: any) {
   // যদি আগে থেকে সিলেক্ট করা থাকে সেটা নেবে, না হলে null থাকবে (পরে আপডেট হবে)
   const [position, setPosition] = useState<L.LatLng | null>(
       selectedLocation ? new L.LatLng(selectedLocation.lat, selectedLocation.lng) : null
   );
   const [isLocating, setIsLocating] = useState(false);

   const locateUser = async () => {
       setIsLocating(true);
       try {
           // ★ ফাস্ট লোকেশন পাওয়ার জন্য কনফিগারেশন চেঞ্জ করা হয়েছে
           const pos = await Geolocation.getCurrentPosition({
               enableHighAccuracy: false, // Network/Wifi বেসড ফাস্ট লোকেশন
               timeout: 5000,             // ৫ সেকেন্ড টাইমআউট
               maximumAge: 300000         // ৫ মিনিটের পুরনো ক্যাশ লোকেশনও নিয়ে নেবে
           });
           
           const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
           setPosition(newPos);
           onLocationSelect(pos.coords.latitude, pos.coords.longitude);
           setIsLocating(false);
       } catch (err) {
           console.log("Geolocation error:", err);
           // যদি কোনো কারণে লোকেশন না পায়, তবে ম্যাপে Janai-তে পিন বসিয়ে দেবে
           if (!position) {
               setPosition(DEFAULT_LOC);
               onLocationSelect(DEFAULT_LOC.lat, DEFAULT_LOC.lng);
           }
           setIsLocating(false);
       }
   };

   useEffect(() => {
      if (!selectedLocation) {
         locateUser();
      }
   }, []);

   return (
      <div className="relative h-[250px] w-full rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm z-10 group">
         
         {/* ★ ম্যাজিক: ম্যাপ লোডিং ব্লকটা সরিয়ে দেওয়া হয়েছে। এখন ম্যাপ ইনস্ট্যান্ট আসবে! */}
         <MapContainer 
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : DEFAULT_LOC} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            attributionControl={false}
         >
            <TileLayer 
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                maxZoom={20}
            />
            
            <LocationMarker position={position} setPosition={setPosition} onDragEnd={onLocationSelect} />
            <MapController center={selectedLocation} setPosition={setPosition} />
         </MapContainer>
         
         {/* Current Location Button */}
         <button 
             onClick={(e) => { e.preventDefault(); locateUser(); }} 
             disabled={isLocating} 
             className="absolute bottom-4 right-4 z-[400] bg-white text-primary p-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
         >
             {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
         </button>
         
         <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-black/70 text-white text-[10px] px-3 py-1 rounded-full font-medium pointer-events-none shadow-md backdrop-blur-sm">
             {isLocating ? "Detecting location..." : "Drag the pin to your exact location"}
         </div>
      </div>
   );
}