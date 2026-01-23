import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Disclosure({
  children,
  defaultOpen = false,
  className,
}) {
  return (
    <HeadlessDisclosure
      as="div"                 // 🔥 THIS FIXES THE ERROR
      defaultOpen={defaultOpen}
      className={clsx('p-6', className)}
    >
      {children}
    </HeadlessDisclosure>
  )
}

/* ---------------- Trigger ---------------- */

export function DisclosureTrigger({ children, className }) {
  return (
    <HeadlessDisclosureButton
      className={clsx(
        'group flex w-full items-center justify-between',
        className
      )}
    >
      <span className="text-sm/6 font-medium text-white group-data-hover:text-white/80">
        {children}
      </span>

      <ChevronDownIcon
        className={clsx(
          'size-5 fill-white/60 transition-transform',
          'group-data-hover:fill-white/50',
          'group-data-open:rotate-180'
        )}
      />
    </HeadlessDisclosureButton>
  )
}

/* ---------------- Content ---------------- */

export function DisclosureContent({ children, className }) {
  return (
    <HeadlessDisclosurePanel
      className={clsx(
        'mt-2 text-sm/5 text-white/50',
        className
      )}
    >
      {children}
    </HeadlessDisclosurePanel>
  )
}
