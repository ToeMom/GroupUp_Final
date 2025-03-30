'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '@/firebase/config';
import { MyLoader } from "../../components/uis/loading";
import { useParams } from 'next/navigation';
import EditEvent from "../../components/editevent";

export default function EditEventDetail() {
  const params = useParams();
  const eventId = params?.id;
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/LoginPage");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if(loading){
    <MyLoader/>
  }

  if (!eventId) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <EditEvent eventsId={eventId}/>
    </main>
  );
}