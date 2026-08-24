export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const idSeri = url.searchParams.get('id');
    const source = url.searchParams.get('src') || 'qr'; // Default ke 'qr' jika src kosong

    // 1. Jika tidak ada query ?id=, langsung tampilkan Landing Page (index.html)
    if (!idSeri) {
        return env.ASSETS.fetch(request);
    }

    // 2. Cek apakah KV Binding sudah terpasang
    if (!env.CARDS_KV) {
        return env.ASSETS.fetch(request);
    }

    // 3. Ambil data kartu dari KV
    const rawData = await env.CARDS_KV.get(idSeri.toUpperCase());
    if (!rawData) {
        return env.ASSETS.fetch(request);
    }

    let cardData = JSON.parse(rawData);

    // 4. Jika kartu BELUM AKTIF, biarkan ke halaman Form Aktivasi (index.html)
    if (!cardData.activated_at) {
        return env.ASSETS.fetch(request);
    }

    // 5. KARTU SUDAH AKTIF: Tambah counter statistik scan/tap
    if (!cardData.stats) {
        cardData.stats = { total_qr: 0, total_tap: 0 };
    }

    if (source === 'tap') {
        cardData.stats.total_tap = (cardData.stats.total_tap || 0) + 1;
    } else {
        cardData.stats.total_qr = (cardData.stats.total_qr || 0) + 1;
    }

    // 6. Simpan pembaruan jumlah statistik ke Cloudflare KV
    await env.CARDS_KV.put(idSeri.toUpperCase(), JSON.stringify(cardData));

    // 7. Redirect otomatis ke URL Google Review Toko Klien
    const targetUrl = cardData.google_review_url || cardData.link;
    if (targetUrl) {
        return Response.redirect(targetUrl, 302);
    }

    return env.ASSETS.fetch(request);
}
