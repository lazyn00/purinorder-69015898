import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order } = await req.json()
    
    if (!order) {
      throw new Error('Order data is required')
    }

    const GOOGLE_SHEETS_WEBHOOK = Deno.env.get('GOOGLE_SHEETS_WEBHOOK')
    
    if (!GOOGLE_SHEETS_WEBHOOK) {
      console.error('Google Sheets webhook URL not configured')
      return new Response(
        JSON.stringify({ error: 'Google Sheets webhook not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prepare order data for Google Sheets
    const sheetData = {
      orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
      createdAt: new Date(order.created_at).toLocaleString('vi-VN'),
      customerFb: order.customer_fb || '',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      deliveryName: order.delivery_name || '',
      deliveryPhone: order.delivery_phone || '',
      deliveryAddress: order.delivery_address || '',
      items: JSON.stringify(order.items),
      totalPrice: order.total_price,
      paymentMethod: order.payment_method || '',
      paymentType: order.payment_type || 'full',
      status: order.status || 'chưa thanh toán',
      paymentProofUrl: order.payment_proof_url || '',
      secondPaymentProofUrl: order.second_payment_proof_url || ''
    }

      const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Google Sheets API error: ${response.statusText} - ${errorText}`)
      }

    return new Response(
      JSON.stringify({ success: true, message: 'Order synced to Google Sheets' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})