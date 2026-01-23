import {
  Popover as HeadlessPopover,
  PopoverButton as HeadlessPopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
} from '@headlessui/react'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Popover({ children, className }) {
  return (
    <HeadlessPopover className={className}>
      {children}
    </HeadlessPopover>
  )
}

/* ---------------- Trigger ---------------- */

export function PopoverTrigger({ children, className }) {
  return (
    <HeadlessPopoverButton
      className={clsx(
        'block text-sm/6 font-semibold text-white/50',
        'focus:outline-none',
        'data-active:text-white',
        'data-focus:outline data-focus:outline-white',
        'data-hover:text-white',
        className
      )}
    >
      {children}
    </HeadlessPopoverButton>
  )
}

/* ---------------- Content ---------------- */

export function PopoverContent({
  children,
  className,
  anchor = 'bottom',
}) {
  return (
    <HeadlessPopoverPanel
      anchor={anchor}
      transition
      className={clsx(
        'divide-y divide-white/5 rounded-xl bg-white/5 text-sm/6',
        'transition duration-200 ease-in-out',
        '[--anchor-gap:--spacing(5)]',
        'data-closed:-translate-y-1 data-closed:opacity-0',
        className
      )}
    >
      {children}
    </HeadlessPopoverPanel>
  )
}
