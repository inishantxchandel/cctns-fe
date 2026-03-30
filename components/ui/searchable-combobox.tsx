"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { DropdownOption } from "@/types/reference"

type SearchableComboboxProps = {
  options: DropdownOption[]
  value: string | null
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  emptyMessage?: string
  "aria-label"?: string
}

/**
 * Searchable single-select: stores `value` (id) but always shows the matching `label`.
 */
export function SearchableCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  emptyMessage = "No results.",
  "aria-label": ariaLabel,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [panelWidth, setPanelWidth] = React.useState<number>()
  const [commandKey, setCommandKey] = React.useState(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? null
  const triggerDisabled = Boolean(disabled) || options.length === 0

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setCommandKey((k) => k + 1)
      if (triggerRef.current) {
        setPanelWidth(triggerRef.current.offsetWidth)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        disabled={triggerDisabled}
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-sm shadow-none outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          !display && "text-muted-foreground"
        )}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="line-clamp-1">{display ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="max-w-[calc(100vw-2rem)] p-0"
        style={panelWidth ? { width: panelWidth } : undefined}
        align="start"
        sideOffset={4}
      >
        <Command key={commandKey}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  keywords={[o.label, o.value]}
                  data-checked={value === o.value ? true : undefined}
                  onSelect={() => {
                    onValueChange(o.value)
                    setOpen(false)
                  }}
                >
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
