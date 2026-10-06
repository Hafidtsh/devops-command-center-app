import { redirect } from 'next/navigation';

// Root redirects to dashboard; auth guard handles unauthenticated users
export default function RootPage() {
  redirect('/dashboard');
}
