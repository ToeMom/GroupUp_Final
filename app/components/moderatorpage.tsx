"use client"

import type React from "react"
import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import gql from "graphql-tag"
import { getApolloClient } from "../apollo-client"
import Navbar from "./navbar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Calendar, Clock, User } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const GET_WAITING_EVENTS = gql`
  query GetWaitingEvents {
    getWaitingEvents {
      id
      title
      description
      createdBy
      date
      time
      category
      ageMax
      ageMin
      image
      maxParticipants
      participants
      location {
        name
        label
        lat
        lon
        zip
        regionalStructure {
          name
          type
        }
      }
    }
  }
`

const APPROVE_EVENT = gql`
  mutation ApproveEvent($eventId: ID!) {
    approveEvent(eventId: $eventId) {
      id
      title
    }
  }
`

const REJECT_EVENT = gql`
  mutation RejectEvent($eventId: ID!, $reason: String) {
    rejectEvent(eventId: $eventId, reason: $reason)
  }
`

interface Location {
  name: string
  label: string
  lat: number
  lon: number
  zip: string
  regionalStructure: {
    name: string
    type: string
  }[]
}

interface Event {
  id: string
  title: string
  description: string
  createdBy: string
  date: string
  time: string
  category: string
  ageMax: number
  ageMin: number
  image: string
  maxParticipants: number
  participants: string[]
  location: Location
}

const Moderator: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(GET_WAITING_EVENTS, {
    client: getApolloClient(),
  })

  const [approveEvent] = useMutation(APPROVE_EVENT, {
    client: getApolloClient(),
  })

  const [rejectEvent] = useMutation(REJECT_EVENT, {
    client: getApolloClient(),
  })

  const [rejectionReason, setRejectionReason] = useState<string>("")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleApprove = async (eventId: string) => {
    try {
      setIsSubmitting(true)
      await approveEvent({ variables: { eventId } })
      refetch()
      setIsSubmitting(false)
      alert("Událost byla úspěšně schválena.")
    } catch (err) {
      console.error("Chyba při schvalování události:", err)
      alert("Schválení události se nezdařilo.")
      setIsSubmitting(false)
    }
  }

  const handleReject = async (eventId: string) => {
    try {
      setIsSubmitting(true)
      await rejectEvent({ variables: { eventId, reason: rejectionReason } })
      refetch()
      setIsSubmitting(false)
      alert("Událost byla úspěšně zamítnuta.")
      setRejectionReason("")
      setSelectedEventId(null)
    } catch (err) {
      console.error("Chyba při zamítání události:", err)
      alert("Zamítnutí události se nezdařilo.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Panel moderátora</h1>
            <p className="text-muted-foreground">Prohlížení a správa událostí čekajících na schválení</p>
          </div>

          <Separator className="my-2" />

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Načítání událostí...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>Chyba při načítání událostí: {error.message}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Čekající události</h2>
                <Badge variant="outline" className="px-3 py-1">
                  {data.getWaitingEvents.length} čekající
                </Badge>
              </div>

              {data.getWaitingEvents.length === 0 ? (
                <div className="bg-muted rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Žádné události nečekají na schválení.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.getWaitingEvents.map((event: Event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{event.createdBy}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {/* Zobrazení obrázku */}
                        <div className="relative h-48 w-full mb-4">
                          <Image
                            src={event.image || "/placeholder.svg"}
                            alt={event.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                          />
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{event.description}</p>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="details">
                            <AccordionTrigger>Detaily události</AccordionTrigger>
                            <AccordionContent>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Kategorie: {event.category}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Věk: {event.ageMin} - {event.ageMax}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Maximální počet účastníků: {event.maxParticipants}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Účastníci: {event.participants.length}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Místo: {event.location.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Souřadnice: {event.location.lat}, {event.location.lon}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>PSČ: {event.location.zip}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-muted-foreground">
                                  <span>Regionální struktura:</span>
                                  {event.location.regionalStructure.map((region, index) => (
                                    <div key={index} className="ml-2">
                                      <span>{region.name} ({region.type})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-3 pt-0">
                        <div className="flex gap-2 w-full">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => handleApprove(event.id)}
                            disabled={isSubmitting || selectedEventId === event.id}
                          >
                            {isSubmitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Schválit
                          </Button>
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => setSelectedEventId(event.id === selectedEventId ? null : event.id)}
                            disabled={isSubmitting}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Zamítnout
                          </Button>
                        </div>

                        {selectedEventId === event.id && (
                          <div className="w-full space-y-2">
                            <Textarea
                              placeholder="Důvod zamítnutí (volitelné)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEventId(null)}
                                disabled={isSubmitting}
                              >
                                Zrušit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(event.id)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Potvrdit zamítnutí"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Moderator