// Byte-range support for videos.
//
// Workers static assets ignore the Range header: they always answer 200 with
// the whole file. Safari refuses to play a video served that way, and other
// browsers can't seek before the whole file has arrived. So for video files,
// cut the requested bytes out of the asset response here.
// https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#range-requests

const VIDEO = /\.(mp4|webm)$/i;

export const isVideo = (pathname) => VIDEO.test(pathname);

/** Parses a single `bytes=` range. Multi-range requests get the whole file. */
function parseRange(header, size) {
	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!match || (match[1] === '' && match[2] === '')) return null;
	let start;
	let end;
	if (match[1] === '') {
		// bytes=-500: the last 500 bytes.
		start = Math.max(size - Number(match[2]), 0);
		end = size - 1;
	} else {
		start = Number(match[1]);
		end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
	}
	if (start > end || start >= size) return { unsatisfiable: true };
	return { start, end };
}

/** Streams bytes [start, end] of `body`, then stops reading it. */
function sliceStream(body, start, end) {
	const reader = body.getReader();
	let position = 0;
	return new ReadableStream({
		async pull(controller) {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					controller.close();
					return;
				}
				const chunkStart = position;
				position += value.byteLength;
				if (position <= start) continue;
				const from = Math.max(start - chunkStart, 0);
				const to = Math.min(end + 1 - chunkStart, value.byteLength);
				controller.enqueue(value.subarray(from, to));
				if (position > end) {
					controller.close();
					reader.cancel().catch(() => {});
				}
				return;
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
}

/** Turns a full 200 asset response into a 206 (or 416) when the request asks for a range. */
export async function withRange(request, response) {
	if (response.status !== 200) return response;

	const headers = new Headers(response.headers);
	headers.set('Accept-Ranges', 'bytes');

	let size = Number(response.headers.get('Content-Length') ?? NaN);
	if (request.headers.has('Range') && !(size > 0) && response.body) {
		// No length announced: read the file once to know it.
		const bytes = await response.arrayBuffer();
		size = bytes.byteLength;
		headers.set('Content-Length', String(size));
		response = new Response(bytes, response);
	}
	const header = request.headers.get('Range');
	const ifRange = request.headers.get('If-Range');
	const etag = response.headers.get('ETag');
	const rangeStillValid = !ifRange || ifRange === etag;

	if (!header || !(size > 0) || !rangeStillValid) {
		if (request.method === 'HEAD') {
			response.body?.cancel();
			return new Response(null, { status: 200, headers });
		}
		return new Response(response.body, { status: 200, headers });
	}

	const range = parseRange(header, size);
	if (!range) return new Response(response.body, { status: 200, headers });

	if (range.unsatisfiable) {
		response.body?.cancel();
		headers.set('Content-Range', `bytes */${size}`);
		headers.delete('Content-Length');
		return new Response(null, { status: 416, headers });
	}

	const { start, end } = range;
	headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
	headers.set('Content-Length', String(end - start + 1));

	if (request.method === 'HEAD' || !response.body) {
		response.body?.cancel();
		return new Response(null, { status: 206, headers });
	}
	// A FixedLengthStream keeps Content-Length on the response: a plain stream
	// would be sent chunked, and Safari wants the length of each range.
	const length = end - start + 1;
	const { readable, writable } = new FixedLengthStream(length);
	sliceStream(response.body, start, end).pipeTo(writable).catch(() => {});
	return new Response(readable, { status: 206, headers });
}
