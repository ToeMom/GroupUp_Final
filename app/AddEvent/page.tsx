'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MyLoader } from "../components/uis/loading";
import AddEvent from "../components/addevent";


export default function Addevent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/LoginPage");
      }
      else if (!currentUser.emailVerified){
        router.push('/MainPage')
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
      <AddEvent/>
    </main>
  );
}