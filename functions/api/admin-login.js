export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { username, password } = await request.json();

        // Ambil Username & Password dari Environment Variables Cloudflare
        const secretAdminUser = env.ADMIN_USERNAME || "admin";
        const secretAdminPass = env.ADMIN_PASSWORD || "Admin123!";

        // Verifikasi Username dan Password
        if (username !== secretAdminUser || password !== secretAdminPass) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: "Username atau Password Admin Salah!" 
            }), { status: 401 });
        }

        // Buat token sesi admin
        const adminToken = btoa(`admin_session_${Date.now()}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Login Admin Berhasil!",
            token: adminToken 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
