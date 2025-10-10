"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

const messages = [
  {
    id: "1",
    from: "John Doe",
    subject: "New Order #1234",
    preview: "I wanted to check on my recent order status...",
    date: "5m ago",
    unread: true,
  },
  {
    id: "2",
    from: "Support Team",
    subject: "Re: Product Inquiry",
    preview: "Thank you for your interest in our products...",
    date: "2h ago",
    unread: false,
  },
  {
    id: "3",
    from: "System Notification",
    subject: "Security Alert",
    preview: "We noticed a new login to your account...",
    date: "1d ago",
    unread: true,
  },
  {
    id: "4",
    from: "Marketing",
    subject: "February Newsletter",
    preview: "Check out our latest product updates and news...",
    date: "2d ago",
    unread: false,
  },
]

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">
          Manage your communications
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search messages..."
          className="max-w-sm"
        />
        <Button size="icon" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  message.unread ? "bg-muted/50" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium ${
                      message.unread ? "font-semibold" : ""
                    }`}>
                      {message.from}
                    </h4>
                    {message.unread && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium">{message.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {message.preview}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {message.date}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
