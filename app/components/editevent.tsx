"use client";

import { useState, FormEvent, FC, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { getApolloClient } from "../apollo-client";
import gql from "graphql-tag";
import {
  Calendar,
  Users,
  ImageIcon,
  Tag,
  Clock,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  FileText,
} from "lucide-react";
import SearchBarMapy from "./searchbarmap";
import { MyLoader } from "./uis/loading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "motion/react";
import Navbar from "./navbar";
import Image from "next/image";
import { uploadImageToImgBB } from "./func/uploadimg";
import BackButton from "./uis/backbutton";

const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
    }
  }
`;

const GET_EVENT_BY_ID = gql`
  query GetEventById($id: ID!) {
    getEventById(id: $id) {
      id
      category
      ageMax
      ageMin
      date
      time
      description
      image
      location {
        label
        name
        location
        lat
        lon
        zip
        regionalStructure {
          name
          type
        }
      }
      maxParticipants
      title
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent($eventId: ID!, $event: EventInput!) {
    updateEvent(eventId: $eventId, event: $event) {
      id
      category
      ageMax
      ageMin
      date
      time
      description
      image
      location {
        label
        name
        location
        lat
        lon
        zip
        regionalStructure {
          name
          type
        }
      }
      maxParticipants
      title
    }
  }
`;

interface EditEventProps {
    eventsId: string | string[]
  }

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

const EditEvent: FC<EditEventProps> = ({eventsId}) => {
    const { data: eventdata, loading: eventloading, error } = useQuery(GET_EVENT_BY_ID, {
        variables: { id: eventsId },
        client: getApolloClient(),
        skip: !eventsId,
      });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>();
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [ageMin, setAgeMin] = useState<number | undefined>();
  const [ageMax, setAgeMax] = useState<number | undefined>();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (eventdata) {
      setTitle(eventdata.getEventById.title);
      setDescription(eventdata.getEventById.description);
      
      const dateFormatted = eventdata.getEventById.date.split('-').reverse().join('-');
      setDate(dateFormatted);
  
      setTime(eventdata.getEventById.time);
      setLocation(eventdata.getEventById.location);
      setMaxParticipants(eventdata.getEventById.maxParticipants);
      setImage(eventdata.getEventById.image);
      setCategory(eventdata.getEventById.category);
      setAgeMin(eventdata.getEventById.ageMin);
      setAgeMax(eventdata.getEventById.ageMax);
    }
  }, [eventdata]);
  

  const { toast } = useToast();

  const {
    data,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery(GET_CATEGORIES, {
    client: getApolloClient(),
  });

  const [updateEvent, { loading: updateEventLoading }] = useMutation(UPDATE_EVENT, {
    client: getApolloClient(),
  });

  const handleLocationSelect = (selectedLocation: LocationDetails) => {
    setLocation(selectedLocation);
  };

  const validateNumberInput = (value: string): number | undefined => {
    const num = Number(value);
    if (isNaN(num)) return undefined;
    if (num < 0) return undefined;
    if (!Number.isInteger(num)) return undefined;
    return num;
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    setSelectedFileName(file.name);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    let uploadedImageUrl: string | null = null;

    if (maxParticipants === undefined || maxParticipants < 1) {
      toast({
        title: "Neplatný počet účastníků",
        description: "Zadejte nezáporné celé číslo",
        variant: "destructive",
      });
      return;
    }
  
    if (ageMin === undefined || ageMin < 0) {
      toast({
        title: "Neplatný minimální věk",
        description: "Zadejte nezáporné celé číslo",
        variant: "destructive",
      });
      return;
    }
  
    if (ageMax === undefined || ageMax < 0) {
      toast({
        title: "Neplatný maximální věk",
        description: "Zadejte nezáporné celé číslo",
        variant: "destructive",
      });
      return;
    }
  
    if (ageMin > ageMax) {
      toast({
        title: "Neplatný věkový rozsah",
        description: "Minimální věk nesmí být větší než maximální",
        variant: "destructive",
      });
      return;
    }
  
    if (selectedFileName && image.startsWith("data:image/")) {
      const fileInput = document.getElementById("upload-image") as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (file) {
        uploadedImageUrl = await uploadImageToImgBB(file);
      }
    } else if (image) {
      uploadedImageUrl = image;
    }
  
    if (!uploadedImageUrl) {
      toast({
        title: "Error",
        description: "Upload obrázku selhal. Prosím zkuste znovu.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
  
    try {
      await updateEvent({
        variables: {
          eventId: eventsId,
          event: {
            title,
            description,
            date: new Date(date).toLocaleDateString("en-GB").split("/").join("-"),
            time,
            location,
            maxParticipants,
            image: uploadedImageUrl,
            category,
            ageMin,
            ageMax,
          },
        },
      });
  
      toast({
        title: "Událost aktualizována",
        description: "Událost byla úspěšně aktualizována!",
        duration: 5000,
      });
  
    } catch (err) {
      console.error("Error updating event:", err);
      toast({
        title: "Error",
        description: "Při aktualizaci události se objevila chyba. Zkuste to prosím znovu.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  
  

  if (eventloading || categoriesLoading) {
    return <MyLoader />;
  }
  
  if (error || categoriesError) {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Error loading data</CardTitle>
          </CardHeader>
          <CardContent>{error?.message || categoriesError?.message}</CardContent>
        </Card>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br overflow-hidden">
      <Navbar />
      <BackButton urlstring="/MainPage"/>
      <div className="container mx-auto mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                Upravit Událost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">
                        Název Události
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="pl-10 bg-white"
                          placeholder="Napište název události"
                        />
                        <Tag
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium">
                        Datum
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type="date"
                          id="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="pl-10 bg-white"
                        />
                        <Calendar
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium">
                        Čas
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type="time"
                          id="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                          className="pl-10 bg-white"
                        />
                        <Clock
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium">
                        Místo konání
                      </Label>
                      <SearchBarMapy onLocationSelect={handleLocationSelect} />
                    </div>
                    <div>
                      <Label
                        htmlFor="maxParticipants"
                        className="text-sm font-medium"
                      >
                        Max Počet Účastníků
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          id="maxParticipants"
                          value={maxParticipants || ""}
                          onChange={(e) => {
                            const validated = validateNumberInput(e.target.value);
                            setMaxParticipants(validated);
                          }}
                          required
                          className="pl-10 bg-white"
                          placeholder="Napište počet účastníků"
                        />
                        <Users
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Popisek
                      </Label>
                      <div className="relative mt-1">
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                          className="pl-10 min-h-[120px] bg-white"
                          placeholder="Napište popisek události"
                        />
                        <FileText
                          className="absolute left-3 top-3 text-muted-foreground"
                          size={18}
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="upload-image"
                        className="text-sm font-medium"
                      >
                        Nahrát obrázek
                      </Label>
                      <div className="mt-1 flex items-center space-x-4">
                        <label
                          htmlFor="upload-image"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <ImageIcon className="w-5 h-5 mr-2" />
                          Vybrat soubor
                        </label>
                        <Input
                          type="file"
                          id="upload-image"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageSelect(file);
                            }
                          }}
                        />

                        {selectedFileName && (
                          <span className="text-sm text-muted-foreground overflow-auto">
                            {selectedFileName}
                          </span>
                        )}
                      </div>
                      {image && (
                        <Image
                          width={100}
                          height={100}
                          src={image}
                          alt="Uploaded Preview"
                          className="mt-4 w-full h-auto rounded-md"
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">
                        Kategorie
                      </Label>
                      <Select
                        value={category}
                        onValueChange={setCategory}
                        required
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Vyberte kategorii" />
                        </SelectTrigger>
                        <SelectContent>
                          {data?.getCategories.map(
                            (cat: { id: string; name: string }) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ageMin" className="text-sm font-medium">
                          Minimální Věk
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            id="ageMin"
                            value={ageMin || ""}
                            onChange={(e) => {
                              const validated = validateNumberInput(e.target.value);
                              setAgeMin(validated);
                            }}
                            required
                            className="pl-10 bg-white"
                            placeholder="Min věk"
                          />
                          <ArrowDownWideNarrow
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ageMax" className="text-sm font-medium">
                          Maximální Věk
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            id="ageMax"
                            value={ageMax || ""}
                            onChange={(e) => {
                              const validated = validateNumberInput(e.target.value);
                              setAgeMax(validated);
                            }}
                            required
                            className="pl-10 bg-white"
                            placeholder="Max věk"
                          />
                          <ArrowUpNarrowWide
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateEventLoading}
                >
                  {updateEventLoading ? "Událost se upravuje..." : "Upravit událost"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default EditEvent;
