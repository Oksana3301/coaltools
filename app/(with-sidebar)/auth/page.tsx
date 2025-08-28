"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Toaster, toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { login } from "@/lib/auth"

// Form validation schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize form with validation schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    try {
      const result = await login(values.email, values.password)
      
      if (result.success) {
        toast.success("Login successful!")
        // Redirect to original page or default dashboard
        const redirectTo = searchParams?.get('redirect') || '/coal-tools-kaskecil'
        router.push(redirectTo)
      } else {
        toast.error(result.error || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <Toaster position="top-center" />
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="w-full">
            <h4 className="text-sm font-medium mb-3">Demo Accounts:</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Admin User</div>
                  <div className="text-gray-600">admin@example.com</div>
                </div>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Manager User</div>
                  <div className="text-gray-600">manager@example.com</div>
                </div>
                <Badge variant="outline">Approver</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Staff User</div>
                  <div className="text-gray-600">staff@example.com</div>
                </div>
                <Badge variant="outline">User</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">Demo User</div>
                  <div className="text-gray-600">demo@example.com</div>
                </div>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <strong>Password for all accounts:</strong> Admin123!, Manager123!, Staff123!, Demo123!
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
