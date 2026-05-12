"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="page-enter space-y-8 max-w-4xl">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Settings</h1>
          <p className="text-base text-muted-foreground">
            Manage your account and store preferences
          </p>
        </div>

        {/* Profile Settings */}
        <div className="card-premium p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Profile</h2>
            <p className="text-sm text-muted-foreground">Update your personal information</p>
          </div>

          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-border">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-2xl font-bold">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-1">Profile Picture</p>
              <p className="text-sm text-muted-foreground mb-3">JPG, PNG or GIF. Max 5MB</p>
              <Button className="btn-premium bg-primary text-primary-foreground hover:bg-primary/90">
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
              <input 
                id="firstName" 
                type="text"
                defaultValue="John" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input 
                id="lastName" 
                type="text"
                defaultValue="Doe" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                id="email" 
                type="email" 
                defaultValue="john@example.com" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input 
                id="phone" 
                type="tel" 
                defaultValue="+1 (555) 123-4567" 
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="btn-gradient">Save Changes</Button>
          </div>
        </div>

        {/* Store Settings */}
        <div className="card-premium p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Store Settings</h2>
            <p className="text-sm text-muted-foreground">Configure your store preferences</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="storeName" className="form-label">Store Name</label>
              <input 
                id="storeName" 
                type="text"
                defaultValue="ShopAdmin Store" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="currency" className="form-label">Currency</label>
              <select defaultValue="usd" className="form-select">
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
                <option value="jpy">JPY (¥)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="timezone" className="form-label">Timezone</label>
              <select defaultValue="america-new-york" className="form-select">
                <option value="america-new-york">America/New York</option>
                <option value="america-los-angeles">America/Los Angeles</option>
                <option value="europe-london">Europe/London</option>
                <option value="asia-tokyo">Asia/Tokyo</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="language" className="form-label">Language</label>
              <select defaultValue="en" className="form-select">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="btn-gradient">Save Changes</Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card-premium p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Notifications</h2>
            <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
          </div>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">Receive order updates via email</p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">Receive push notifications for new orders</p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>

            {/* Low Stock Alerts */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Low Stock Alerts</p>
                <p className="text-xs text-muted-foreground mt-1">Get notified when products are running low</p>
              </div>
              <Switch defaultChecked className="ml-4" />
            </div>

            {/* Marketing Emails */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Marketing Emails</p>
                <p className="text-xs text-muted-foreground mt-1">Receive tips and product updates</p>
              </div>
              <Switch className="ml-4" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card-premium p-8 space-y-6 border-2 border-destructive/30 bg-destructive/5">
          <div>
            <h2 className="text-xl font-bold text-destructive mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Delete Store</p>
              <p className="text-xs text-destructive/70 mt-1">
                Permanently delete your store and all data. This action cannot be undone.
              </p>
            </div>
            <Button 
              className="ml-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-premium"
              size="sm"
            >
              Delete Store
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
