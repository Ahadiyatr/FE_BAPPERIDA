// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchInput } from './search-input';

afterEach(cleanup);

describe('SearchInput', () => {
  it('meneruskan perubahan dan menyediakan tombol hapus saat berisi', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <SearchInput value="" onValueChange={onValueChange} placeholder="Cari data…" />,
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari data…' }), 'a');
    expect(onValueChange).toHaveBeenCalledWith('a');

    rerender(
      <SearchInput value="data" onValueChange={onValueChange} placeholder="Cari data…" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));
    expect(onValueChange).toHaveBeenLastCalledWith('');
  });
});
