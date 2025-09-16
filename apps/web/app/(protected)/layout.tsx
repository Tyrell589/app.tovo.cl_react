/**
 * @fileoverview Protected layout with AuthGuard + Top bars
 */
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import axios from 'axios';
import { TopBar } from '@/components/TopBar';
import { SubTopBar } from '@/components/SubTopBar';

async function authGuard() {
	const cookieStore = cookies();
	const token = cookieStore.get('token')?.value;
	if (!token) {
		return { ok: false };
	}
	try {
		await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
			withCredentials: true
		});
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
	const auth = await authGuard();
	if (!auth.ok) {
		// Soft server redirect
		return (
			<html lang="en"><body><script dangerouslySetInnerHTML={{__html: 'window.location.href="/login"'}} /></body></html>
		);
	}
	return (
		<html lang="en">
			<body>
				<TopBar />
				<SubTopBar title="Panel" />
				{children}
			</body>
		</html>
	);
}


