import { useState } from 'react'

// UI components
import { Button } from './components/ui/Button'
import { Input } from './components/ui/TextInput'
import { Textarea } from './components/ui/TextareaInput'
import { Select } from './components/ui/SelectInput'
import { Switch } from './components/ui/Switch'
import { Checkbox } from './components/ui/Checkbox'
import { Listbox, ListboxTrigger, ListboxItem, ListboxContent } from './components/ui/ListBox'
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxTrigger } from './components/ui/ComboBox'
import { RadioGroup } from './components/ui/RadioGroup'
import { RadioItem } from './components/ui/RadioItem'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsPanels,
  TabsPanel,
} from './components/ui/Tabs'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './components/ui/PopOver'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from './components/ui/Dialog'
import {
  Disclosure,
  DisclosureTrigger,
  DisclosureContent,
} from './components/ui/Disclosure'
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from './components/ui/Menu'

// Icons
import {
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'

// -------- Data --------
const people = [
  { id: 1, name: 'Tom Cook' },
  { id: 2, name: 'Wade Cooper' },
  { id: 3, name: 'Arlene Mccoy' },
]

const plans = [
  { name: 'Startup', desc: '12GB RAM · 6 CPUs' },
  { name: 'Business', desc: '16GB RAM · 8 CPUs' },
]

export default function App() {
  // form
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // selection
  const [person, setPerson] = useState(people[0])
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState(plans[0])

  // dialog
  const [open, setOpen] = useState(false)

  const filteredPeople =
    query === ''
      ? people
      : people.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        )

  return (
    <div className="min-h-screen space-y-16 bg-black p-8 text-white">
      <h1 className="text-3xl font-semibold">UI Kit Showcase</h1>

      {/* ================= Forms ================= */}
      <section className="space-y-6 max-w-md">
        <h2 className="text-xl font-medium">Form Elements</h2>

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <Select label="Status" defaultValue="active">
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </Select>

        <div className="flex items-center gap-3">
          <Switch checked={enabled} onChange={setEnabled} />
          <span>Enable notifications</span>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox checked={accepted} onChange={setAccepted} />
          <span>Accept terms</span>
        </div>

        <Button>Submit</Button>
      </section>

      {/* ================= Selection ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-medium">Selection</h2>

        <div className="flex gap-8">
          {/* Listbox */}
          <Listbox value={person} onChange={setPerson}>
            <ListboxTrigger>{person.name}</ListboxTrigger>
            <ListboxContent>
              {people.map(p => (
                <ListboxItem key={p.id} value={p}>
                  <span className="text-sm/6 text-white">{p.name}</span>
                </ListboxItem>
              ))}
            </ListboxContent>
          </Listbox>

          {/* Combobox */}
          <Combobox
            value={person}
            onChange={setPerson}
            onClose={() => setQuery('')}
          >
            <div className="relative">
              <ComboboxInput
                displayValue={(i) => i?.name}
                placeholder="Search person"
                onChange={(e) => setQuery(e.target.value)}
              />
              <ComboboxTrigger />
            </div>

            <ComboboxContent>
              {filteredPeople.map(p => (
                <ComboboxItem key={p.id} value={p}>
                  <span className="text-sm/6 text-white">{p.name}</span>
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </div>
      </section>

      {/* ================= Radio ================= */}
      <section className="max-w-md space-y-4">
        <h2 className="text-xl font-medium">Radio Group</h2>

        <RadioGroup value={plan} onChange={setPlan} by="name">
          {plans.map(p => (
            <RadioItem key={p.name} value={p}>
              <p className="font-semibold">{p.name}</p>
              <p className="text-white/50">{p.desc}</p>
            </RadioItem>
          ))}
        </RadioGroup>
      </section>

      {/* ================= Tabs ================= */}
      <section className="max-w-md">
        <h2 className="text-xl font-medium mb-3">Tabs</h2>

        <Tabs>
          <TabsList>
            <TabsTrigger>Profile</TabsTrigger>
            <TabsTrigger>Settings</TabsTrigger>
          </TabsList>

          <TabsPanels>
            <TabsPanel>Profile content</TabsPanel>
            <TabsPanel>Settings content</TabsPanel>
          </TabsPanels>
        </Tabs>
      </section>

      {/* ================= Navigation / Menus ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-medium">Menus & Popovers</h2>

        <div className="flex gap-6">
          <Menu>
            <MenuTrigger>Options</MenuTrigger>
            <MenuContent>
              <MenuItem>Edit</MenuItem>
              <MenuSeparator />
              <MenuItem>Delete</MenuItem>
            </MenuContent>
          </Menu>

          <Popover>
            <PopoverTrigger>More</PopoverTrigger>
            <PopoverContent>
              <div className="p-3">Extra actions here</div>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* ================= Disclosure ================= */}
      <section className="max-w-md rounded-xl bg-white/5 divide-y divide-white/5">
        <h2 className="p-4 text-xl font-medium">Disclosure</h2>

        <Disclosure defaultOpen>
          <DisclosureTrigger>What is this?</DisclosureTrigger>
          <DisclosureContent>
            A headless-based UI component library.
          </DisclosureContent>
        </Disclosure>

        <Disclosure>
          <DisclosureTrigger>Is it reusable?</DisclosureTrigger>
          <DisclosureContent>
            Yes. Fully controlled and composable.
          </DisclosureContent>
        </Disclosure>
      </section>

      {/* ================= Dialog ================= */}
      <section>
        <h2 className="text-xl font-medium mb-4">Dialog</h2>

        <DialogTrigger onClick={() => setOpen(true)}>
          Open dialog
        </DialogTrigger>

        <Dialog open={open} onClose={setOpen}>
          <DialogContent>
            <DialogTitle>Success</DialogTitle>
            <p className="mt-2 text-white/50">
              This dialog uses your custom UI kit.
            </p>
            <div className="mt-4">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}
