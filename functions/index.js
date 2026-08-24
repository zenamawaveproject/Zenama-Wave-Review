export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const rawId = url.searchParams.get('id');
    const source = url.searchParams.get('src') || 'qr'; // 'qr' atau 'tap'

    // 1. Jika tidak ada query ?id=, tampilkan index.html (Landing Page / Form Aktivasi)
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

// ==========================================
// ENDPOINT HANDLER (POST /api/generate)
// ==========================================
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Handler untuk endpoint Admin Generate Kartu Baru
    if (url.pathname === '/api/generate') {
        try {
            const body = await request.json();
            const { idSeri, pin } = body;

            if (!idSeri || !pin) {
                return new Response(JSON.stringify({ success: false, message: "ID Seri dan PIN wajib diisi." }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const cleanId = idSeri.toUpperCase().trim();
            const targetQrUrl = `https://cards.zenamagroup.com/?id=${cleanId}&src=qr`;

            // 1. Ambil Gambar QR Code HD (1000x1000) dari API Generator
            const qrFetchUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(targetQrUrl)}`;
            const qrResponse = await fetch(qrFetchUrl);
            
            let qrBase64String = "";
            if (qrResponse.ok) {
                const arrayBuffer = await qrResponse.arrayBuffer();
                // Konversi ArrayBuffer ke Format Base64 String
                const base64Data = btoa(
                    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                qrBase64String = `data:image/png;base64,${base64Data}`;
            }

            // 2. Susun Data Kartu yang Akan Disimpan ke CARDS_KV
            const newCardData = {
                idSeri: cleanId,
                pin: pin,
                status: "available",
                activated_at: null,
                google_review_url: "",
                qr_code_base64: qrBase64String, // Gambar QR Tersimpan Permanen di KV
                stats: {
                    total_qr: 0,
                    total_tap: 0
                }
            };

            // 3. Simpan ke Cloudflare KV
            await env.CARDS_KV.put(cleanId, JSON.stringify(newCardData));

            // 4. Kirim Respon Sukses ke admin-generate.html
            return new Response(JSON.stringify({
                success: true,
                message: `Kartu ${cleanId} berhasil disimpan ke KV!`,
                qr_code_base64: qrBase64String
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (err) {
            return new Response(JSON.stringify({ success: false, message: "Gagal memproses pembuatan kartu: " + err.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return env.ASSETS.fetch(request);
}
