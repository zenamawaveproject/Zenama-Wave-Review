export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, password } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { status: 500 });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri tidak ditemukan!" }), { status: 404 });
        }

        const cardData = JSON.parse(rawData);

        // Cek apakah kartu sudah pernah diaktivasi
        if (!cardData.activated_at && !cardData.password) {
            return new Response(JSON.stringify({ success: false, message: "Kartu ini belum diaktivasi! Silakan scan QR/tap NFC untuk aktivasi." }), { status: 400 });
        }

        // Cek kecocokan password
        if (cardData.password !== password) {
            return new Response(JSON.stringify({ success: false, message: "Password salah!" }), { status: 401 });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Login berhasil!",
            client_id: cardData.client_id || idSeri,
            client_name: cardData.client_name || "",
            token: btoa(`${idSeri}:${password}`)
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
