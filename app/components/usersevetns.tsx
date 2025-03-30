"use client";

import { useQuery, gql, useMutation } from "@apollo/client";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { getApolloClient } from "../apollo-client";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, Edit, MapPinIcon, Trash2 } from "lucide-react";
import { MyLoader } from "./uis/loading";
import Navbar from "./navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const GET_EVENT_BY_USER = gql`
  query GetEventByUser($userId: ID!) {
    getEventsByUser(userId: $userId) {
      id
      title
      description
      date
      image
      time
      category
      location {
        name
      }
    }
  }
`;

const GET_WAITING_EVENTS_BY_USER = gql`
  query GetWaitingEventsByUser($userId: ID!) {
    getWaitingEventsByUser(userId: $userId) {
      id
      title
      description
      date
      image
      time
      category
      location {
        name
      }
    }
  }
`;

const GET_REJECTED_EVENTS_BY_USER = gql`
  query GetRejectedEventsByUser($userId: ID!) {
    getRejectedEventsByUser(userId: $userId) {
      id
      title
      description
      date
      image
      time
      category
      location {
        name
      }
      reviewedBy
      reviewedAt
      reason
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const DELETE_REJECTED_EVENT = gql`
  mutation DeleteRejectedEvent($id: ID!) {
    deleteRejectedEvent(id: $id)
  }
`;

export default function UserEvents() {
  const auth = getAuth();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [deleteEvent] = useMutation(DELETE_EVENT, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_EVENT_BY_USER, variables: { userId } }],
  });

  const [deleteRejectedEvent] = useMutation(DELETE_REJECTED_EVENT, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_REJECTED_EVENTS_BY_USER, variables: { userId } }],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const { data: userEventsData, loading: userEventsLoading, error: userEventsError } = useQuery(GET_EVENT_BY_USER, {
    client: getApolloClient(),
    variables: { userId: userId },
    skip: !userId,
  });

  const { data: waitingEventsData, loading: waitingEventsLoading, error: waitingEventsError } = useQuery(GET_WAITING_EVENTS_BY_USER, {
    client: getApolloClient(),
    variables: { userId: userId },
    skip: !userId,
  });

  const { data: rejectedEventsData, loading: rejectedEventsLoading, error: rejectedEventsError } = useQuery(GET_REJECTED_EVENTS_BY_USER, {
    client: getApolloClient(),
    variables: { userId: userId },
    skip: !userId,
  });

  if (!userId) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>User Events</CardTitle>
          <CardDescription>Please log in to view your events.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (userEventsLoading || waitingEventsLoading || rejectedEventsLoading) {
    return <MyLoader />;
  }

  if (userEventsError || waitingEventsError || rejectedEventsError) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Error loading events: {userEventsError?.message || waitingEventsError?.message || rejectedEventsError?.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const userEvents = userEventsData?.getEventsByUser || [];
  const waitingEvents = waitingEventsData?.getWaitingEventsByUser || [];
  const rejectedEvents = rejectedEventsData?.getRejectedEventsByUser || [];

  type EventType = {
    id: string;
    title: string;
    description: string;
    time: string;
    date: string;
    location: { name: string };
    category: string;
    image: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reason?: string;
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Navbar />
      <h1 className="text-4xl font-bold text-center text-gray-600 mb-12 animate-fade-in">
        Vámi Vytvořené Události
      </h1>

      {/* Sekce pro události čekající na kontrolu */}
      <h2 className="text-2xl font-bold text-center text-gray-600 mb-8">
        Události čekající na kontrolu
      </h2>
      {waitingEvents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Žádné Události</CardTitle>
            <CardDescription>
              Žádné události nečekají na kontrolu.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waitingEvents.map((event: EventType) => (
            <Card key={event.id} className="overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-slate-400">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                <CardDescription className="mb-4 line-clamp-2 text-black">
                  {event.description}
                </CardDescription>
                <div className="flex items-center space-x-2 text-sm  mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{event.date}</span>
                  <ClockIcon className="h-4 w-4 ml-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm ">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{event.location?.name || "N/A"}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Badge variant="secondary">{event.category}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Sekce pro schválené události */}
      <h2 className="text-2xl font-bold text-center text-gray-600 mb-8 mt-12">
        Vaše schválené události
      </h2>
      {userEvents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Žádné Události</CardTitle>
            <CardDescription>
              Žádné události jste ještě nevytvořili!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userEvents.map((event: EventType) => (
            <Link key={event.id} href={event.id}>
              <Card className="overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-slate-400">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <CardDescription className="mb-4 line-clamp-2 text-black">
                    {event.description}
                  </CardDescription>
                  <div className="flex items-center space-x-2 text-sm  mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{event.date}</span>
                    <ClockIcon className="h-4 w-4 ml-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm ">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{event.location?.name || "N/A"}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <Badge variant="secondary">{event.category}</Badge>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push(`/edit/${event.id}`)} variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Upravit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        const confirmDelete = confirm("Opravdu chcete smazat tuto událost?");
                        if (confirmDelete) {
                          deleteEvent({ variables: { id: event.id } })
                            .then(() => {
                              alert("Událost byla úspěšně smazána.");
                            })
                            .catch((error) => {
                              console.error("Error deleting event:", error);
                              alert("Při mazání události došlo k chybě.");
                            });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Smazat</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Sekce pro zamítnuté události */}
      <h2 className="text-2xl font-bold text-center text-gray-600 mb-8 mt-12">
        Vaše zamítnuté události
      </h2>
      {rejectedEvents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Žádné Události</CardTitle>
            <CardDescription>
              Žádné události nebyly zamítnuty.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rejectedEvents.map((event: EventType) => (
            <Card key={event.id} className="overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-slate-400">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                <CardDescription className="mb-4 line-clamp-2 text-black">
                  {event.description}
                </CardDescription>
                <div className="flex items-center space-x-2 text-sm  mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{event.date}</span>
                  <ClockIcon className="h-4 w-4 ml-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm ">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{event.location?.name || "N/A"}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-red-600">
                    <strong>Důvod zamítnutí:</strong> {event.reason || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Zamítnuto:</strong> {event.reviewedAt || "N/A"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Badge variant="secondary">{event.category}</Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const confirmDelete = confirm("Opravdu chcete smazat tuto zamítnutou událost?");
                    if (confirmDelete) {
                      deleteRejectedEvent({ variables: { id: event.id } })
                        .then(() => {
                          alert("Zamítnutá událost byla úspěšně smazána.");
                        })
                        .catch((error) => {
                          console.error("Error deleting rejected event:", error);
                          alert("Při mazání zamítnuté události došlo k chybě.");
                        });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Smazat</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}