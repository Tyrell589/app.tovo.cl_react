/**
 * @fileoverview Home route redirects to /dashboard
 */
import { redirect } from 'next/navigation';

export default function Home() {
	redirect('/dashboard');
}


