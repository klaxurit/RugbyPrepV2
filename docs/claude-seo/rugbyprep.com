/seo-page:

⏺ Single-Page SEO Analysis: rugbyprep.com

  Page Score Card                                                                      
   
  Overall Score: 38/100                                                                
                                                                                     
  On-Page SEO:     30/100  ███░░░░░░░                                                  
  Content Quality: 42/100  ████░░░░░░
  Technical:       62/100  ██████░░░░                                                  
  Schema:           0/100  ░░░░░░░░░░
  Images:          65/100  ██████░░░░                                                  
  E-E-A-T:         47/100  ████░░░░░░                                                  
                                                                                       
  Stack: Next.js (App Router + Turbopack) on Vercel | Languages: en, fr, es, de, it, ru
                  
  ---                                                                                  
  Critical Issues (Fix Immediately)
                                                                                       
  1. Empty <main> in SSR — All content is client-rendered
                                                                                       
  The <main> element renders as <!--$--><!--/$--> — no H1, no headings, no text. Search
   engines that don't execute JS see an empty page with only header/footer and a
  loading spinner. This is the #1 blocker for indexing.                                
                  
  Fix: Ensure Next.js server-renders homepage content. Check if the page component is  
  accidentally a client component ("use client") or if data fetching is client-only.
                                                                                       
  2. OG Image returns 404

  https://rugbyprep.com/og-image.png → 404. All social shares lack a preview image.    
   
  Fix: Upload the image to /public/og-image.png.                                       
                  
  3. No H1 tag (consequence of #1)                                                     
                  
  Zero heading tags in SSR HTML. Search engines see no content hierarchy.              
                  
  4. Navigation uses <button> instead of <a> links                                     
                  
  The 4 main nav items ("L'app", "Temoignages", "Tarifs", "FAQ") are <button> elements 
  — invisible to crawlers.
                                                                                       
  Fix: Convert to <a href="#section-id"> or Next.js <Link> components.

  ---                                                                                  
  High Priority Issues
                                                                                       
  5. No structured data (JSON-LD)

  Zero schema markup of any kind. Missing: Organization, WebSite, SoftwareApplication. 
   
  6. www vs non-www not redirecting                                                    
                  
  Both www.rugbyprep.com and rugbyprep.com serve content. Canonical points to non-www  
  but no 301 redirect exists.
                                                                                       
  Fix: Add redirect in vercel.json or next.config.js.                                  
  
  7. No coach/trainer identification (E-E-A-T gap)                                     
                  
  For a YMYL-adjacent topic (physical training), there's zero identification of who    
  designed the programs. No name, qualifications, photo, or "About" section.
                                                                                       
  8. Language mismatch                                                                 
  
  Page declares lang="en" but renders French content ("Temoignages", "Tarifs",         
  "Satisfait ou remboursé"). Meta tags are in English, body is in French.
                                                                                       
  ---             
  Medium Priority Issues

  ┌─────┬───────────────────────────────────┬──────────────────────────────────────┐
  │  #  │               Issue               │               Details                │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤   
  │ 9   │ Meta description too long         │ 199 chars (target: 150-160)          │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤   
  │ 10  │ Missing x-default hreflang        │ Root URL not declared as x-default   │   
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤   
  │ 11  │ Missing Content-Security-Policy   │ XSS protection gap                   │   
  │     │ header                            │                                      │   
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 12  │ Header logo uses loading="lazy"   │ Above-fold images should be eager    │   
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 13  │ No contact information            │ No email, phone, or address for a    │   
  │     │                                   │ paid product                         │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤   
  │ 14  │ Content freshness: zero signals   │ No dates, no blog, no changelog      │   
  └─────┴───────────────────────────────────┴──────────────────────────────────────┘   
                                                                                       
  ---                                                                                  
  Low Priority Issues

  ┌─────┬─────────────────────────────────────────────────────────────────────────┐
  │  #  │                                  Issue                                  │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 15  │ Duplicate viewport meta tags                                            │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 16  │ Footer links lack locale prefix (/privacy-policy vs /en/privacy-policy) │    
  ├─────┼─────────────────────────────────────────────────────────────────────────┤    
  │ 17  │ No IndexNow implementation                                              │    
  ├─────┼─────────────────────────────────────────────────────────────────────────┤    
  │ 18  │ No Permissions-Policy header                                            │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤    
  │ 19  │ Keywords meta tag present (Google ignores it)                           │
  └─────┴─────────────────────────────────────────────────────────────────────────┘    
                  
  ---                                                                                  
  Content Quality Summary

  ┌─────────────────────────────────┬─────────────────────────────────┐
  │             Metric              │              Value              │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Word count                      │ ~580 (barely meets 500 minimum) │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Primary keyword "rugby" density │ 0.7% (low)                      │                
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ AI Citation Readiness           │ 22/100                          │                
  ├─────────────────────────────────┼─────────────────────────────────┤                
  │ Testimonials                    │ 3 anonymous, no photos/names    │
  ├─────────────────────────────────┼─────────────────────────────────┤                
  │ Educational content             │ None — purely transactional     │
  └─────────────────────────────────┴─────────────────────────────────┘                
  
  ---                                                                                  
  Schema Recommendations (Ready-to-Use JSON-LD)
                                                                                       
  Add this combined @graph block to your layout:
                                                                                       
  {               
    "@context": "https://schema.org",                                                  
    "@graph": [   
      {
        "@type": "WebSite",
        "name": "Rugby Prep",
        "url": "https://rugbyprep.com",                                                
        "description": "Professional rugby training programs designed by expert 
  coaches.",                                                                           
        "inLanguage": ["en", "fr", "es", "de", "it", "ru"],
        "publisher": { "@id": "https://rugbyprep.com/#organization" }                  
      },
      {                                                                                
        "@type": "Organization",
        "@id": "https://rugbyprep.com/#organization",                                  
        "name": "Rugby Prep",
        "url": "https://rugbyprep.com",                                                
        "logo": { 
          "@type": "ImageObject",                                                      
          "url": "https://rugbyprep.com/logo.png",
          "width": 112,                                                                
          "height": 112
        },
        "sameAs": ["https://twitter.com/rugbyprep"],                                   
        "contactPoint": {
          "@type": "ContactPoint",                                                     
          "contactType": "customer support",
          "url": "https://rugbyprep.com",                                              
          "availableLanguage": ["English", "French", "Spanish", "German", "Italian",
  "Russian"]                                                                           
        }         
      },
      {
        "@type": "SoftwareApplication",                                                
        "name": "Rugby Prep",
        "applicationCategory": "SportsApplication",                                    
        "operatingSystem": "Web",
        "description": "Professional rugby training programs designed by expert 
  coaches.",                                                                           
        "url": "https://rugbyprep.com",
        "offers": {                                                                    
          "@type": "AggregateOffer",
          "priceCurrency": "EUR",
          "lowPrice": "0",                                                             
          "highPrice": "49.99",
          "offerCount": "3",                                                           
          "url": "https://rugbyprep.com/#tarifs"
        },                                                                             
        "publisher": { "@id": "https://rugbyprep.com/#organization" },
        "featureList": [                                                               
          "Personalized rugby workout programs",
          "Video exercise demonstrations",                                             
          "Progress tracking and session monitoring",
          "Expert coaching guidance"                                                   
        ]         
      },
      {
        "@type": "WebPage",
        "name": "Rugby Prep - Professional Rugby Training Programs",                   
        "url": "https://rugbyprep.com",
        "inLanguage": "en",                                                            
        "isPartOf": { "@type": "WebSite", "url": "https://rugbyprep.com" }
      },                                                                               
      {
        "@type": "BreadcrumbList",                                                     
        "itemListElement": [                                                           
          { "@type": "ListItem", "position": 1, "name": "Home", "item":
  "https://rugbyprep.com" }                                                            
        ]         
      }                                                                                
    ]             
  }

  ▎ Replace placeholder prices with actual values from your pricing section, and update
   the logo URL to a dedicated square logo image.
                                                                                       
  ---             
  Top 5 Actions by Impact
                                                                                       
  1. Fix SSR rendering — Server-render all homepage content. This alone fixes H1,
  headings, content visibility, and LCP issues.                                        
  2. Add structured data — Deploy the JSON-LD @graph block above.
  3. Convert nav buttons to links — Make navigation crawlable.                         
  4. Fix OG image 404 + www redirect — Quick wins for social sharing and crawl         
  consolidation.                                                                       
  5. Add coach bio / E-E-A-T signals — Identify the expertise behind the training      
  programs with name, credentials, and photo. 

  /seo-content:

  ⏺ Single-Page SEO Analysis: rugbyprep.com

  Page Score Card

  Overall Score: 38/100

  On-Page SEO:     30/100  ███░░░░░░░
  Content Quality: 42/100  ████░░░░░░
  Technical:       62/100  ██████░░░░
  Schema:           0/100  ░░░░░░░░░░
  Images:          65/100  ██████░░░░
  E-E-A-T:         47/100  ████░░░░░░

  Stack: Next.js (App Router + Turbopack) on Vercel | Languages: en, fr, es, de, it, ru

  ---
  Critical Issues (Fix Immediately)

  1. Empty <main> in SSR — All content is client-rendered

  The <main> element renders as <!--$--><!--/$--> — no H1, no headings, no text. Search
   engines that don't execute JS see an empty page with only header/footer and a
  loading spinner. This is the #1 blocker for indexing.

  Fix: Ensure Next.js server-renders homepage content. Check if the page component is
  accidentally a client component ("use client") or if data fetching is client-only.

  2. OG Image returns 404

  https://rugbyprep.com/og-image.png → 404. All social shares lack a preview image.

  Fix: Upload the image to /public/og-image.png.

  3. No H1 tag (consequence of #1)

  Zero heading tags in SSR HTML. Search engines see no content hierarchy.

  4. Navigation uses <button> instead of <a> links

  The 4 main nav items ("L'app", "Temoignages", "Tarifs", "FAQ") are <button> elements
  — invisible to crawlers.

  Fix: Convert to <a href="#section-id"> or Next.js <Link> components.

  ---
  High Priority Issues

  5. No structured data (JSON-LD)

  Zero schema markup of any kind. Missing: Organization, WebSite, SoftwareApplication.

  6. www vs non-www not redirecting

  Both www.rugbyprep.com and rugbyprep.com serve content. Canonical points to non-www
  but no 301 redirect exists.

  Fix: Add redirect in vercel.json or next.config.js.

  7. No coach/trainer identification (E-E-A-T gap)

  For a YMYL-adjacent topic (physical training), there's zero identification of who
  designed the programs. No name, qualifications, photo, or "About" section.

  8. Language mismatch

  Page declares lang="en" but renders French content ("Temoignages", "Tarifs",
  "Satisfait ou remboursé"). Meta tags are in English, body is in French.

  ---
  Medium Priority Issues

  ┌─────┬───────────────────────────────────┬──────────────────────────────────────┐
  │  #  │               Issue               │               Details                │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 9   │ Meta description too long         │ 199 chars (target: 150-160)          │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 10  │ Missing x-default hreflang        │ Root URL not declared as x-default   │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 11  │ Missing Content-Security-Policy   │ XSS protection gap                   │
  │     │ header                            │                                      │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 12  │ Header logo uses loading="lazy"   │ Above-fold images should be eager    │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 13  │ No contact information            │ No email, phone, or address for a    │
  │     │                                   │ paid product                         │
  ├─────┼───────────────────────────────────┼──────────────────────────────────────┤
  │ 14  │ Content freshness: zero signals   │ No dates, no blog, no changelog      │
  └─────┴───────────────────────────────────┴──────────────────────────────────────┘

  ---
  Low Priority Issues

  ┌─────┬─────────────────────────────────────────────────────────────────────────┐
  │  #  │                                  Issue                                  │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 15  │ Duplicate viewport meta tags                                            │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 16  │ Footer links lack locale prefix (/privacy-policy vs /en/privacy-policy) │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 17  │ No IndexNow implementation                                              │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 18  │ No Permissions-Policy header                                            │
  ├─────┼─────────────────────────────────────────────────────────────────────────┤
  │ 19  │ Keywords meta tag present (Google ignores it)                           │
  └─────┴─────────────────────────────────────────────────────────────────────────┘

  ---
  Content Quality Summary

  ┌─────────────────────────────────┬─────────────────────────────────┐
  │             Metric              │              Value              │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Word count                      │ ~580 (barely meets 500 minimum) │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Primary keyword "rugby" density │ 0.7% (low)                      │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ AI Citation Readiness           │ 22/100                          │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Testimonials                    │ 3 anonymous, no photos/names    │
  ├─────────────────────────────────┼─────────────────────────────────┤
  │ Educational content             │ None — purely transactional     │
  └─────────────────────────────────┴─────────────────────────────────┘

  ---
  Schema Recommendations (Ready-to-Use JSON-LD)

  Add this combined @graph block to your layout:

  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Rugby Prep",
        "url": "https://rugbyprep.com",
        "description": "Professional rugby training programs designed by expert
  coaches.",
        "inLanguage": ["en", "fr", "es", "de", "it", "ru"],
        "publisher": { "@id": "https://rugbyprep.com/#organization" }
      },
      {
        "@type": "Organization",
        "@id": "https://rugbyprep.com/#organization",
        "name": "Rugby Prep",
        "url": "https://rugbyprep.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://rugbyprep.com/logo.png",
          "width": 112,
          "height": 112
        },
        "sameAs": ["https://twitter.com/rugbyprep"],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": "https://rugbyprep.com",
          "availableLanguage": ["English", "French", "Spanish", "German", "Italian",
  "Russian"]
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "Rugby Prep",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web",
        "description": "Professional rugby training programs designed by expert
  coaches.",
        "url": "https://rugbyprep.com",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "EUR",
          "lowPrice": "0",
          "highPrice": "49.99",
          "offerCount": "3",
          "url": "https://rugbyprep.com/#tarifs"
        },
        "publisher": { "@id": "https://rugbyprep.com/#organization" },
        "featureList": [
          "Personalized rugby workout programs",
          "Video exercise demonstrations",
          "Progress tracking and session monitoring",
          "Expert coaching guidance"
        ]
      },
      {
        "@type": "WebPage",
        "name": "Rugby Prep - Professional Rugby Training Programs",
        "url": "https://rugbyprep.com",
        "inLanguage": "en",
        "isPartOf": { "@type": "WebSite", "url": "https://rugbyprep.com" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item":
  "https://rugbyprep.com" }
        ]
      }
    ]
  }

  ▎ Replace placeholder prices with actual values from your pricing section, and update
   the logo URL to a dedicated square logo image.

  ---
  Top 5 Actions by Impact

  1. Fix SSR rendering — Server-render all homepage content. This alone fixes H1,
  headings, content visibility, and LCP issues.
  2. Add structured data — Deploy the JSON-LD @graph block above.
  3. Convert nav buttons to links — Make navigation crawlable.
  4. Fix OG image 404 + www redirect — Quick wins for social sharing and crawl
  consolidation.
  5. Add coach bio / E-E-A-T signals — Identify the expertise behind the training
  programs with name, credentials, and photo.

