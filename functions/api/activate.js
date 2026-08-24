export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, pin, namaPemilik, noHp, password, reviewUrl, activationSource } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { status: 500 });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri Kartu tidak terdaftar!" }), { status: 404 });
        }

        let cardData = JSON.parse(rawData);

        // Cek jika kartu sudah pernah diaktivasi sebelumnya
        if (cardData.activated_at) {
            return new Response(JSON.stringify({ success: false, message: "Kartu ini sudah diaktivasi sebelumnya! Silakan Login." }), { status: 400 });
        }

        // Cek PIN Default (Sesuai dengan field 'pin' di KV)
        if (cardData.pin !== pin) {
            return new Response(JSON.stringify({ success: false, message: "PIN Default Salah!" }), { status: 401 });
        }

        // Update data pemilik & URL Google Review
        cardData.client_name = namaPemilik;
        cardData.password = password;
        cardData.google_review_url = reviewUrl;
        cardData.link = reviewUrl;
        
        // Buat username otomatis dari nama pemilik (lowercase tanpa spasi)
        cardData.username = namaPemilik.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Format tanggal ISO/Lokal
        const now = new Date();
        cardData.activated_at = now.toISOString().replace('T', ' ').substring(0, 19);

        // Update statistik awal berdasarkan sumber aktivasi (QR / TAP)
        if (activationSource === 'qr') {
            cardData.stats.total_qr = (cardData.stats.total_qr || 0) + 1;
        } else if (activationSource === 'tap') {
            cardData.stats.total_tap = (cardData.stats.total_tap || 0) + 1;
        }

        // Catat Log Aktivasi
        if (!Array.isArray(cardData.logs)) {
            cardData.logs = [];
        }
        cardData.logs.push({
            event: "activation",
            source: activationSource || "unknown",
            timestamp: cardData.activated_at
        });

        // Simpan pembaruan data ke Cloudflare KV
        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Kartu Berhasil Diaktivasi!" 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
