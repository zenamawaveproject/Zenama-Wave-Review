export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.CARDS_KV) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "KV Binding 'CARDS_KV' belum terpasang." 
            }), { status: 500 });
        }

        // Fungsi Helper untuk membuat 8 karakter acak (Angka & Huruf Kapital)
        function makeId(length = 8) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }

        // Fungsi Helper untuk membuat 8 digit PIN angka
        function makePin(length = 8) {
            const characters = '0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }

        let uniqueId = "";
        let isUnique = false;
        let attempts = 0;

        // Loop pengecekan duplikat di Cloudflare KV
        while (!isUnique && attempts < 10) {
            attempts++;
            const candidateId = makeId(8);
            const existing = await env.CARDS_KV.get(candidateId);
            
            if (!existing) {
                uniqueId = candidateId;
                isUnique = true;
            }
        }

        if (!isUnique) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "Gagal membuat ID unik, silakan coba lagi." 
            }), { status: 500 });
        }

        const generatedPin = makePin(8);

        // Formating struktur data default sesuai spesifikasi
        const cardData = {
            client_id: uniqueId,
            client_name: "",
            username: "",
            password: "",
            pin: generatedPin,
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

        // Simpan ke KV dengan key berupa client_id
        await env.CARDS_KV.put(uniqueId, JSON.stringify(cardData));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Kartu ${uniqueId} berhasil dibuat!`,
            data: cardData
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
    
