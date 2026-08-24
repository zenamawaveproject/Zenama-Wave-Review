export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, password } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { status: 500 });
        }

        // Cek apakah ID Seri sudah ada di KV
        const existingData = await env.CARDS_KV.get(idSeri);
        if (existingData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri ini sudah terdaftar sebelumnya!" }), { status: 400 });
        }

        // Simpan data awal yang diset Admin ke KV
        const initialData = {
            password: password,
            reviewUrl: "",
            isActivated: false,
            createdAt: new Date().toISOString()
        };

        await env.CARDS_KV.put(idSeri, JSON.stringify(initialData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Berhasil generate ID: ${idSeri}` 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

