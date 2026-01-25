export const PERSONAL_BACKGROUND_BUCKET = "user-backgrounds";

export const MAX_BACKGROUND_FILE_SIZE_KB = 10240;
export const MAX_BRAND_BACKGROUNDS = 10;
export const ALLOWED_BACKGROUND_FORMATS = ["png", "jpg", "jpeg", "webp"] as const;

// Target aspect ratio for brand backgrounds (automatically cropped to 16:9)
export const TARGET_ASPECT_RATIO = 16 / 9; // 1.778
