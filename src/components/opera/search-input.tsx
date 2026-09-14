import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export function SearchInput({
  value,
  onValueChange,
  className,
  placeholder = 'Cari…',
  'aria-label': ariaLabel,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('group/search relative w-full', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/search:text-emerald-600"
      />
      <Input
        {...props}
        type="search"
        value={value}
        onChange={event => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? String(placeholder)}
        className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-10 shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onValueChange('')}
          aria-label="Hapus pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
