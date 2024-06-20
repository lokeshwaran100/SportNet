import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SelectDropDownProps = {
  placeholder: string;
  items: any[];
  onChange: (item: any) => void;
}

export function SelectDropDown({placeholder, items, onChange}: SelectDropDownProps) {
  return (
    <Select onValueChange={(value)=>onChange(value)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item:any, index:number)=>{
            return (
              <div key={index}>
                <SelectItem value={item} key={index} onChange={()=>console.log("onClick is triggered",item)}>{item}</SelectItem>
              </div>
            )
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
