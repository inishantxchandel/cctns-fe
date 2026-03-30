export type DropdownOption = {
  value: string
  label: string
}

export type ReferenceDropdowns = {
  issueTypes: DropdownOption[]
  districts: DropdownOption[]
  policeStations: DropdownOption[]
  statuses: DropdownOption[]
  teams: DropdownOption[]
}
