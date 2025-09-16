/**
 * @fileoverview Login page shell wired to auth-service
 */
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function LoginPage() {
	const [usu_usuario, setUser] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await axios.post(`${process.env.AUTH_SERVICE_URL}/api/auth/login`, { usu_usuario, password }, { withCredentials: true });
			window.location.href = '/dashboard';
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Login failed');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-md p-6 shadow-sm">
				<h1 className="text-xl font-semibold">Iniciar sesión</h1>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<div>
					<label className="block text-sm mb-1">Usuario</label>
					<input className="w-full border rounded px-3 py-2" value={usu_usuario} onChange={e => setUser(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Contraseña</label>
					<input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
				</div>
				<button className="w-full bg-primary text-white rounded px-3 py-2">Entrar</button>
			</form>
		</div>
	);
}


