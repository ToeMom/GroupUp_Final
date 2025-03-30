'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { MyLoader } from "../components/uis/loading";
import UserProfile from "../components/profile";

export default function Mainpage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth2 = auth;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth2, (currentUser) => {
      if (!currentUser) {
        router.push("/LoginPage");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth2, router]);

  if(loading){
    return <MyLoader/>
  }

  return (
    <main>
      <UserProfile/>
    </main>
  );
}
