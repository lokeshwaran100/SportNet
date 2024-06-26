import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectDropDown } from "./SelectDropDown"
import { Textarea } from "../ui/textarea"

type DialogModalProps={
    children: React.ReactNode;
    title: string;
    description: string;
    inputs: any[];
    onSubmit: ()=>void;
    action: string;
}

export function DialogModal({children,title,description,inputs,onSubmit,action}: DialogModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {inputs.map((input: any, index: number)=>{
                return <div className="grid grid-cols-4 items-center gap-4" key={index}>
                {input.type==="selection"?(<>
                    <Label htmlFor={input.name} className="text-right">
                      {input.label}
                    </Label>
                    <SelectDropDown
                    placeholder={input.placeholder}
                    items={input.items}
                    onChange={(value:string)=>input.onChange(value)}/>
                </>):(<>{input.type==="textarea"?<><Label htmlFor={input.name} className="text-right">
                      {input.label}
                    </Label>
                    <Textarea id={input.name} value={input.value} onChange={(e)=>input.onChange(e.target.value)} placeholder={input.placeholder} className="col-span-3" /></>:<><Label htmlFor={input.name} className="text-right">
                      {input.label}
                    </Label>
                    <Input type={input.type} id={input.name} value={input.value} onChange={(e)=>input.onChange(e.target.value)} placeholder={input.placeholder} className="col-span-3" />
                        </>}
                      </>
                  )}
                </div>
            })}
        </div>
        <DialogFooter>
          <Button type="submit" variant={"outline"} onClick={onSubmit}>{action}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
