import { Label as HeadlessLabel } from '@headlessui/react'
import clsx from 'clsx'

export default function Label({ children, className }) {
  return (
    <HeadlessLabel
      className={clsx(
        'text-sm/6 font-medium text-white',
        className
      )}
    >
      {children}
    </HeadlessLabel>
  )
}
