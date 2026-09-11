export function analyzeGDPR(html, $) {
  const factors = {
    hasPrivacyPolicy: false,
    hasCookiePolicy: false,
    hasCookieBanner: false,
    privacyPolicyUrl: null,
    cookiePolicyUrl: null,
    detectedConsentTools: []
  };

  if (!html || !$) {
    return { score: 0, grade: "F", riskLevel: "HIGH", factors };
  }

  // 1. Detect Privacy Policy / Cookie Policy links
  $("a").each((i, el) => {
    const text = $(el).text().toLowerCase();
    const href = $(el).attr("href") || "";
    
    // Privacy links
    if (
      text.includes("privacidade") || 
      text.includes("privacy") || 
      text.includes("dados pessoais") || 
      href.includes("privacidade") || 
      href.includes("privacy-policy")
    ) {
      factors.hasPrivacyPolicy = true;
      if (!factors.privacyPolicyUrl) factors.privacyPolicyUrl = href;
    }

    // Cookie links
    if (
      text.includes("cookie") || 
      href.includes("cookie")
    ) {
      factors.hasCookiePolicy = true;
      if (!factors.cookiePolicyUrl) factors.cookiePolicyUrl = href;
    }
  });

  // 2. Detect common consent tools in scripts or html IDs/classes
  const htmlLower = html.toLowerCase();
  
  const consentIndicators = {
    "cookiebot": ["cookiebot", "cookieconsent.cookiebot.com"],
    "onetrust": ["onetrust", "ot-sdk-container"],
    "cookieyes": ["cookieyes", "cookie-law-info"],
    "iubenda": ["iubenda"],
    "complianz": ["complianz"],
    "borlabs": ["borlabs-cookie"],
    "usercentrics": ["usercentrics"],
    "axeptio": ["axeptio"],
    "quantcast": ["quantcast", "qc-cmp2-container"]
  };

  for (const [tool, keywords] of Object.entries(consentIndicators)) {
    for (const keyword of keywords) {
      if (htmlLower.includes(keyword)) {
        if (!factors.detectedConsentTools.includes(tool)) {
          factors.detectedConsentTools.push(tool);
        }
        factors.hasCookieBanner = true;
      }
    }
  }

  // Common UI indicators for cookie banners in DOM classes/ids/attributes
  const uiKeywords = [
    "cookie-banner", "cookie-consent", "cookie-popup", "cookie-modal", 
    "cookieconsent", "cookie_consent", "aviso-cookies", "politica-cookies",
    "cookie-bar", "cookies-bar", "cookie-notice", "cookies-notice",
    "cookies-warning", "cookie-warning", "aceptar-cookies", "accept-cookies"
  ];

  for (const keyword of uiKeywords) {
    if (htmlLower.includes(keyword)) {
      factors.hasCookieBanner = true;
    }
  }

  // Calculate a compliance score out of 100
  let score = 0;
  if (factors.hasPrivacyPolicy) score += 40;
  if (factors.hasCookiePolicy) score += 30;
  if (factors.hasCookieBanner) score += 30;

  let grade = "F";
  if (score >= 90) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 50) grade = "C";
  else if (score >= 30) grade = "D";

  let riskLevel = "HIGH";
  if (score >= 70) riskLevel = "LOW";
  else if (score >= 40) riskLevel = "MEDIUM";

  return {
    score,
    grade,
    riskLevel,
    factors
  };
}
