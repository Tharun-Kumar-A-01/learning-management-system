import { Field as HeadlessField } from '@headlessui/react'

export default function Field({ children, className }) {
  return (
    <HeadlessField className={className}>
      {children}
    </HeadlessField>
  )
}
