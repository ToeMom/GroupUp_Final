/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type FC, useEffect, useState, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import { getApolloClient } from "../apollo-client";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./navbar";
import { ImageIcon, Calendar, MapPin, Users, Tag, Plus, Clock } from "lucide-react";
import { auth } from "../../firebase/config";
import { onAuthStateChanged, type User } from "firebase/auth";
import { MyLoader } from "./uis/loading";
import { EventsFilterDropdown } from "./uis/events-filter-dropdown";

const GET_EVENTS = gql`
  query GetEvents($limit: Int, $offset: Int) {
    getEvents(limit: $limit, offset: $offset) {
      id
      title
      description
      date
      time
      maxParticipants
      location {
        name
      }
      category
      image
    }
  }
`;

const GET_ALL_EVENTS = gql`
  query GetAllEvents {
    getAllEvents {
      id
      title
      description
      date
      time
      maxParticipants
      location {
        name
      }
      category
      image
    }
  }
`;

const MainPage: FC = () => {
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [filterEvents, setFilterEvents] = useState<any[]>([]);
  const { data, loading, error, fetchMore } = useQuery(GET_EVENTS, {
    client: getApolloClient(),
    variables: { limit: 3, offset: 0 },
  });
  const { data: eventsdata, loading: eventsloading } = useQuery(GET_ALL_EVENTS, {
    client: getApolloClient(),
  });

  const [user, setUser] = useState<User | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [hasFilters, setHasFilters] = useState(false);

  // Memoized filter change handler
  const handleFilterChange = useCallback((filtered: any[]) => {
    setFilteredEvents(filtered);
    setHasFilters(filtered.length !== filterEvents.length);
  }, [filterEvents.length]);

  useEffect(() => {
    if (data?.getEvents) {
      setEvents((prevEvents) => [...prevEvents, ...data.getEvents]);
    }
    if (eventsdata?.getAllEvents) {
      setFilterEvents(eventsdata.getAllEvents);
    }
  }, [data, eventsdata]);

  const loadMoreEvents = async () => {
    const newOffset = offset + 3;
    setOffset(newOffset);
    const result = await fetchMore({
      variables: { limit: 3, offset: newOffset },
    });
    if (result.data?.getEvents) {
      setEvents((prevEvents) => [...prevEvents, ...result.data.getEvents]);
    }
  };

  useEffect(() => {
    if (!hasFilters) {
      setFilteredEvents(events);
    }
  }, [events, hasFilters]);

  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex((e) => e.id === event.id)
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsEmailVerified(user.emailVerified);
      } else {
        setUser(null);
        setIsEmailVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && offset === 0 && eventsloading) return <MyLoader />;

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center">
        <p className="text-red-500 text-center text-lg font-semibold">Chyba: {error.message}</p>
      </div>
    );

  const currentEvents = hasFilters ? filteredEvents : uniqueEvents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1EB] to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-center text-[#2A56C6] mb-12 animate-fade-in">
          Objevte události ve vašem okolí
        </h1>

        <EventsFilterDropdown
          events={filterEvents}
          onFilterChange={handleFilterChange}
        />

        {currentEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {currentEvents.map((event) => (
                <Link href={event.id} key={event.id} className="group">
                  <article className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="relative h-48">
                      {event.image ? (
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          layout="fill"
                          objectFit="cover"
                          className="transition-opacity duration-300 group-hover:opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <ImageIcon size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-[#2A56C6] mb-3 duration-300">{event.title}</h2>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-500 text-sm">
                          <MapPin size={16} className="mr-2" />
                          <span>{event.location.name}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Tag size={16} className="mr-2" />
                          <span>{event.category}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Users size={16} className="mr-2" />
                          <span>{event.maxParticipants} účastníků</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar size={16} className="mr-2" />
                          <span>{new Date(event.date.split("-").reverse().join("-")).toLocaleDateString("cs-CZ")}</span>
                          <Clock size={16} className="mr-2 ml-5" />
                          <span>{event.time}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            {!hasFilters && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreEvents}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-all duration-300"
                >
                  Načíst další
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 text-lg mt-8">Žádné události nenalezeny</p>
        )}
      </div>

      {user && isEmailVerified && (
        <Link href="/AddEvent" className="fixed bottom-6 right-6 z-10">
          <button
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Přidat novou událost"
          >
            <Plus size={24} />
          </button>
        </Link>
      )}
    </div>
  );
};

export default MainPage;