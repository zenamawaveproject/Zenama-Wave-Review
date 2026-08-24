export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        // Menerima input idSeri & pin dari admin-generate.html
        const body = await request.json().catch(() => ({}));
        const { idSeri, pin } = body;

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "KV Binding 'CARDS_KV' belum terpasang." 
            }), { status: 500 });
        }

        if (!idSeri || !pin) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "ID Seri dan PIN wajib diisi!" 
            }), { status: 400 });
        }

        // Cek Pengecekan Duplikat di Cloudflare KV
        const existing = await env.CARDS_KV.get(idSeri);
        if (existing) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: `ID Seri ${idSeri} sudah terdaftar di KV! Silakan acak ID baru.` 
            }), { status: 400 });
        }

        // Formatting struktur data JSON KV
        const cardData = {
            client_id: idSeri,
            client_name: "",
            username: "",
            password: "",
            pin: pin,
            google_review_url: "",
            stats: {
                total_qr: 0,
                total_tap: 0
            },
            logs: [],
            link: "",
            place_id: "",
            activated_at: null
        };

        // Simpan ke KV dengan Key = idSeri
        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Kartu ${idSeri} berhasil disimpan ke KV!`,
            data: cardData
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
