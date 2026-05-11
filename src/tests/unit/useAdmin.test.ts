import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';

// Mock the contexts
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user1' } })),
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useAdmin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies an admin user', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    
    (supabase.from as any).mockReturnValue({ select: mockSelect });
    
    const { result } = renderHook(() => useAdmin());
    
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.isAdmin).toBe(true);
  });

  it('identifies a non-admin user', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    
    (supabase.from as any).mockReturnValue({ select: mockSelect });
    
    const { result } = renderHook(() => useAdmin());
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });
});
