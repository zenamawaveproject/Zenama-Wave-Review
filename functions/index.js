export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const rawId = url.searchParams.get('id');
    const source = url.searchParams.get('src') || 'qr'; // 'qr' atau 'tap'

    // 1. Jika tidak ada query ?id=, tampilkan index.html (Landing Page)
    if (!rawId) {
        return env.ASSETS.fetch(request);
    }

    const idSeri = rawId.toUpperCase();

    // 2. Cek apakah KV Binding terpasang
    if (!env.CARDS_KV) {
        return env.ASSETS.fetch(request);
    }

    // 3. Ambil data dari KV
    const rawData = await env.CARDS_KV.get(idSeri);
    if (!rawData) {
        return env.ASSETS.fetch(request);
    }

    let cardData = JSON.parse(rawData);

    // 4. Jika kartu BELUM AKTIF, tampilkan index.html (Form Aktivasi)
    if (!cardData.activated_at) {
        return env.ASSETS.fetch(request);
    }

    // 5. Update Statistik Scan/Tap di KV
    if (!cardData.stats) {
        cardData.stats = { total_qr: 0, total_tap: 0 };
    }

    if (source === 'tap') {
        cardData.stats.total_tap = (cardData.stats.total_tap || 0) + 1;
    } else {
        cardData.stats.total_qr = (cardData.stats.total_qr || 0) + 1;
    }

    await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

    // 6. Redirect otomatis ke Google Review Toko Klien
    const targetUrl = cardData.google_review_url || cardData.link;
    if (targetUrl) {
        return Response.redirect(targetUrl, 302);
    }

    return env.ASSETS.fetch(request);
      }
                                    
