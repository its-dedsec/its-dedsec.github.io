
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Security scan function loaded")

interface SecurityCheck {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  details?: string;
  engines?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, apiKeys } = await req.json()
    console.log('Security scan request for URL:', url)
    console.log('Available API keys:', Object.keys(apiKeys))

    const results: SecurityCheck[] = []

    // VirusTotal Check
    if (apiKeys.VIRUSTOTAL_API_KEY) {
      console.log('Checking with VirusTotal...')
      try {
        const vtResponse = await fetch(`https://www.virustotal.com/vtapi/v2/url/report?apikey=${apiKeys.VIRUSTOTAL_API_KEY}&resource=${encodeURIComponent(url)}`)
        const vtData = await vtResponse.json()
        console.log('VirusTotal response:', vtData)

        if (vtData.response_code === 1) {
          const status = vtData.positives > 0 ? 'failed' : 'passed'
          results.push({
            name: 'VirusTotal Scan',
            status,
            description: `Scanned by ${vtData.total} engines`,
            details: vtData.positives > 0 ? `${vtData.positives} engines detected threats` : 'No threats detected',
            engines: vtData
          })
        } else {
          results.push({
            name: 'VirusTotal Scan',
            status: 'warning',
            description: 'URL not found in VirusTotal database',
            details: 'This URL has not been previously scanned'
          })
        }
      } catch (error) {
        console.error('VirusTotal error:', error)
        results.push({
          name: 'VirusTotal Scan',
          status: 'warning',
          description: 'Failed to check with VirusTotal',
          details: 'Service temporarily unavailable'
        })
      }
    }

    // Google Safe Browsing Check
    if (apiKeys.GOOGLE_SAFE_BROWSING_API_KEY) {
      console.log('Checking with Google Safe Browsing...')
      try {
        const gsbResponse = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKeys.GOOGLE_SAFE_BROWSING_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: "qr-shield",
              clientVersion: "1.0.0"
            },
            threatInfo: {
              threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url }]
            }
          })
        })
        const gsbData = await gsbResponse.json()
        console.log('Google Safe Browsing response:', gsbData)

        const status = gsbData.matches && gsbData.matches.length > 0 ? 'failed' : 'passed'
        results.push({
          name: 'Google Safe Browsing',
          status,
          description: 'Google\'s threat detection service',
          details: status === 'failed' ? `Detected: ${gsbData.matches[0]?.threatType}` : 'No threats detected'
        })
      } catch (error) {
        console.error('Google Safe Browsing error:', error)
        results.push({
          name: 'Google Safe Browsing',
          status: 'warning',
          description: 'Failed to check with Google Safe Browsing',
          details: 'Service temporarily unavailable'
        })
      }
    }

    // URLScan.io Check
    if (apiKeys.URLSCAN_API_KEY) {
      console.log('Checking with URLScan.io...')
      try {
        // Submit URL for scanning
        const scanResponse = await fetch('https://urlscan.io/api/v1/scan/', {
          method: 'POST',
          headers: {
            'API-Key': apiKeys.URLSCAN_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            visibility: 'private'
          })
        })
        const scanData = await scanResponse.json()
        console.log('URLScan.io scan initiated:', scanData)

        results.push({
          name: 'URLScan.io Analysis',
          status: 'passed',
          description: 'Deep URL and website analysis',
          details: `Scan initiated - UUID: ${scanData.uuid?.substring(0, 8)}...`
        })
      } catch (error) {
        console.error('URLScan.io error:', error)
        results.push({
          name: 'URLScan.io Analysis',
          status: 'warning',
          description: 'Failed to initiate URLScan.io analysis',
          details: 'Service temporarily unavailable'
        })
      }
    }

    // IP Info Check
    if (apiKeys.IPINFO_API_KEY) {
      try {
        // Extract domain from URL
        const domain = new URL(url).hostname
        const ipResponse = await fetch(`https://ipinfo.io/${domain}?token=${apiKeys.IPINFO_API_KEY}`)
        const ipData = await ipResponse.json()

        results.push({
          name: 'IP Geolocation Check',
          status: 'passed',
          description: 'IP address and location analysis',
          details: `Location: ${ipData.city || 'Unknown'}, ${ipData.country || 'Unknown'} | ISP: ${ipData.org || 'Unknown'}`
        })
      } catch (error) {
        console.error('IPInfo error:', error)
        results.push({
          name: 'IP Geolocation Check',
          status: 'warning',
          description: 'Failed to get IP information',
          details: 'Service temporarily unavailable'
        })
      }
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      
      results.push({
        name: 'SSL/TLS Security',
        status: isHttps ? 'passed' : 'warning',
        description: 'Secure connection validation',
        details: isHttps ? 'Site uses HTTPS encryption' : 'Site does not use HTTPS - data may be insecure'
      })
    } catch {
      results.push({
        name: 'URL Validation',
        status: 'failed',
        description: 'Invalid URL format',
        details: 'The provided URL is not valid'
      })
    }

    // Determine overall risk
    const failedChecks = results.filter(r => r.status === 'failed').length
    const warningChecks = results.filter(r => r.status === 'warning').length
    
    let overallRisk = 'LOW'
    if (failedChecks > 0) {
      overallRisk = 'HIGH'
    } else if (warningChecks > 1) {
      overallRisk = 'MEDIUM'
    }

    console.log('Security scan completed:', {
      resultsCount: results.length,
      overallRisk
    })

    return new Response(
      JSON.stringify({ results, overallRisk }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Security scan error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
