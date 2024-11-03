// cc: https://github.com/shadcn-ui/ui/discussions/1694#discussioncomment-8167582

import { cn } from '~/lib/utils';
import { Loader2 } from 'lucide-react';

const Loader = ({ className }: { className?: string }) => {
  return (
    <Loader2
      className={cn('h-4 w-4 animate-spin', className)}
    />
  );
};

export default Loader;