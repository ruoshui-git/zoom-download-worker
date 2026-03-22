/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;

export interface Env {
	FILE_KV: KVNamespace;
}

type FileItem = {
	content: string;
	filename: string;
	type: string;
};

type UploadRequest =
	| {
			content: string;
			filename?: string;
			type?: string;
	  }
	| {
			files: FileItem[];
	  };

type StoredPayload = {
	files: FileItem[];
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// =========================
		// POST /upload
		// =========================
		if (request.method === 'POST' && url.pathname === '/upload') {
			try {
				const body = (await request.json()) as UploadRequest;

				let files: FileItem[];

				if ('files' in body) {
					files = body.files;
				} else {
					files = [
						{
							content: body.content,
							filename: body.filename ?? 'file.txt',
							type: body.type ?? 'text/plain',
						},
					];
				}

				const id = crypto.randomUUID();

				const payload: StoredPayload = { files };

				await env.FILE_KV.put(id, JSON.stringify(payload), {
					expirationTtl: 300, // 5 minutes
				});

				return jsonResponse({
					url: `${url.origin}/download?id=${id}`,
				});
			} catch (err) {
				return jsonResponse({ error: 'Invalid request body' }, 400);
			}
		}

		// =========================
		// GET /download?id=...
		// =========================
		if (request.method === 'GET' && url.pathname === '/download') {
			const id = url.searchParams.get('id');

			if (!id) {
				return new Response('Missing id', { status: 400 });
			}

			const data = (await env.FILE_KV.get(id, 'json')) as StoredPayload | null;

			if (!data) {
				return new Response('Expired or invalid', { status: 404 });
			}

			const files = data.files;

			// ✅ Single file
			if (files.length === 1) {
				const file = files[0];

				return new Response(file.content, {
					headers: {
						'Content-Type': `${file.type}; charset=utf-8`,
						'Content-Disposition': `attachment; filename="${file.filename}"`,
					},
				});
			}

			// 🚧 Multiple files → ZIP (future)
			return new Response('Multiple files not implemented yet', { status: 501 });
		}

		return new Response('Not found', { status: 404 });
	},
};

// =========================
// Helpers
// =========================

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}