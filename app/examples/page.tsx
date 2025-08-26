"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ExamplesPage() {
  const [name, setName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-bold">ShadCN Components Examples</h1>
      
      {/* Card Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Card Component</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome Message</CardTitle>
            <CardDescription>A simple card with input and button</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {name ? `Hello, ${name}!` : "Please enter your name above"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setDialogOpen(true)}>
              Open Dialog
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Dialog Example */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome</DialogTitle>
            <DialogDescription>
              {name 
                ? `Thank you for entering your name, ${name}!` 
                : "You haven't entered your name yet."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Examples Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Input Examples</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <Input placeholder="Default input" />
          <Input placeholder="Disabled input" disabled />
          <div className="flex gap-2">
            <Input placeholder="With button" />
            <Button>Submit</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
