"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ selected, onChange, placeholder, className, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault()
        if (!selected.includes(inputValue.trim())) {
          onChange([...selected, inputValue.trim()])
          setInputValue("")
        }
      }
    }

    const removeItem = (item: string) => {
      onChange(selected.filter(i => i !== item))
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-2 items-center border rounded-md p-2 min-h-[40px] focus-within:ring-1 focus-within:ring-ring",
          className
        )}
        {...props}
      >
        {selected.map((item) => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="ml-1 rounded-full hover:bg-secondary"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder || "输入并按回车添加标签..."}
          className="flex-1 border-0 focus-visible:ring-0 p-0 h-6"
        />
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }