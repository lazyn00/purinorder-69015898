import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, orderTotal } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing payment proof:', imageUrl);
    console.log('Order total to verify:', orderTotal);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a Vietnamese bank transfer receipt analyzer. Extract key information from payment proof images (bill chuyển khoản).
            
Always respond in this exact JSON format:
{
  "amount": number or null (transfer amount in VND, without any formatting),
  "date": string or null (transfer date in format "DD/MM/YYYY" or "DD/MM/YYYY HH:mm"),
  "bank": string or null (bank name, e.g. "Vietcombank", "MB Bank", "Techcombank"),
  "transactionId": string or null (mã giao dịch/reference number),
  "senderName": string or null (tên người chuyển),
  "receiverName": string or null (tên người nhận),
  "content": string or null (nội dung chuyển khoản),
  "confidence": "high" | "medium" | "low" (how confident you are in the extraction)
}

If you cannot identify a field, set it to null.
Parse Vietnamese number formats (e.g., "1.500.000" means 1500000).
Common Vietnamese banks: Vietcombank, BIDV, Agribank, Techcombank, MB Bank, VPBank, TPBank, ACB, Sacombank, VIB, etc.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this Vietnamese bank transfer receipt and extract the payment information. Return ONLY the JSON object, no additional text.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data));
    
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          rawResponse: aiContent 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount if orderTotal is provided
    let verificationResult = null;
    if (orderTotal && extractedData.amount) {
      const extractedAmount = Number(extractedData.amount);
      const expectedAmount = Number(orderTotal);
      
      verificationResult = {
        extractedAmount,
        expectedAmount,
        isMatch: extractedAmount === expectedAmount,
        difference: extractedAmount - expectedAmount,
        percentDifference: ((extractedAmount - expectedAmount) / expectedAmount * 100).toFixed(2)
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted: extractedData,
        verification: verificationResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-payment-proof:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
