/** Matches the backend limit in backend/src/validators/account.schema.ts. */
export const maxAvatarLength = 150_000;
export const avatarFileTypes = ["image/png", "image/jpeg", "image/webp"];
const maxSourceBytes = 5 * 1024 * 1024;
const avatarSize = 256;

/** Center-crops and resizes an image to a 256x256 JPEG data URL, so uploads stay small. */
export async function resizeAvatar(file: File): Promise<string> {
  if (!avatarFileTypes.includes(file.type)) throw new Error("รองรับเฉพาะไฟล์ PNG, JPEG หรือ WebP");
  if (file.size > maxSourceBytes) throw new Error("ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("ไม่สามารถอ่านไฟล์รูปนี้ได้");
  });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = avatarSize;
    canvas.height = avatarSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เบราว์เซอร์นี้ไม่รองรับการปรับขนาดรูป");
    context.fillStyle = "#ffffff"; // JPEG has no transparency
    context.fillRect(0, 0, avatarSize, avatarSize);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, avatarSize, avatarSize);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl.length > maxAvatarLength) throw new Error("รูปโปรไฟล์มีขนาดใหญ่เกินไป");
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
