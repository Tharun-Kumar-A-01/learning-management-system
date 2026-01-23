import { Description as HeadlessDescription } from '@headlessui/react'
import clsx from 'clsx'

export default function Description({ children, className }) {
  return (
    <HeadlessDescription
      className={clsx(
        'text-sm/6 text-white/50',
        className
      )}
    >
      {children}
    </HeadlessDescription>
  )
}
