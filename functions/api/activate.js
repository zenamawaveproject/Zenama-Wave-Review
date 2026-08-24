export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, password } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { status: 500 });
        }

        // Cek apakah ID Seri sudah pernah terdaftar di KV
        const existingData = await env.CARDS_KV.get(idSeri);
        if (existingData) {
            return new Response(JSON.stringify({ success: false, message: "Kartu sudah diaktivasi sebelumnya. Silakan Login." }), { status: 400 });
        }

        // Simpan data kartu berupa JSON String ke KV
        const cardData = {
            password: password,
            reviewUrl: "",
            status: "active",
            activatedAt: new Date().toISOString()
        };

        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Aktivasi berhasil disimpan!" 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

