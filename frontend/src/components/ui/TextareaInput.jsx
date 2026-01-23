import { Textarea as HeadlessTextarea } from '@headlessui/react'
import clsx from 'clsx'

export function Textarea({ className, rows = 3, ...props }) {
  return (
    <HeadlessTextarea
      rows={rows}
      {...props}
      className={clsx(
        'mt-3 block w-full resize-none rounded-lg border-none backdrop-blur-xl bg-white/5 px-3 py-1.5',
        'text-sm/6 text-white',
        'focus:not-data-focus:outline-none',
        'data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
        className
      )}
    />
  )
}
