import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type BetCardComponentProps = {
  name: string;
  description: string;
  contents: { header: string, value: string }[];
  children: React.ReactNode;
}

export function BetCardComponent({ name, description, contents, children }: BetCardComponentProps) {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className=" grid grid-cols-2 place-items-stretch">
          {contents.map((content, index: number) => (
            <div className=" mb-3" key={index}>
              <h3 className=" text-sm text-muted-foreground">{content.header}</h3>
              <p>{content.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">{children}
      </CardFooter>
    </Card>
  )
}
