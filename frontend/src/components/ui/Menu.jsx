import {
  Menu as HeadlessMenu,
  MenuButton as HeadlessMenuButton,
  MenuItems as HeadlessMenuItems,
  MenuItem as HeadlessMenuItem,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Menu({ children, className }) {
  return (
    <HeadlessMenu className={className}>
      {children}
    </HeadlessMenu>
  )
}

/* ---------------- Trigger ---------------- */

export function MenuTrigger({ children, className }) {
  return (
    <HeadlessMenuButton
      className={clsx(
        'inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5',
        'text-sm/6 font-semibold text-white',
        'shadow-inner backdrop-blur-xl shadow-white/10',
        'focus:not-data-focus:outline-none',
        'data-focus:outline data-focus:outline-white',
        'data-hover:bg-white/20 data-open:bg-white/15',
        className
      )}
    >
      {children}
      <ChevronDownIcon className="size-4 fill-white/60" />
    </HeadlessMenuButton>
  )
}

/* ---------------- Content ---------------- */

export function MenuContent({
  children,
  className,
  anchor = 'bottom end',
}) {
  return (
    <HeadlessMenuItems
      anchor={anchor}
      transition
      className={clsx(
        'w-52 origin-top-right rounded-xl border border-white/5',
        'bg-white/5 p-1 text-sm/6 text-white ',
        'transition duration-100 ease-out',
        '[--anchor-gap:--spacing(1)] focus:outline-none',
        'data-closed:scale-95 data-closed:opacity-0',
        className
      )}
    >
      {children}
    </HeadlessMenuItems>
  )
}

/* ---------------- Item ---------------- */

export function MenuItem({ children, className, ...props }) {
  return (
    <HeadlessMenuItem {...props}>
      <button
        className={clsx(
          'group flex w-full items-center gap-2 rounded-lg px-3 py-1.5',
          'data-focus:bg-white/10 backdrop-blur-xl',
          className
        )}
      >
        {children}
      </button>
    </HeadlessMenuItem>
  )
}

/* ---------------- Separator ---------------- */

export function MenuSeparator({ className }) {
  return (
    <div
      className={clsx(
        'my-1 h-px bg-white/5',
        className
      )}
    />
  )
}

/* ---------------- Shortcut ---------------- */

export function MenuShortcut({ children }) {
  return (
    <kbd className="ml-auto backdrop-blur-xl hidden font-sans text-xs text-white/50 group-data-focus:inline">
      {children}
    </kbd>
  )
}
