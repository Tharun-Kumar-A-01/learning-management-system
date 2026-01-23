import { Button as HeadlessButton } from '@headlessui/react'
import clsx from 'clsx'

export function Button({
  children,
  className,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <HeadlessButton
      type={type}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm/6 font-semibold',
        'bg-white cursor-pointer text-black shadow-inner shadow-white/10',
        'data-hover:bg-white/95 data-open:bg-white',
        'focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white',
        'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </HeadlessButton>
  )
}
