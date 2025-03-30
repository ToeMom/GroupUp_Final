"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"

const EventMap: React.FC<{ lat: number; lon: number; name: string }> = ({
  lat,
  lon,
  name,
}) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const map = L.map("map").setView([lat, lon], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(`<b>${name}</b>`).openPopup();

      return () => {
        map.remove();
      };
    }
  }, [lat, lon, name]);

  return (
    <div
      id="map"
      className="w-full h-[300px] md:h-[400px] rounded-lg shadow-lg border border-gray-200 z-0"
    ></div>
  );
};

export default EventMap;