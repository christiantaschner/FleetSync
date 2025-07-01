
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/app/dashboard');
  return null; // Or a loading spinner, but redirect handles it quickly.
}
