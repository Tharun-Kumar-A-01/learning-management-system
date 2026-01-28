import {
  Dialog as HeadlessDialog,
  DialogPanel as HeadlessDialogPanel,
  DialogTitle as HeadlessDialogTitle,
  Button as HeadlessButton,
} from '@headlessui/react'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Dialog({ open, onClose, children, className }) {
  return (
    <HeadlessDialog
      open={open}
      onClose={onClose}
      className={clsx('relative z-10 focus:outline-none', className)}
    >
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {children}
        </div>
      </div>
    </HeadlessDialog>
  )
}

/* ---------------- Trigger ---------------- */

export function DialogTrigger({ children, className, ...props }) {
  return (
    <HeadlessButton
      {...props}
      className={clsx(
        'rounded-md bg-black/20 px-4 py-2 text-sm font-medium text-white',
        'focus:not-data-focus:outline-none',
        'data-focus:outline data-focus:outline-white',
        'data-hover:bg-black/30',
        className
      )}
    >
      {children}
    </HeadlessButton>
  )
}

/* ---------------- Content ---------------- */

export function DialogContent({ children, className }) {
  return (
    <HeadlessDialogPanel
      transition
      className={clsx(
        'w-full max-w-md rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-2xl shadow-black p-6',
        'duration-300 ease-out',
        'data-closed:transform-[scale(95%)] data-closed:opacity-0',
        className
      )}
    >
      {children}
    </HeadlessDialogPanel>
  )
}

/* ---------------- Title ---------------- */

export function DialogTitle({ children, className }) {
  return (
    <HeadlessDialogTitle
      as="h3"
      className={clsx(
        'text-base/7 font-medium text-white',
        className
      )}
    >
      {children}
    </HeadlessDialogTitle>
  )
}
