'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/config";
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { gql, useMutation } from "@apollo/client";
import { getApolloClient } from "../apollo-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ADD_USER = gql`
  mutation AddUser($user: UserInput!) {
    addUser(user: $user) {
      name
      age
      email
      notificationsEnabled
      profileImage
    }
  }
`;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number | string>("");
  const router = useRouter();
  const { toast } = useToast();
  const [addUser] = useMutation(ADD_USER, {
    client: getApolloClient(),
  });

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password || !firstName || !lastName || !age) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if(Number(age) <= 0 || Number(age) >= 150){
      toast({
        title: "Špatný věk",
        description: "Zadali jste příliš velký nebo malý věk!",
        variant: "destructive"
      });
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, password);
      await addUser({
        variables: {
          user: {
            name: `${firstName} ${lastName}`,
            age: Number(age),
            email: email,
            notificationsEnabled: false,
            profileImage: "",
          },
        },
      });
      toast({
        title: "Účet vytvořen",
        description: "Váš účet byl úspěšně vytvořen.",
      });
      router.push("/MainPage");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
            <Button
              variant="ghost"
              className="fixed"
              onClick={() => router.push("/LoginPage")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          <CardTitle className="text-2xl font-bold text-center text-purple-600">
            Vytvořit účet
          </CardTitle>
          <CardDescription className="text-center">
            Zaregistrujte se pro nový účet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Jméno</Label>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jméno"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Příjmení</Label>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Příjmení"
                required
              />
            <div className="space-y-2">
              <Label htmlFor="age">Věk</Label>
              <Input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Váš věk"
                required
              />
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Emailová adresa</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadejte vaše heslo"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Vytvořit účet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
