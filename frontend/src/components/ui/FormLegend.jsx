import { Legend as HeadlessLegend } from '@headlessui/react'
import clsx from 'clsx'

export default function Legend({ children, className }) {
  return (
    <HeadlessLegend
      className={clsx(
        'text-base/7 font-semibold text-white',
        className
      )}
    >
      {children}
    </HeadlessLegend>
  )
}
