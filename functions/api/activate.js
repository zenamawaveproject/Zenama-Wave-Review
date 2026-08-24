export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, pin, namaPemilik, noHp, password, reviewUrl } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding belum terpasang." }), { status: 500 });
        }

        // Ambil data ID Seri dari KV
        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri Kartu tidak terdaftar!" }), { status: 404 });
        }

        const cardData = JSON.parse(rawData);

        // 1. Cek apakah kartu sudah pernah aktif
        if (cardData.isActivated) {
            return new Response(JSON.stringify({ success: false, message: "Kartu ini sudah diaktivasi sebelumnya! Silakan Login." }), { status: 400 });
        }

        // 2. Cocokkan PIN Default
        if (cardData.pinDefault !== pin) {
            return new Response(JSON.stringify({ success: false, message: "PIN Default Salah!" }), { status: 401 });
        }

        // 3. Update data kartu dengan identitas & password baru pemilik
        cardData.namaPemilik = namaPemilik;
        cardData.noHp = noHp;
        cardData.password = password; // Digunakan untuk login nanti
        cardData.reviewUrl = reviewUrl;
        cardData.isActivated = true;
        cardData.activatedAt = new Date().toISOString();

        // Simpan kembali ke KV
        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Kartu Berhasil Diaktivasi!" 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
