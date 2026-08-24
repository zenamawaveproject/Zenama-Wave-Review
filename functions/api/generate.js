export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, pin } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { status: 500 });
        }

        // Cek jika ID Seri sudah ada
        const existingData = await env.CARDS_KV.get(idSeri);
        if (existingData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri ini sudah ada di KV!" }), { status: 400 });
        }

        // Simpan struktur data awal ke KV
        const initialData = {
            pinDefault: pin,
            password: "",
            namaPemilik: "",
            noHp: "",
            reviewUrl: "",
            isActivated: false,
            createdAt: new Date().toISOString()
        };

        await env.CARDS_KV.put(idSeri, JSON.stringify(initialData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `ID Kartu ${idSeri} berhasil disimpan.` 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
