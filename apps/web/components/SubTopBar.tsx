/**
 * @fileoverview Secondary bar mirroring barra-subtop.php
 */
export function SubTopBar({ title }: { title: string }) {
	return (
		<div className="w-full border-b bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-2 text-sm text-gray-700">
				{title}
			</div>
		</div>
	);
}


