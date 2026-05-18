"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, DollarSign, Zap } from "lucide-react"

interface PaymentOfferSectionProps {
  form: any
  setForm: (form: any) => void
  errors?: Record<string, string>
}

export function PaymentOfferSection({ form, setForm, errors = {} }: PaymentOfferSectionProps) {
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)

  // Auto-calculate selling price when online discount changes
  useEffect(() => {
    if (form.paymentModeOnline && form.price && form.onlineDiscount) {
      const discount = Number(form.onlineDiscount) || 0
      const price = Number(form.price) || 0
      const calculated = Math.round(price * (1 - discount / 100))
      setCalculatedPrice(calculated)
    } else {
      setCalculatedPrice(null)
    }
  }, [form.price, form.onlineDiscount, form.paymentModeOnline])

  const handlePaymentModeChange = (mode: 'cod' | 'online', checked: boolean) => {
    if (mode === 'cod') {
      setForm({ ...form, paymentModeCOD: checked })
    } else {
      setForm({ ...form, paymentModeOnline: checked })
    }
  }

  const handleOnlineDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(100, Math.max(0, Number(e.target.value) || 0))
    setForm({ ...form, onlineDiscount: value })
  }

  const handleOfferLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, offerLabel: e.target.value })
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-blue-600" />
          Advanced Payment Offers
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Configure payment options and online discounts for this product
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Options */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Payment Options</Label>
          <div className="space-y-2">
            {/* COD Option */}
            <div className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition">
              <input
                type="checkbox"
                id="cod-option"
                checked={form.paymentModeCOD}
                onChange={(e) => handlePaymentModeChange('cod', e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <Label htmlFor="cod-option" className="cursor-pointer font-medium">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Cash on Delivery (COD)
              </Label>
            </div>

            {/* Online Payment Option */}
            <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
              <input
                type="checkbox"
                id="online-option"
                checked={form.paymentModeOnline}
                onChange={(e) => handlePaymentModeChange('online', e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <Label htmlFor="online-option" className="flex-1 cursor-pointer font-medium">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Online Payment
              </Label>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                With Discount
              </Badge>
            </div>
          </div>
        </div>

        {/* Online Payment Discount Section */}
        {form.paymentModeOnline && (
          <div className="space-y-4 p-4 border-2 border-blue-300 rounded-lg bg-white">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Online Payment Discount</h3>
            </div>

            {/* Online Discount Percentage */}
            <div className="space-y-2">
              <Label htmlFor="online-discount" className="font-medium">
                Discount Percentage (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="online-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={form.onlineDiscount}
                  onChange={handleOnlineDiscountChange}
                  placeholder="Enter discount %"
                  className="flex-1 text-lg font-semibold"
                />
                <span className="text-2xl font-bold text-blue-600">%</span>
              </div>
              <p className="text-xs text-gray-500">
                Enter a value between 0-100
              </p>
            </div>

            {/* Original Price Display */}
            <div className="space-y-2">
              <Label className="font-medium">Original Price</Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-800">
                  ₹{Number(form.price) || 0}
                </p>
              </div>
            </div>

            {/* Calculated Selling Price */}
            {calculatedPrice !== null && (
              <div className="space-y-2">
                <Label className="font-medium">Selling Price (After Discount)</Label>
                <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-2xl font-bold text-green-700">
                    ₹{calculatedPrice}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    You save ₹{Number(form.price) - calculatedPrice}
                  </p>
                </div>
              </div>
            )}

            {/* Offer Label */}
            <div className="space-y-2">
              <Label htmlFor="offer-label" className="font-medium">
                Offer Label (Optional)
              </Label>
              <Input
                id="offer-label"
                type="text"
                value={form.offerLabel}
                onChange={handleOfferLabelChange}
                placeholder="e.g., 15% Instant Discount on UPI"
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                This label will be displayed on the product card
              </p>
            </div>

            {/* Preview */}
            {form.offerLabel && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Preview:</p>
                <Badge className="bg-blue-600 text-white">
                  {form.offerLabel}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">💡 Pro Tip:</p>
            <p>
              Enable both COD and Online Payment to give customers flexibility. Online discounts encourage digital payments!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
