'use client';

import * as React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn('grid gap-2', className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onSelect: () => onValueChange?.(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
});
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(({ className, value, checked, onSelect, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="radio"
    aria-checked={checked}
    onClick={onSelect}
    className={cn(
      'flex items-center gap-3 rounded-lg border border-border p-3',
      'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'transition-colors duration-200',
      checked ? 'border-primary bg-primary/10' : 'hover:bg-muted',
      className
    )}
    {...props}
  >
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
        checked ? 'border-primary' : 'border-muted-foreground'
      )}
    >
      {checked && (
        <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
      )}
    </span>
    {children}
  </button>
));
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
