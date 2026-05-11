import { describe, it, expect } from 'vitest';
import { validateImageFile } from '@/lib/imageValidation';

describe('validateImageFile utility', () => {
  it('validates correct image files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it('rejects incorrect MIME types', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only image files are allowed');
  });

  it('rejects incorrect extensions', () => {
    const file = new File([''], 'test.exe', { type: 'image/jpeg' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only image files are allowed');
  });
});
