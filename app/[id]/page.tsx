'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MyLoader } from "../components/uis/loading";
import { useParams } from 'next/navigation';
import EventView from "../components/singleevent";

export default function Detail() {
  const params = useParams();
  const eventId = params?.id;
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
    <MyLoader/>
  }

  if (!eventId) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <EventView eventId={eventId} />
    </main>
  );
}