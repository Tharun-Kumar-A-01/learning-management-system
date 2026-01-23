import {
  TabGroup as HeadlessTabGroup,
  TabList as HeadlessTabList,
  Tab as HeadlessTab,
  TabPanels as HeadlessTabPanels,
  TabPanel as HeadlessTabPanel,
} from '@headlessui/react'
import clsx from 'clsx'

/* ---------------- Root ---------------- */

export function Tabs({ children, className }) {
  return (
    <HeadlessTabGroup className={className}>
      {children}
    </HeadlessTabGroup>
  )
}

/* ---------------- List ---------------- */

export function TabsList({ children, className }) {
  return (
    <HeadlessTabList
      className={clsx('flex gap-4', className)}
    >
      {children}
    </HeadlessTabList>
  )
}

/* ---------------- Trigger ---------------- */

export function TabsTrigger({ children, className }) {
  return (
    <HeadlessTab
      className={clsx(
        'rounded-full px-3 py-1 text-sm/6 font-semibold text-white',
        'focus:not-data-focus:outline-none backdrop-blur-xl',
        'data-focus:outline data-focus:outline-white',
        'data-hover:bg-white/5',
        'data-selected:bg-white/10 data-selected:data-hover:bg-white/10',
        className
      )}
    >
      {children}
    </HeadlessTab>
  )
}

/* ---------------- Panels ---------------- */

export function TabsPanels({ children, className }) {
  return (
    <HeadlessTabPanels
      className={clsx('mt-3', className)}
    >
      {children}
    </HeadlessTabPanels>
  )
}

/* ---------------- Panel ---------------- */

export function TabsPanel({ children, className }) {
  return (
    <HeadlessTabPanel
      className={clsx(
        'rounded-xl bg-white/5 backdrop-blur-xl p-3',
        className
      )}
    >
      {children}
    </HeadlessTabPanel>
  )
}
