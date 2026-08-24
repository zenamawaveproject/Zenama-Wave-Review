export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        // Menerima input idSeri & pin dari admin-generate.html
        const body = await request.json().catch(() => ({}));
        let { idSeri, pin } = body;

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "KV Binding 'CARDS_KV' belum terpasang." 
            }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        if (!idSeri || !pin) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "ID Seri dan PIN wajib diisi!" 
            }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Format ID Seri menjadi Huruf Kapital & Tanpa Spasi
        const formattedId = idSeri.toUpperCase().trim();

        // Cek Pengecekan Duplikat di Cloudflare KV
        const existing = await env.CARDS_KV.get(formattedId);
        if (existing) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: `ID Seri ${formattedId} sudah terdaftar di KV! Silakan acak ID baru.` 
            }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Formatting struktur data JSON KV (Sesuai Asli)
        const cardData = {
            client_id: formattedId,
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

        // Simpan ke KV dengan Key = formattedId
        await env.CARDS_KV.put(formattedId, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Kartu ${formattedId} berhasil disimpan ke KV!`,
            data: cardData
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: error.message 
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
