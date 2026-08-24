export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, password } = await request.json();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding belum terpasang." }), { status: 500 });
        }

        const rawData = await env.CARDS_KV.get(idSeri);

        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri tidak ditemukan!" }), { status: 404 });
        }

        // Parsing data KV (Mendukung format JSON baru atau String password lama)
        let savedPassword = rawData;
        try {
            const parsed = JSON.parse(rawData);
            savedPassword = parsed.password;
        } catch (e) {
            savedPassword = rawData;
        }

        if (savedPassword !== password) {
            return new Response(JSON.stringify({ success: false, message: "Password salah!" }), { status: 401 });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Login berhasil!",
            token: btoa(`${idSeri}:${password}`)
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
          }

