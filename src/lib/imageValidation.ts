
/**
 * Shared utility to validate image files for the BookLoop application.
 * Restricts uploads to: jpg, jpeg, png, webp.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file based on its MIME type and extension.
 * @param file The file to validate.
 * @returns An object containing the validation result and an optional error message.
 */
export const validateImageFile = (file: File): ValidationResult => {
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only image files are allowed: jpg, jpeg, png, webp'
    };
  }

  // Check extension (optional but provides extra layer)
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Only image files are allowed: jpg, jpeg, png, webp'
    };
  }

  return { valid: true };
};
