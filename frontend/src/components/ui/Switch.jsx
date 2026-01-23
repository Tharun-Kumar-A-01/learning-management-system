import { Switch as HeadlessSwitch } from '@headlessui/react'
import clsx from 'clsx'

export function Switch({
  checked,
  onChange,
  disabled = false,
  className,
}) {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={clsx(
        'group relative flex h-7 w-14 cursor-pointer rounded-full p-1 transition ease-in-out',
        'bg-white/10 data-checked:bg-white/10',
        'focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white',
        'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0',
          'translate-x-0 transition duration-200 ease-in-out',
          'group-data-checked:translate-x-7'
        )}
      />
    </HeadlessSwitch>
  )
}
