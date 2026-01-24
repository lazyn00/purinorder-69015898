import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { imageUrls, productId, productName } = await req.json()

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Image URLs are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Syncing ${imageUrls.length} images for product ${productId}: ${productName}`)

    const uploadedUrls: string[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]
      
      // Skip if already a Supabase URL
      if (imageUrl.includes('supabase.co/storage')) {
        console.log(`Image ${i + 1} already in Supabase storage, skipping`)
        uploadedUrls.push(imageUrl)
        continue
      }

      try {
        // Fetch image from external URL
        console.log(`Fetching image ${i + 1}: ${imageUrl}`)
        const response = await fetch(imageUrl)
        
        if (!response.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${response.status}`)
          uploadedUrls.push(imageUrl) // Keep original URL if fetch fails
          continue
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Determine file extension from content type
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        let extension = 'jpg'
        if (contentType.includes('png')) extension = 'png'
        else if (contentType.includes('gif')) extension = 'gif'
        else if (contentType.includes('webp')) extension = 'webp'

        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `product-${productId}/${timestamp}-${i}.${extension}`

        console.log(`Uploading to storage: ${fileName}`)

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, uint8Array, {
            contentType: contentType,
            upsert: true
          })

        if (uploadError) {
          console.error(`Upload error for image ${i + 1}:`, uploadError)
          uploadedUrls.push(imageUrl) // Keep original URL if upload fails
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        console.log(`Uploaded image ${i + 1}: ${urlData.publicUrl}`)
        uploadedUrls.push(urlData.publicUrl)

      } catch (imageError) {
        console.error(`Error processing image ${i + 1}:`, imageError)
        uploadedUrls.push(imageUrl) // Keep original URL on error
      }
    }

    console.log(`Sync complete. ${uploadedUrls.length} images processed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        uploadedUrls,
        originalCount: imageUrls.length,
        syncedCount: uploadedUrls.filter(url => url.includes('supabase.co/storage')).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing images:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
