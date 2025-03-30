"use client";

import { MapPin } from "lucide-react";
import React, { useState, useEffect, useRef, FC } from "react";

const API_KEY = process.env.NEXT_PUBLIC_MAPY_CZ_API_KEY;

type Suggestion = {
  name: string;
  label: string;
  location: string;
};

type LocationDetails = {
  label: string;
  name: string;
  location: string;
  lat: number | undefined;
  lon: number | undefined;
  zip: string;
  regionalStructure: {
    name: string;
    type: string;
  };
};

type SearchBarMapyProps = {
  onLocationSelect: (location: LocationDetails) => void;
};

const SearchBarMapy: FC<SearchBarMapyProps> = ({ onLocationSelect }) => {
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const fetchGeocode = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapy.cz/v1/geocode?lang=cs&apikey=${API_KEY}&query=${encodeURIComponent(
          address
        )}`
      );
      if (!response.ok) {
        throw new Error(`Chyba při geokódování: ${response.statusText}`);
      }
      const data = await response.json();
      const location = data?.items?.[0];
      if (location) {
        const coords = {
          lat: location.position.lat,
          lng: location.position.lon,
        };

        const locationDetails: LocationDetails = {
          label: location.label,
          name: location.name,
          location: location.location,
          lat: coords.lat,
          lon: coords.lng,
          zip: location.zip,
          regionalStructure: location.regionalStructure.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ isoCode, ...rest }: { isoCode: string; name: string; type: string }) => ({
              ...rest,
            })
          ),
        };

        onLocationSelect(locationDetails);
      } else {
        console.warn("Souřadnice nebyly nalezeny.");
      }
    } catch (error) {
      console.error("Chyba při geokódování:", error);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsFetching(true);
      try {
        const response = await fetch(
          `https://api.mapy.cz/v1/suggest?lang=cs&limit=5&type=regional.address&apikey=${API_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        if (!response.ok) {
          throw new Error(`Chyba při načítání dat: ${response.statusText}`);
        }
        const data = await response.json();
        const items = Array.isArray(data.items)
          ? data.items.map(
              (item: { name: string; label: string; location: string }) => ({
                name: item.name,
                label: item.label,
                location: item.location,
              })
            )
          : [];
        setSuggestions(items);
      } catch (error) {
        console.error("Chyba při načítání dat:", error);
        setSuggestions([]);
      } finally {
        setIsFetching(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSelectSuggestion = async (name: string) => {
    setQuery(name);
    setShowSuggestions(false);
    await fetchGeocode(name);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto" ref={inputRef}>
      <div className="relative max-w-md mx-auto z-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          required
          placeholder="Zadejte adresu..."
          className="w-full pl-10 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200 transition text-black"
        />
        <MapPin
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        {isFetching && <div className="mt-2 text-gray-600">Načítám...</div>}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion.name)}
                className="p-3 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-semibold text-gray-800">
                  {suggestion.name}
                </div>
                <div className="text-sm text-gray-600">
                  {suggestion.label}, {suggestion.location}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchBarMapy;
