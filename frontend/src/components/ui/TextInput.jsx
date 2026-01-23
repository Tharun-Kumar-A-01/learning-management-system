import {
  Input as HeadlessInput,
  Field,
  Label,
  Description,
} from '@headlessui/react'
import clsx from 'clsx'

export function Input({
  label,
  description,
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

      <HeadlessInput
        {...props}
        className={clsx(
          'mt-3 block w-full rounded-lg border-none backdrop-blur-xl bg-white/5 px-3 py-1.5',
          'text-sm/6 text-white',
          'focus:not-data-focus:outline-none',
          'data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
          className
        )}
      />
    </Field>
  )
}
