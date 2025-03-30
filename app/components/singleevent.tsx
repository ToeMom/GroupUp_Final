"use client";

import React, { FC, useEffect, useState } from "react"
import { gql, useQuery, useLazyQuery } from "@apollo/client"
import { getApolloClient } from "../apollo-client"
import { useAddParticipant } from "./func/registerevent"
import { useRemoveParticipant } from "./func/removeParticipant" 
import Image from "next/image"
import { Calendar, MapPin, Users, Tag, Clock } from 'lucide-react'
import Navbar from "./navbar"
import EventMap from "./mapysearch"
import { MyLoader } from "./uis/loading"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import BackButton from "./uis/backbutton"
import { auth } from "@/firebase/config";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Comments from "./comments";

const GET_EVENT_BY_ID = gql`
  query GetEventById($id: ID!) {
    getEventById(id: $id) {
      id
      title
      description
      createdBy
      date
      time
      ageMin
      ageMax
      participants
      maxParticipants
      location {
        name
        lat
        lon
        regionalStructure {
          name
        }
      }
      category
      image
    }
  }
`;

const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      name
      age
    }
  }
`;

interface MainPageProps {
  eventId: string | string[]
}

const EventView: FC<MainPageProps> = ({ eventId }) => {
  const [avatarURL] = useState("")
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      setIsEmailVerified(currentUser?.emailVerified || false);
    })
    return () => unsubscribe()
  }, [])

  const { data, loading, error } = useQuery(GET_EVENT_BY_ID, {
    client: getApolloClient(),
    variables: { id: eventId },
    skip: !eventId,
  })

  const { addUserToEvent } = useAddParticipant({
    eventId,
    onSuccess: () => alert("Úspěšně jste se připojili k události!"),
    onError: (error) => alert(`Nepodařilo se připojit k události: ${error.message}`),
  })

  const { removeUserFromEvent } = useRemoveParticipant({
    eventId,
    onSuccess: () => alert("Úspěšně jste se odhlásili z události!"),
    onError: (error) => alert(`Nepodařilo se odhlásit z události: ${error.message}`),
  })

  const [fetchCreator, { data: creatorData, loading: creatorLoading }] = useLazyQuery(GET_USER_BY_ID, {
    client: getApolloClient(),
  })
  const [fetchUser, { data: userData, loading: userLoading }] = useLazyQuery(GET_USER_BY_ID, {
    client: getApolloClient(),
  })

  const [isRegistered, setIsRegistered] = useState(false)
  const [canJoin, setCanJoin] = useState(true)

  useEffect(() => {
    if (data?.getEventById?.createdBy) {
      fetchCreator({ variables: { id: data.getEventById.createdBy } })
    }
  }, [data, fetchCreator])

  useEffect(() => {
    if(user?.uid){
      fetchUser({variables: {id: user?.uid}})
    }
  }, [fetchUser, user])

  useEffect(() => {
    if (data && userData) {
      const userAge = userData.getUserById?.age
      const event = data.getEventById

      if (userAge < event.ageMin || userAge > event.ageMax) {
        setCanJoin(false)
      }

      const isUserRegistered = event.participants.includes(user?.uid)
      setIsRegistered(isUserRegistered)
    }
  }, [data, userData, user])

  const handleJoinEvent = () => {
    addUserToEvent(eventId)
    setIsRegistered(true)
  }

  const handleUnregisterEvent = () => {
    removeUserFromEvent(eventId)
    setIsRegistered(false)
  }

  if (loading || creatorLoading || userLoading) {
    return <MyLoader />
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error.message}</div>
  }

  if (!data) {
    return <div className="text-gray-500 text-center p-4">Žádná událost nebyla nalezena</div>
  }

  const event = data.getEventById
  const username = creatorData?.getUserById?.name || "Unknown User"

  const isEventCreator = event.createdBy === user?.uid
  const isEventFull = event.participants.length >= event.maxParticipants

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <Navbar />
      <BackButton urlstring="/MainPage" />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="relative p-0">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400 text-2xl">Žádný obrázek k dispozici</span>
            </div>
          )}
          <Badge className="absolute top-4 right-4" variant="secondary">
            {event.category}
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <CardTitle className="text-3xl font-bold mb-4">{event.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Avatar className="w-6 h-6 mr-2">
                <AvatarImage src={avatarURL} alt={username} />
                <AvatarFallback>{username[0]}</AvatarFallback>
              </Avatar>
              <span>Vytvořil {username}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>
                <strong>{event.participants.length || 0}</strong> z <strong>{event.maxParticipants}</strong> účastníků přihlášeno
              </span>
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              <span>
                Věk: {event.ageMin} až {event.ageMax} let
              </span>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground mb-6">{event.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center col-span-full">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <span>
                {event.location.name}, {event.location.regionalStructure?.[3]?.name}
              </span>
            </div>
          </div>
          <div className="h-64 rounded-lg overflow-hidden mb-6">
            <EventMap lat={event.location.lat} lon={event.location.lon} name={event.location.name} />
          </div>


          <Comments eventId={eventId} currentUserId={user?.uid} username={userData?.getUserById?.name || "Unknown User"} eventCreatorId={data.getEventById.createdBy} />
        </CardContent>
        <CardFooter>
          {isEventCreator ? (
            <Button className="w-full" size="lg" onClick={() => router.push(`/edit/${eventId}`)} disabled={loading}>
              Upravit událost
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={isRegistered ? handleUnregisterEvent : handleJoinEvent}
              disabled={loading || !canJoin || isEventFull|| !isEmailVerified}
            >
              {loading
                ? "Přihlašování..."
                : isRegistered
                ? "Odhlásit se"
                : isEventFull
                ? "Maximální počet účastníků dosažen"
                : !isEmailVerified
                ? "Ověřte svůj e-mail, abyste se mohli přihlásit"
                : "Přihlásit se na událost"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default EventView
