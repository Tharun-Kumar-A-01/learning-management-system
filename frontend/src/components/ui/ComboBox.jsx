import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxInput as HeadlessComboboxInput,
  ComboboxOption as HeadlessComboboxOption,
  ComboboxOptions as HeadlessComboboxOptions,
} from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useState } from 'react'

/* ---------------- Root ---------------- */

export function Combobox({
  value,
  onChange,
  children,
  onClose,
}) {
  return (
    <HeadlessCombobox value={value} onChange={onChange} onClose={onClose}>
      <div className="relative w-52">
        {children}
      </div>
    </HeadlessCombobox>
  )
}

/* ---------------- Input ---------------- */

export function ComboboxInput({
  displayValue,
  placeholder,
  onChange,
  className,
}) {
  return (
    <HeadlessComboboxInput
      displayValue={displayValue}
      placeholder={placeholder}
      onChange={onChange}
      className={clsx(
        'w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3',
        'text-sm/6 text-white',
        'focus:not-data-focus:outline-none',
        'data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
        className
      )}
    />
  )
}

/* ---------------- Trigger ---------------- */

export function ComboboxTrigger({ className }) {
  return (
    <HeadlessComboboxButton
      className={clsx(
        'group absolute inset-y-0 right-0 px-2.5',
        className
      )}
    >
      <ChevronDownIcon className="size-4 fill-white/60 group-data-hover:fill-white" />
    </HeadlessComboboxButton>
  )
}

/* ---------------- Content ---------------- */

export function ComboboxContent({
  children,
  className,
  anchor = 'bottom',
}) {
  return (
    <HeadlessComboboxOptions
      as="div" // 🔥 REQUIRED (Fragment-safe)
      anchor={anchor}
      transition
      className={clsx(
        'w-(--input-width) rounded-xl border backdrop-blur-xl border-white/5 bg-white/5 p-1',
        '[--anchor-gap:--spacing(1)] empty:invisible',
        'transition duration-100 ease-in data-leave:data-closed:opacity-0',
        className
      )}
    >
      {children}
    </HeadlessComboboxOptions>
  )
}

/* ---------------- Item ---------------- */

export function ComboboxItem({ value, children, className }) {
  return (
    <HeadlessComboboxOption
      value={value}
      className={clsx(
        'group flex cursor-default items-center gap-2 rounded-lg',
        'px-3 py-1.5 select-none data-focus:bg-white/10',
        className
      )}
    >
      <CheckIcon className="invisible size-4 fill-white group-data-selected:visible" />
      {children}
    </HeadlessComboboxOption>
  )
}
