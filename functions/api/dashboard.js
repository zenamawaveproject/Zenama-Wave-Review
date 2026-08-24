// GET: Mengambil data kartu (nama, username, link, stats, PIN, activated_at) dari KV
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const rawId = url.searchParams.get('id');

        if (!rawId) {
            return new Response(JSON.stringify({ success: false, message: "Parameter ID dibutuhkan." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const idSeri = rawId.toUpperCase();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "Kartu tidak ditemukan." }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const cardData = JSON.parse(rawData);

        return new Response(JSON.stringify({
            success: true,
            idSeri: idSeri,
            client_name: cardData.client_name || "",
            username: cardData.username || idSeri.toLowerCase(),
            google_review_url: cardData.google_review_url || cardData.link || "",
            stats: cardData.stats || { total_qr: 0, total_tap: 0 },
            activated_at: cardData.activated_at || null,
            pin: cardData.pin || "1234" // Mengembalikan PIN untuk tampilan Dashboard
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}

// POST: Memproses Update Link, Ubah PIN, dan Ubah Password dari Dashboard
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const { idSeri: rawId, action } = body;

        if (!rawId) {
            return new Response(JSON.stringify({ success: false, message: "ID Seri tidak boleh kosong." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const idSeri = rawId.toUpperCase();

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ success: false, message: "KV Binding 'CARDS_KV' belum terpasang." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "Kartu tidak ditemukan." }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        let cardData = JSON.parse(rawData);

        // 1. OPSI SIMPAN LINK REVIEW
        if (action === 'update_link') {
            cardData.google_review_url = body.reviewUrl;
            cardData.link = body.reviewUrl;
        } 
        // 2. OPSI UBAH PIN
        else if (action === 'change_pin') {
            const currentPin = cardData.pin || "1234";
            if (body.oldPin !== currentPin) {
                return new Response(JSON.stringify({ success: false, message: "PIN Lama yang Anda masukkan salah!" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }
            cardData.pin = body.newPin;
        } 
        // 3. OPSI UBAH PASSWORD
        else if (action === 'change_password') {
            const currentPin = cardData.pin || "1234";
            if (body.pinVerify !== currentPin) {
                return new Response(JSON.stringify({ success: false, message: "Verifikasi PIN Keamanan Salah!" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }
            cardData.password = body.newPassword; // Memperbarui password di KV
        } 
        else {
            return new Response(JSON.stringify({ success: false, message: "Aksi tidak dikenal." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // Simpan perubahan data yang sudah diupdate ke Cloudflare KV
        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Perubahan berhasil disimpan di KV!" 
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}
