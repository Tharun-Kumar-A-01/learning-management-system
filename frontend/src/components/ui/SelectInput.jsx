import {
  Select as HeadlessSelect,
  Field,
  Label,
  Description,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

export function Select({
  label,
  description,
  children,
  className,
  ...props
}) {
  return (
    <Field>
      {label && (
        <Label className="text-sm/6 font-medium text-white">
          {label}
        </Label>
      )}

      {description && (
        <Description className="text-sm/6 text-white/50">
          {description}
        </Description>
      )}

      <div className="relative">
        <HeadlessSelect
          {...props}
          className={clsx(
            'mt-3 block w-full appearance-none rounded-lg border-none',
            'bg-white/5 px-3 py-1.5 text-sm/6 text-white',
            'focus:not-data-focus:outline-none',
            'data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
            '*:text-black',
            className
          )}
        >
          {children}
        </HeadlessSelect>

        <ChevronDownIcon
          className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
}
