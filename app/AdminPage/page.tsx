'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MyLoader } from "../components/uis/loading";
import AdminPage from "../components/adminpage";
import { gql, useLazyQuery } from "@apollo/client";
import { getApolloClient } from "../apollo-client";

const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      name
      admin
    }
  }
`;

export default function Addevent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const [fetchUser, { data, loading: UserLoading }] = useLazyQuery(GET_USER_BY_ID, {
    client: getApolloClient(),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/LoginPage");
        return;
      }

      await fetchUser({ variables: { id: currentUser.uid } });
    });

    return () => unsubscribe();
  }, [auth, fetchUser, router]);

  useEffect(() => {
    if (data && data.getUserById) {
      const { admin } = data.getUserById;
      if (!admin) {
        router.push("/MainPage");
      } else {
        setLoading(false);
      }
    }
  }, [data, router]);

  if (loading || UserLoading) {
    return <MyLoader />;
  }

  return (
    <main>
      <AdminPage />
    </main>
  );
}