'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '../img/Logo.png';
import Link from 'next/link';

export default function WelcomePage() {
  const router = useRouter();

  const navigateToRegist = () => {
    router.push('../RegisterPage')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">

        <div className="text-center">
          <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
            Vítejte v
          </h1>
          <Image
            src={Logo}
            alt="Logo GroupUp"
            width={300}
            height={300}
            priority
            className="mx-auto mt-4 border rounded-md"
          />
        </div>

        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Objevte a připojte se k událostem ve vašem okolí. Spojte se s lidmi, prozkoumejte aktivity
          a vytvořte nezapomenutelné zážitky.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={navigateToRegist}
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Začít
          </button>

          <p className="text-xs sm:text-sm text-gray-500">
            Už máte účet? <Link href="../LoginPage" className="font-medium text-blue-600 hover:text-blue-500">Přihlásit se</Link>
          </p>
        </div>
      </div>
    </div>

  );
}

