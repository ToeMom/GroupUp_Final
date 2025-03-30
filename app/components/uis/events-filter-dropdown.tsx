"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery } from "@apollo/client"
import { gql } from "@apollo/client"
import { getApolloClient } from "@/app/apollo-client"
import { useEffect, useState, useRef } from "react"

const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
    }
  }
`

const removeDiacritics = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const compareTime = (time1: string, time2: string) => {
  const [h1, m1] = time1.split(":").map(Number)
  const [h2, m2] = time2.split(":").map(Number)
  if (h1 === h2) return m1 - m2
  return h1 - h2
}

interface Category {
  id: string
  name: string
}

interface Event {
  location: { name: string }
  title: string
  maxParticipants: number
  date: string
  time: string
  category: string
}

interface EventsFilterProps {
  events: Event[]
  onFilterChange: (filteredEvents: Event[]) => void
}

export function EventsFilterDropdown({ events, onFilterChange }: EventsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState("")
  const [titleFilter, setTitleFilter] = useState("")
  const [minParticipantsFilter, setMinParticipantsFilter] = useState("")
  const [maxParticipantsFilter, setMaxParticipantsFilter] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [timeFromFilter, setTimeFromFilter] = useState("")
  const [timeToFilter, setTimeToFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const prevFilters = useRef({
    locationFilter,
    titleFilter,
    minParticipantsFilter,
    maxParticipantsFilter,
    dateFromFilter,
    dateToFilter,
    timeFromFilter,
    timeToFilter,
    categoryFilter
  });

  const { data } = useQuery<{ getCategories: Category[] }>(GET_CATEGORIES, {
    client: getApolloClient(),
  })
  const categories = data?.getCategories || []

  const clearAllFilters = () => {
    setLocationFilter("")
    setTitleFilter("")
    setMinParticipantsFilter("")
    setMaxParticipantsFilter("")
    setDateFromFilter("")
    setDateToFilter("")
    setTimeFromFilter("")
    setTimeToFilter("")
    setCategoryFilter("")
    onFilterChange(events)
  }

  useEffect(() => {
    const filtersChanged = 
      locationFilter !== prevFilters.current.locationFilter ||
      titleFilter !== prevFilters.current.titleFilter ||
      minParticipantsFilter !== prevFilters.current.minParticipantsFilter ||
      maxParticipantsFilter !== prevFilters.current.maxParticipantsFilter ||
      dateFromFilter !== prevFilters.current.dateFromFilter ||
      dateToFilter !== prevFilters.current.dateToFilter ||
      timeFromFilter !== prevFilters.current.timeFromFilter ||
      timeToFilter !== prevFilters.current.timeToFilter ||
      categoryFilter !== prevFilters.current.categoryFilter;

    if (!filtersChanged) return;

    prevFilters.current = {
      locationFilter,
      titleFilter,
      minParticipantsFilter,
      maxParticipantsFilter,
      dateFromFilter,
      dateToFilter,
      timeFromFilter,
      timeToFilter,
      categoryFilter
    };

    const allFiltersEmpty = 
      locationFilter === "" &&
      titleFilter === "" &&
      minParticipantsFilter === "" &&
      maxParticipantsFilter === "" &&
      dateFromFilter === "" &&
      dateToFilter === "" &&
      timeFromFilter === "" &&
      timeToFilter === "" &&
      categoryFilter === ""

    if (allFiltersEmpty) {
      onFilterChange(events)
      return
    }

    const filteredEvents = events.filter((event) => {
      const eventLocation = removeDiacritics(event.location.name)
      const eventTitle = removeDiacritics(event.title)
      const searchLocation = removeDiacritics(locationFilter)
      const searchTitle = removeDiacritics(titleFilter)

      const matchesLocation = eventLocation.includes(searchLocation)
      const matchesTitle = eventTitle.includes(searchTitle)

      const minParticipants = minParticipantsFilter === "" ? 0 : Number.parseInt(minParticipantsFilter)
      const maxParticipants =
        maxParticipantsFilter === "" ? Number.POSITIVE_INFINITY : Number.parseInt(maxParticipantsFilter)
      const matchesParticipants = event.maxParticipants >= minParticipants && event.maxParticipants <= maxParticipants

      const eventDate = event.date.split("-").reverse().join("-")
      const dateFrom = dateFromFilter || "0000-00-00"
      const dateTo = dateToFilter || "9999-12-31"
      const matchesDate = eventDate >= dateFrom && eventDate <= dateTo

      const eventTime = event.time
      const timeFrom = timeFromFilter || "00:00"
      const timeTo = timeToFilter || "23:59"
      const matchesTime = compareTime(eventTime, timeFrom) >= 0 && compareTime(eventTime, timeTo) <= 0

      const matchesCategory = categoryFilter === "" || event.category === categoryFilter

      return matchesLocation && matchesTitle && matchesParticipants && matchesDate && matchesTime && matchesCategory
    })

    onFilterChange(filteredEvents)
  }, [
    locationFilter,
    titleFilter,
    minParticipantsFilter,
    maxParticipantsFilter,
    dateFromFilter,
    dateToFilter,
    timeFromFilter,
    timeToFilter,
    categoryFilter,
    events,
    onFilterChange,
  ])

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="z-50 w-[calc(100%-2rem)] max-w-3xl mx-auto bg-white rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground rounded-t-lg">
        <h2 className="text-lg font-semibold">Filtry</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-primary-foreground"
          >
            <X size={16} className="mr-1" />
            Vymazat filtry
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Lokace</Label>
            <Input
              id="location"
              placeholder="Filtruj podle lokace"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Název</Label>
            <Input
              id="title"
              placeholder="Filtruj podle názvu"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minParticipants">Min Účastníků</Label>
            <Input
              id="minParticipants"
              type="number"
              placeholder="Min účastníků"
              value={minParticipantsFilter}
              onChange={(e) => setMinParticipantsFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Účastníků</Label>
            <Input
              id="maxParticipants"
              type="number"
              placeholder="Max účastníků"
              value={maxParticipantsFilter}
              onChange={(e) => setMaxParticipantsFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Datum Od</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Datum Do</Label>
            <Input id="dateTo" type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeFrom">Čas Od</Label>
            <Input
              id="timeFrom"
              type="time"
              value={timeFromFilter}
              onChange={(e) => setTimeFromFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeTo">Čas Do</Label>
            <Input id="timeTo" type="time" value={timeToFilter} onChange={(e) => setTimeToFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Všechny kategorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}