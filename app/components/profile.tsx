/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { getApolloClient } from '../apollo-client';
import BackButton from './uis/backbutton';
import { MyLoader } from './uis/loading';

const GET_USER = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      name
      age
      profileImage
      lastProfileUpdate
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($userId: ID!, $user: UserInput!) {
    updateUser(userId: $userId, user: $user) {
      id
      name
      age
      profileImage
      lastProfileUpdate
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailChanging, setIsEmailChanging] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [editable, setEditable] = useState(true);
  const [nextUpdateDate, setNextUpdateDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);
        setEmail(currentUser.email);
        setEmailVerified(currentUser.emailVerified);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setEmailVerified(user.emailVerified);
      }
    });

    fetchUser();

    return () => unsubscribe();
  }, []);

  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id: userId },
    client: getApolloClient(),
    skip: !userId,
  });

  const [updateUser] = useMutation(UPDATE_USER, {
    client: getApolloClient(),
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    client: getApolloClient(),
  });

  useEffect(() => {
    if (data?.getUserById?.lastProfileUpdate) {
      const lastProfileUpdate = data.getUserById.lastProfileUpdate;
      const lastUpdateDate = new Date(lastProfileUpdate);
      const currentDate = new Date();
      const timeDiff = currentDate.getTime() - lastUpdateDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff < 30) {
        setEditable(false);
      }
      const nextUpdate = new Date(lastUpdateDate);
      nextUpdate.setDate(lastUpdateDate.getDate() + 30);
      setNextUpdateDate(nextUpdate.toLocaleDateString('cs-CZ'));
    }
  }, [data, editable]);

  if (!userId) return <MyLoader />;
  if (loading) return <MyLoader />;
  if (error) return <p>Chyba při načítání dat uživatele.</p>;

  const user = data.getUserById;

  const handleUpdateUser = async (updatedUser: Partial<typeof user>) => {
    try {
      await updateUser({
        variables: {
          userId: userId,
          user: {
            name: updatedUser.name,
            age: Number(updatedUser.age),
            profileImage: updatedUser.profileImage,
          },
        },
      });

      setIsEditing(false);
      setEditable(false);
      setNextUpdateDate(null);
    } catch (error) {
      console.error('Chyba při aktualizaci uživatele:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('Opravdu chcete smazat svůj účet? Tato akce je nevratná.')) {
      try {
        await deleteUser({
          variables: {
            userId: userId,
          },
        });

        await auth.currentUser?.delete();

        window.location.href = '/';
      } catch (error) {
        console.error('Chyba při mazání uživatele:', error);
        alert('Nepodařilo se smazat účet. Zkuste to prosím znovu.');
      }
    }
  };

  async function handleEmailChange(newEmail: string, currentPassword: string) {
    if (auth.currentUser && auth.currentUser.email) {
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await verifyBeforeUpdateEmail(auth.currentUser, newEmail);

        alert('Prosím ověřte svou novou e-mailovou adresu. Po ověření obnovte stránku!');
      } catch (error) {
        console.error('Chyba při změně e-mailu:', error);
        if (error.code === 'auth/requires-recent-login') {
          alert('Pro změnu e-mailu se prosím přihlaste znovu.');
        } else if (error.code === 'auth/missing-password') {
          alert('Pro opětovné ověření zadejte své aktuální heslo.');
        }
      }
    }
  }

  return (
    <>
      <BackButton urlstring={'/MainPage'} />
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Profil</CardTitle>
          {!emailVerified && (
            <p className="text-sm text-red-500">
              Váš e-mail není ověřen. Pro provedení změn ověřte svůj e-mail.
            </p>
          )}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!emailVerified || !editable}>
                Upravit profil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upravit profil</DialogTitle>
              </DialogHeader>
              <EditProfileForm
                user={{ ...user, email }}
                onSubmit={handleUpdateUser}
                onEmailChange={() => setIsEmailChanging(true)}
                isEmailVerified={emailVerified}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.profileImage} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-500">{email}</p>
              {!emailVerified && (
                <p className="text-sm text-red-500">E-mail není ověřen. Prosím zkontrolujte svou e-mailovou schránku.</p>
              )}
              {!editable && (
                <p className="text-sm text-yellow-600">
                  Další úpravu profilu budete moci provést {nextUpdateDate}.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Věk" value={user.age.toString()} />
          </div>
          <Button variant="destructive" onClick={handleDeleteUser}>
            Smazat účet
          </Button>
        </CardContent>

        <Dialog open={isEmailChanging} onOpenChange={setIsEmailChanging}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Změnit e-mail</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newEmail = (e.target as HTMLFormElement).email.value;
                const password = (e.target as HTMLFormElement).password.value;
                handleEmailChange(newEmail, password);
              }}
            >
              <div>
                <Label htmlFor="newEmail">Nový e-mail</Label>
                <Input id="newEmail" name="email" type="email" required disabled={!emailVerified} />
              </div>
              <div>
                <Label htmlFor="password">Heslo</Label>
                <Input id="password" name="password" type="password" required disabled={!emailVerified} />
              </div>
              <Button type="submit" disabled={!emailVerified}>
                Aktualizovat e-mail
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="font-medium">{label}</Label>
      <p className="mt-1">{value}</p>
    </div>
  );
}

type User = {
  name: string;
  email: string;
  age: number;
  profileImage: string;
};

function EditProfileForm({
  user,
  onSubmit,
  onEmailChange,
  isEmailVerified,
}: {
  user: any;
  onSubmit: (user: Partial<User>) => void;
  onEmailChange: () => void;
  isEmailVerified: boolean;
}) {
  const [formData, setFormData] = useState(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Jméno</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={!isEmailVerified} />
      </div>
      <div>
        <Label htmlFor="age">Věk</Label>
        <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} disabled={!isEmailVerified} />
      </div>
      <Button type="submit" disabled={!isEmailVerified}>
        Uložit změny
      </Button>
      <Button variant="outline" onClick={onEmailChange} disabled={!isEmailVerified}>
        Změnit e-mail
      </Button>
    </form>
  );
}