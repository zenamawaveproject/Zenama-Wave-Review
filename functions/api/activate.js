export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, pin, namaPemilik, noHp, password, reviewUrl, activationSource } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding belum terpasang." }), { status: 500 });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri Kartu tidak terdaftar!" }), { status: 404 });
        }

        const cardData = JSON.parse(rawData);

        if (cardData.isActivated) {
            return new Response(JSON.stringify({ success: false, message: "Kartu ini sudah diaktivasi sebelumnya! Silakan Login." }), { status: 400 });
        }

        if (cardData.pinDefault !== pin) {
            return new Response(JSON.stringify({ success: false, message: "PIN Default Salah!" }), { status: 401 });
        }

        // Simpan data pemilik & sumber aktivasi (QR atau TAP)
        cardData.namaPemilik = namaPemilik;
        cardData.noHp = noHp;
        cardData.password = password;
        cardData.reviewUrl = reviewUrl;
        cardData.isActivated = true;
        cardData.activatedSource = activationSource || 'unknown'; // Menyelipkan catatan 'qr' atau 'tap'
        cardData.activatedAt = new Date().toISOString();

        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Kartu Berhasil Diaktivasi!" 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
