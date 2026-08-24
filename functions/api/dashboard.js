// GET: Mengambil data link & status kartu
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const idSeri = url.searchParams.get('id');

        if (!idSeri) {
            return new Response(JSON.stringify({ success: false, message: "Parameter ID dibutuhkan." }), { status: 400 });
        }

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "Kartu tidak ditemukan." }), { status: 404 });
        }

        let cardData = { reviewUrl: "" };
        try {
            cardData = JSON.parse(rawData);
        } catch (e) {
            cardData = { password: rawData, reviewUrl: "" };
        }

        return new Response(JSON.stringify({
            success: true,
            idSeri: idSeri,
            reviewUrl: cardData.reviewUrl || ""
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

// POST: Menyimpan link Google Review baru dari Dashboard
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { idSeri, reviewUrl } = await request.json();

        const rawData = await env.CARDS_KV.get(idSeri);
        if (!rawData) {
            return new Response(JSON.stringify({ success: false, message: "Kartu tidak ditemukan." }), { status: 404 });
        }

        let cardData = {};
        try {
            cardData = JSON.parse(rawData);
        } catch (e) {
            cardData = { password: rawData };
        }

        // Update URL Review
        cardData.reviewUrl = reviewUrl;

        await env.CARDS_KV.put(idSeri, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Link Google Review berhasil diperbarui!" 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
                        }

