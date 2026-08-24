// GET: Mengambil data link, nama klien, dan statistik dari KV
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
            google_review_url: cardData.google_review_url || cardData.link || "",
            stats: cardData.stats || { total_qr: 0, total_tap: 0 },
            activated_at: cardData.activated_at || null
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

// POST: Memperbarui link Google Review baru dari Dashboard
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri: rawId, reviewUrl } = await request.json();

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

        // Update URL Review pada dua field agar sinkron
        cardData.google_review_url = reviewUrl;
        cardData.link = reviewUrl;

        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Link Google Review berhasil diperbarui!" 
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
    
