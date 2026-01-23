import {
  Listbox as HeadlessListbox,
  ListboxButton as HeadlessListboxButton,
  ListboxOptions as HeadlessListboxOptions,
  ListboxOption as HeadlessListboxOption,
} from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Listbox({ value, onChange, children }) {
  return (
    <HeadlessListbox value={value} onChange={onChange}>
      <div className="relative">
        {children}
      </div>
    </HeadlessListbox>
  )
}

/* ---------------- Trigger ---------------- */

export function ListboxTrigger({ children, className }) {
  return (
    <HeadlessListboxButton
      className={clsx(
        'relative block w-full rounded-lg bg-white/5 backdrop-blur-xl',
        'py-1.5 pr-8 pl-3 text-left text-sm/6 text-white',
        'focus:not-data-focus:outline-none',
        'data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
        className
      )}
    >
      {children}
      <ChevronDownIcon
        className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
        aria-hidden="true"
      />
    </HeadlessListboxButton>
  )
}

/* ---------------- Content ---------------- */

export function ListboxContent({ children, className, anchor = 'bottom' }) {
  return (
    <HeadlessListboxOptions
      as="div" // 🔥 REQUIRED (Fragment-safe)
      anchor={anchor}
      transition
      className={clsx(
        'w-(--button-width) rounded-xl border border-white/5',
        'backdrop-blur-xl bg-white/5 p-1',
        '[--anchor-gap:--spacing(1)] focus:outline-none',
        'transition duration-100 ease-in data-leave:data-closed:opacity-0',
        className
      )}
    >
      {children}
    </HeadlessListboxOptions>
  )
}

/* ---------------- Item ---------------- */

export function ListboxItem({ children, value, className }) {
  return (
    <HeadlessListboxOption
      value={value}
      className={clsx(
        'group flex cursor-default items-center gap-2 rounded-lg',
        'px-3 py-1.5 select-none data-focus:bg-white/10',
        className
      )}
    >
      <CheckIcon className="invisible size-4 fill-white group-data-selected:visible" />
      {children}
    </HeadlessListboxOption>
  )
}
