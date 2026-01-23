import {
  RadioGroup as HeadlessRadioGroup,
} from '@headlessui/react'
import clsx from 'clsx'

export function RadioGroup({
  value,
  onChange,
  children,
  by,
  className,
  ...props
}) {
  return (
    <HeadlessRadioGroup
      value={value}
      onChange={onChange}
      by={by}
      className={clsx('space-y-2', className)}
      {...props}
    >
      {children}
    </HeadlessRadioGroup>
  )
}
