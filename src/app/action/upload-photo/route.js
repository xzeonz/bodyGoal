"use server";

export async function uploadDummyPhoto() {
  // Simulasi upload ke Cloudflare R2, kembalikan URL dummy
  const url =
    "https://www.unsulbarnews.com/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-12-at-08.38.20.jpeg";
  return { url };
}
