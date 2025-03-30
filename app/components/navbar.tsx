"use client"

import { signOut, type User } from "firebase/auth"
import Logo from "../img/Logo.png"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type FC, useState, useEffect } from "react"
import { auth } from "../../firebase/config"
import { sendEmailVerification } from "firebase/auth"
import { LogIn, UserIcon, Mail, LogOut, UserCog, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { gql, useQuery } from "@apollo/client"
import { getApolloClient } from "../apollo-client"

const GET_USER = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      admin
      moderator
    }
  }
`;

const Navbar: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const { data } = useQuery(GET_USER, {
    variables: { id: user?.uid },
    client: getApolloClient(),
    skip: !user?.uid,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Odhlášení úspěšné",
        description: "Byli jste úspěšně odhlášeni.",
      });
      router.push("/LoginPage");
    } catch (error) {
      console.error("Chyba při odhlášení:", error);
      toast({
        title: "Chyba při odhlášení",
        description: "Nastala chyba při pokusu o odhlášení. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    }
  };

  const handleEmailVerification = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        toast({
          title: "Ověřovací e-mail odeslán",
          description: "Zkontrolujte svou e-mailovou schránku a klikněte na odkaz pro ověření.",
        });
      } catch (error) {
        console.error("Chyba při odesílání ověřovacího e-mailu:", error);
        toast({
          title: "Chyba při odesílání e-mailu",
          description: "Nastala chyba při odesílání ověřovacího e-mailu. Zkuste to prosím znovu.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "E-mail již ověřen",
        description: "Váš e-mail je již ověřen.",
      });
    }
  };

  const handleHomeRedirect = () => {
    router.push("/MainPage");
    setIsOpen(false);
  };
  const handleUserEventsRedirect = () => {
    router.push("/YourEvents");
    setIsOpen(false);
  };
  const handleProfileRedirect = () => {
    router.push("/Profile");
    setIsOpen(false);
  };
  const handleLoginRedirect = () => {
    router.push("/LoginPage");
    setIsOpen(false);
  };
  const handleAdminRedirect = () => {
    router.push("/AdminPage");
    setIsOpen(false);
  };
  const handleModeratorRedirect = () => {
    router.push("/ModeratorPage");
    setIsOpen(false);
  };

  const navItems = [
    { label: "Domů", action: handleHomeRedirect },
    { label: "Moje Události", action: handleUserEventsRedirect },
    ...(data?.getUserById?.admin
      ? [
          { label: "Admin", action: handleAdminRedirect },
          { label: "Moderator", action: handleModeratorRedirect },
        ]
      : data?.getUserById?.moderator
      ? [{ label: "Moderator", action: handleModeratorRedirect }]
      : []),
  ];

  const renderMenuItems = () => (
    <>
      {navItems.map((item, index) => (
        <Button key={index} variant="ghost" onClick={item.action} className="w-full justify-start">
          {item.label}
        </Button>
      ))}
      {user ? (
        <>
          {!user.emailVerified && (
            <Button variant="ghost" onClick={handleEmailVerification} className="w-full justify-start">
              <Mail className="mr-2 h-4 w-4" />
              Ověřit e-mail
            </Button>
          )}
          <Button variant="ghost" onClick={handleProfileRedirect} className="w-full justify-start">
            <UserCog className="mr-2 h-4 w-4" />
            Profil
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </Button>
        </>
      ) : (
        <Button variant="ghost" onClick={handleLoginRedirect} className="w-full justify-start">
          <LogIn className="mr-2 h-4 w-4" />
          Přihlásit se
        </Button>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Image src={Logo || "/placeholder.svg"} alt="GroupUp Logo" width={100} height={40} className="h-8 w-auto" />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={item.action}
                className="text-white hover:bg-blue-700 hover:text-white"
              >
                {item.label}
              </Button>
            ))}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-blue-700 hover:text-white">
                    <UserIcon className="mr-2 h-4 w-4" />
                    {user.email || "Profil"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {!user.emailVerified && (
                    <DropdownMenuItem onClick={handleEmailVerification}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Ověřit e-mail</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleProfileRedirect}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Odhlásit se</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={handleLoginRedirect}
                className="text-white hover:bg-blue-700 hover:text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Přihlásit se
              </Button>
            )}
          </div>
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-blue-700 hover:text-white p-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetTitle/>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">{renderMenuItems()}</nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

