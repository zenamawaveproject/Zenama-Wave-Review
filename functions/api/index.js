export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const idSeri = url.searchParams.get('id');
    const source = url.searchParams.get('src') || 'qr'; // 'qr' atau 'tap'

    // Jika tidak ada parameter ID, tampilkan halaman landing page index.html
    if (!idSeri) {
        return env.ASSETS.fetch(request);
    }

    if (!env.CARDS_KV) {
        return env.ASSETS.fetch(request);
    }

    const rawData = await env.CARDS_KV.get(idSeri.toUpperCase());
    if (!rawData) {
        return env.ASSETS.fetch(request);
    }

    let cardData = JSON.parse(rawData);

    // Jika belum diaktivasi, biarkan masuk ke form aktivasi di index.html
    if (!cardData.activated_at) {
        return env.ASSETS.fetch(request);
    }

    // UPDATE STATISTIK SCAN/TAP OTOMATIS
    if (!cardData.stats) {
        cardData.stats = { total_qr: 0, total_tap: 0 };
    }

    if (source === 'tap') {
        cardData.stats.total_tap = (cardData.stats.total_tap || 0) + 1;
    } else {
        cardData.stats.total_qr = (cardData.stats.total_qr || 0) + 1;
    }

    // Simpan pembaruan hitungan ke KV
    await env.CARDS_KV.put(idSeri.toUpperCase(), JSON.stringify(cardData));

    // REDIRECT LANGSUNG KE GOOGLE REVIEW TOKO
    const targetUrl = cardData.google_review_url || cardData.link;
    if (targetUrl) {
        return Response.redirect(targetUrl, 302);
    }

    return env.ASSETS.fetch(request);
}