✻ Crunched for 3m 20s

❯ /seo-content https://www.rugbyprep.com/                                              

⏺ seo-content(Deep content quality analysis)
  ⎿  Done (27 tool uses · 44.0k tokens · 6m 10s)               
  (ctrl+o to expand)
                                                               
⏺ Content Quality & E-E-A-T Analysis: rugbyprep.com                   
                                                                      
  Content Quality Score: 28/100                                                        
                                                                                       
  E-E-A-T:              23/100  ██░░░░░░░░                                             
  Keyword Optimization:  25/100  ██░░░░░░░░                                            
  AI Citation Readiness: 18/100  █░░░░░░░░░                                            
  Content Structure:     30/100  ███░░░░░░░                                            
  Readability:           65/100  ██████░░░░                                            
  Word Count:            55/100  █████░░░░░                                            
  Content Freshness:     20/100  ██░░░░░░░░                                            
                                                                                       
  ---                                                                                  
  Critical Finding: Broken Internationalization                                        
                                                                                       
  Both /en and /fr return 404 despite being declared in hreflang tags and sitemap.xml. 
  All 6 language variants appear to be dead URLs — wasting crawl budget and sending    
  contradictory signals to Google.
                                                                                       
  ---                                                                                  
  E-E-A-T Breakdown
                                                                                       
  ┌───────────────────┬───────┬─────────────────────────────────────────────────────┐
  │      Factor       │ Score │                     Key Signals                     │
  ├───────────────────┼───────┼─────────────────────────────────────────────────────┤
  │                   │       │ 3 testimonials with specific results (+6kg DC, +5kg │
  │ Experience        │ 6/25  │  in 3 months), but no process documentation, no     │
  │                   │       │ training methodology shown                          │  
  ├───────────────────┼───────┼─────────────────────────────────────────────────────┤
  │                   │       │ Zero coach identification — no name, bio,           │  
  │ Expertise         │ 5/25  │ certifications (BEES/DEJEPS/STAPS). FAQ uses "je"   │  
  │                   │       │ but this person is never identified                 │
  ├───────────────────┼───────┼─────────────────────────────────────────────────────┤  
  │                   │       │ No federation partnerships (FFR, World Rugby), no   │
  │ Authoritativeness │ 3/25  │ media coverage, no industry endorsements. Only      │  
  │                   │       │ credit: "d5x.io"                                    │
  ├───────────────────┼───────┼─────────────────────────────────────────────────────┤  
  │                   │       │ HTTPS, privacy policy, terms present. But: no       │
  │ Trustworthiness   │ 9/25  │ contact info, broken pricing ("Aucun produit        │  
  │                   │       │ disponible"), no date stamps                        │
  └───────────────────┴───────┴─────────────────────────────────────────────────────┘  
                  
  E-E-A-T Total: 23/100 — This is the primary weakness. For a YMYL-adjacent product    
  (physical training, injury prevention), the complete absence of identifiable
  expertise is a major ranking barrier.                                                
                  
  ---
  Word Count by Section

  ┌───────────────┬───────┬────────────┐
  │    Section    │ Words │ % of Total │
  ├───────────────┼───────┼────────────┤                                               
  │ Hero          │ 31    │ 5%         │
  ├───────────────┼───────┼────────────┤                                               
  │ Features      │ 72    │ 11%        │
  ├───────────────┼───────┼────────────┤
  │ Testimonials  │ 169   │ 27%        │
  ├───────────────┼───────┼────────────┤                                               
  │ Pricing       │ 61    │ 10%        │
  ├───────────────┼───────┼────────────┤                                               
  │ FAQ           │ 269   │ 43%        │
  ├───────────────┼───────┼────────────┤
  │ Header/Footer │ 36    │ 6%         │
  ├───────────────┼───────┼────────────┤                                               
  │ Total         │ 638   │            │
  └───────────────┴───────┴────────────┘                                               
                  
  Passes the 500-word minimum, but content is heavily concentrated in FAQ. Hero +      
  Features = only 103 words — extremely thin for the primary selling sections.
                                                                                       
  ---             
  Keyword Analysis
                                                                                       
  ┌────────────────┬─────────┬────────────────────────────────┐
  │    Keyword     │ Density │           Assessment           │                        
  ├────────────────┼─────────┼────────────────────────────────┤
  │ seance(s)      │ 4.4%    │ Over-optimized (>3% threshold) │
  ├────────────────┼─────────┼────────────────────────────────┤
  │ exercice(s)    │ 1.1%    │ Good                           │                        
  ├────────────────┼─────────┼────────────────────────────────┤                        
  │ rugby          │ 1.0%    │ Low for primary keyword        │                        
  ├────────────────┼─────────┼────────────────────────────────┤                        
  │ performance(s) │ 1.0%    │ Good                           │
  ├────────────────┼─────────┼────────────────────────────────┤                        
  │ terrain        │ 0.8%    │ Good                           │
  ├────────────────┼─────────┼────────────────────────────────┤                        
  │ programme(s)   │ 0.5%    │ Good                           │
  ├────────────────┼─────────┼────────────────────────────────┤                        
  │ prépa physique │ 0.2%    │ Very low for core value prop   │
  └────────────────┴─────────┴────────────────────────────────┘                        
  
  Language mismatch (Critical): <html lang="en"> + English meta tags, but body content 
  is entirely in French. This confuses every ranking system — English searchers bounce
  on French content, French searchers never see the page.                              
                  
  Missing high-value French terms: "préparation physique rugby", "programme musculation
   rugby", "entraînement rugby maison", "condition physique rugby", "force explosive
  rugby"                                                                               
                  
  ---
  AI Citation Readiness: 18/100
                               
  ┌───────────────────────┬───────┬────────────────────────────────────────────────┐
  │        Factor         │ Score │                     Notes                      │   
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Quotable facts        │ 3/15  │ Only "+6kg DC", "200+ vidéos", "4              │   
  │                       │       │ séances/semaine"                               │
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Structured data       │ 0/20  │ Zero JSON-LD of any kind                       │   
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Heading hierarchy     │ 3/15  │ Exists in JS only, not in SSR                  │   
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Answer-first          │ 8/15  │ FAQ section is well-structured                 │   
  │ formatting            │       │                                                │
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤   
  │ Tables/lists          │ 2/10  │ Pricing list only                              │
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Attribution           │ 0/10  │ No sources cited                               │
  ├───────────────────────┼───────┼────────────────────────────────────────────────┤
  │ Entity clarity        │ 2/15  │ Brand clear, no person entities                │
  └───────────────────────┴───────┴────────────────────────────────────────────────┘   
   
  ---                                                                                  
  AI Content Assessment
                       
  The content does not appear AI-generated. Colloquial French ("tu" form, "galérer",
  "costaud"), rugby-specific jargon ("pilier", "arrière", "Nationale 2", "Fed3"), and  
  specific numeric claims suggest authentic human-written copy. However, the feature
  descriptions have a slightly formulaic SaaS template quality.                        
                  
  ---
  Broken Pricing (Trust Killer)
                                                                                       
  The pricing section displays "Aucun produit disponible pour le moment" — likely a
  Stripe integration issue. Combined with "Essaie 7 jours gratuits" CTAs, this creates 
  a trust-destroying contradiction. Any visitor (including Googlebot) sees a
  non-functional product page.                                                         
                  
  ---
  Top 10 Recommendations by Impact
                                                                                       
  P0 — Fix Immediately
                                                                                       
  ┌─────┬───────────────────────────────────────────────────┬──────────────────────┐   
  │  #  │                       Issue                       │        Impact        │
  ├─────┼───────────────────────────────────────────────────┼──────────────────────┤   
  │ 1   │ Fix SSR rendering — <main> is empty in server     │ Unlocks all SEO      │
  │     │ HTML. All content must be server-rendered         │ value                │
  ├─────┼───────────────────────────────────────────────────┼──────────────────────┤   
  │ 2   │ Fix broken language routes — /en, /fr, etc. all   │ Stops crawl budget   │
  │     │ 404. Implement or remove hreflang                 │ waste                │   
  ├─────┼───────────────────────────────────────────────────┼──────────────────────┤
  │ 3   │ Fix language mismatch — Set lang="fr" + French    │ Enables correct      │   
  │     │ meta tags, or serve English content               │ language targeting   │   
  ├─────┼───────────────────────────────────────────────────┼──────────────────────┤
  │ 4   │ Fix broken pricing — "Aucun produit disponible"   │ Direct revenue       │   
  │     │ kills conversions and trust                       │ impact               │   
  └─────┴───────────────────────────────────────────────────┴──────────────────────┘
                                                                                       
  P1 — High Impact

  ┌─────┬─────────────────────────────────────────────────┬────────────────────────┐
  │  #  │                      Issue                      │         Impact         │
  ├─────┼─────────────────────────────────────────────────┼────────────────────────┤
  │ 5   │ Add JSON-LD schema — FAQPage,                   │ +30-40pts AI citation  │
  │     │ SoftwareApplication, Organization, Review       │ readiness              │
  ├─────┼─────────────────────────────────────────────────┼────────────────────────┤   
  │     │ Add coach/author bio — Name, photo,             │                        │
  │ 6   │ certifications, rugby background (100-200       │ +10-15pts E-E-A-T      │   
  │     │ words)                                          │                        │
  ├─────┼─────────────────────────────────────────────────┼────────────────────────┤   
  │ 7   │ Add contact information — Email at minimum,     │ Trust signal baseline  │   
  │     │ physical address ideally                        │                        │
  ├─────┼─────────────────────────────────────────────────┼────────────────────────┤   
  │     │                                                 │ Fixes                  │   
  │ 8   │ Reduce "séance" density from 4.4% to <2.5%      │ over-optimization      │
  │     │                                                 │ signal                 │   
  └─────┴─────────────────────────────────────────────────┴────────────────────────┘

  P2 — Medium Impact

  ┌─────┬────────────────────────────────────────────┬─────────────────────────────┐
  │  #  │                   Issue                    │           Impact            │
  ├─────┼────────────────────────────────────────────┼─────────────────────────────┤
  │     │ Add "How It Works" section — Training      │ +word count, +expertise,    │
  │ 9   │ methodology, periodization, why            │ +differentiation            │
  │     │ rugby-specific (200-300 words)             │                             │   
  ├─────┼────────────────────────────────────────────┼─────────────────────────────┤
  │ 10  │ Start a blog — 3-4 articles on rugby       │ Topical authority, internal │   
  │     │ training topics                            │  links, freshness signals   │   
  └─────┴────────────────────────────────────────────┴─────────────────────────────┘
                                                                                       
  ---             
  Additional Notes
                  
  - Grammar fix needed: "Ils ont transformés" → "Ils ont transformé" (past participle
  with avoir doesn't agree with subject)                                               
  - Testimonials need strengthening: Add full names, club names, verifiable details
  - Missing: About page, contact page, educational content hub                         
  - The local repo at /Users/junca/Projets/RugbyPrep/ contains a Vite app (likely the
  training app itself), not the Next.js landing page — the landing page source appears 
  to be in a separate repository
