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

type CardComponentProps = {
  title: string;
  description: string;
  contents: { header: string, value: string }[];
  children: React.ReactNode;
  isDonate: boolean;
  donationValues: { donatedAmount: number, amount: number };
}

export function CardComponent({ title, description, contents, children, isDonate, donationValues }: CardComponentProps) {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
        {isDonate && (
          <>
            <h3 className=" text-sm text-muted-foreground mb-1">Donation Status</h3>
            <Progress className=" w-full" value={(donationValues.donatedAmount / donationValues.amount) * 100} />
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">{children}
      </CardFooter>
    </Card>
  )
}
