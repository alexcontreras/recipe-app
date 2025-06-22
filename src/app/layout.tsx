'use client';

import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {AuthProvider, useAuth} from '@/contexts/authContext';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = {
//   title: 'Recipe App',
//   description:
//     'A full-stack recipe sharing platform with Next.js 15 and Firestore.',
// };

function Navigation() {
  const {currentUser, logout, loading} = useAuth(); // Use the auth context
  const router = useRouter(); // Import useRouter here as well

  const handleLogout = async () => {
    await logout();
    router.push('/login'); // Redirect to login after logout
  };

  if (loading) return null; // Don't render navigation until auth state is known

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Recipe App
        </Link>
        <div className="space-x-4">
          <Link href="/recipes" className="hover:text-gray-300">
            Recipes
          </Link>
          {currentUser ? (
            <>
              <span className="text-gray-400">
                Welcome, {currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link href="/signup" className="hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
