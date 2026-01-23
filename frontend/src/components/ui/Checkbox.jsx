import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className,
}) {
  return (
    <HeadlessCheckbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={clsx(
        'group size-6 rounded-md bg-white/10 p-1 ring-1 ring-white/15 ring-inset',
        'focus:not-data-focus:outline-none cursor-pointer',
        'data-focus:outline data-focus:outline-offset-2 data-focus:outline-white',
        'data-checked:bg-white',
        'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
        className
      )}
    >
      <CheckIcon className="hidden size-4 fill-black group-data-checked:block" />
    </HeadlessCheckbox>
  )
}
