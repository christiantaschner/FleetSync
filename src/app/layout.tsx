
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { Inter } from 'next/font/google';
import { LanguageProvider } from '@/hooks/use-language';
import { APIProvider as GoogleMapsAPIProvider } from '@vis.gl/react-google-maps';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FleetSync AI',
  description: 'AI-Powered Fleet Management Solution',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="flex h-screen w-screen items-center justify-center bg-background text-destructive p-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
            <p>Google Maps API Key is not configured. The application cannot start.</p>
            <p className="text-sm text-muted-foreground mt-2">Please set <code className="bg-muted p-1 rounded-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <GoogleMapsAPIProvider apiKey={googleMapsApiKey} libraries={['places', 'geocoding', 'maps']}>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </GoogleMapsAPIProvider>
        <Toaster />
      </body>
    </html>
  );
}
