import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('p-4', true && 'm-2', false && 'hidden')).toBe('p-4 m-2');
  });

  it('handles undefined and null', () => {
    expect(cn('p-4', undefined, null)).toBe('p-4');
  });
});
