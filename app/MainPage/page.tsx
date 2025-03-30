'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import MainPage from "../components/mainpage";
import { MyLoader } from "../components/uis/loading";

export default function Mainpage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/LoginPage");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  if(loading){
    return(
        <MyLoader/>
    )
  }

  return (
    <main>
      <MainPage />
    </main>
  );
}
