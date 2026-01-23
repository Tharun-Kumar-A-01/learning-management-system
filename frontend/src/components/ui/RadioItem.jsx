import { Radio as HeadlessRadio } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

export function RadioItem({
  value,
  children,
  className,
}) {
  return (
    <HeadlessRadio
      value={value}
      className={clsx(
        'group relative flex cursor-pointer rounded-lg px-5 py-4 text-white shadow-md transition',
        'bg-white/5 data-checked:bg-white/10',
        'focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-sm/6">
          {children}
        </div>

        <CheckCircleIcon
          className="size-6 fill-white opacity-0 transition group-data-checked:opacity-100"
        />
      </div>
    </HeadlessRadio>
  )
}
