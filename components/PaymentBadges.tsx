"use client"

import { Badge } from "@/components/ui/badge"

interface PaymentBadgesProps {
  paymentOptions?: {
    cod?: boolean
    onlinePayment?: boolean
  }
  onlineDiscount?: number
  offerLabel?: string
  compact?: boolean
}

export function PaymentBadges({
  paymentOptions,
  onlineDiscount = 0,
  offerLabel,
  compact = false,
}: PaymentBadgesProps) {
  // Determine payment options
  const hasCOD = paymentOptions?.cod !== false // Default to true
  const hasOnline = paymentOptions?.onlinePayment === true

  if (!hasCOD && !hasOnline) {
    return <Badge variant="outline" className="bg-gray-100">No Payment</Badge>
  }

  const containerClass = compact ? "flex gap-1" : "flex flex-wrap gap-2"

  return (
    <div className={containerClass}>
      {/* COD Badge */}
      {hasCOD && (
        <Badge className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-200">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          COD
        </Badge>
      )}

      {/* Online Payment Badge */}
      {hasOnline && (
        <Badge className="bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
          Online
          {onlineDiscount > 0 && ` (${onlineDiscount}%)`}
        </Badge>
      )}

      {/* Both Badge */}
      {hasCOD && hasOnline && (
        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-300 hover:from-purple-200 hover:to-pink-200">
          <span className="inline-block w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-1.5"></span>
          Both
        </Badge>
      )}

      {/* Offer Label Badge */}
      {offerLabel && (
        <Badge className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200">
          ⚡ {offerLabel}
        </Badge>
      )}
    </div>
  )
}
