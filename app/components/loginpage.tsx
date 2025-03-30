'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/config";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
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
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    return otp;
  };

  const sendOtpToEmail = async (email: string, otp: string) => {
    try {
      const response = await fetch("../api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: "Váš OTP kód pro přihlášení",
          text: `Váš OTP kód je: ${otp}`,
        }),
      });

      if (response.ok) {
        toast({
          title: "OTP kód odeslán",
          description: "Zkontrolujte svůj e-mail pro OTP kód.",
        });
      } else {
        throw new Error("Nepodařilo se odeslat OTP kód.");
      }
    } catch {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odeslat OTP kód.",
        variant: "destructive",
      });
    }
  };

  const handleLoginWithOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast({
        title: "Chyba",
        description: "Vyplňte prosím všechna pole.",
        variant: "destructive",
      });
      return;
    }

    try {
      
      await signInWithEmailAndPassword(auth, email, password);

      
      const otp = generateOtp();
      await sendOtpToEmail(email, otp);
      setOtpSent(true);
    } catch (error) {
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Neznámá chyba.",
        variant: "destructive",
      });
    }
  };

  const verifyOtp = async () => {
    if (otpCode === generatedOtp) {
      try {
        
        await setPersistence(auth, browserSessionPersistence);

        
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Úspěšné přihlášení",
          description: "Byli jste úspěšně přihlášeni.",
        });
        router.push("/MainPage");
      } catch (error) {
        toast({
          title: "Chyba",
          description: error instanceof Error ? error.message : "Neznámá chyba.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Chyba",
        description: "Neplatný OTP kód.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Chyba",
        description: "Zadejte prosím svůj e-mail pro obnovení hesla.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail odeslán",
        description: "Zkontrolujte svůj e-mail pro obnovení hesla.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Neznámá chyba.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-600">
            Vítejte zpět!
          </CardTitle>
          <CardDescription className="text-center">
            Přihlaste se ke svému účtu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleLoginWithOtp} className="space-y-4">
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
                Přihlásit se
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP kód</Label>
                <Input
                  type="text"
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Zadejte 6místný OTP kód"
                  required
                />
              </div>
              <Button onClick={verifyOtp} className="w-full">
                Ověřit
              </Button>
            </div>
          )}
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-blue-600 text-sm pr-14"
              onClick={handleForgotPassword}
            >
              Zapomněli jste heslo?
            </Button>
            <Link href={'/RegisterPage'} className="text-blue-600 text-sm">
              Vytvořit účet
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}