/**
 * Cookie functions
 * ================
 *
 * Used by the cookie banner component and cookies page pattern.
 *
 * Includes function `Cookie()` for getting, setting, and deleting cookies, and
 * functions to manage the users' consent to cookies.
 */

/* Name of the cookie to save users cookie preferences to. */
const CONSENT_COOKIE_NAME = 'design_system_cookies_policy'

/* Users can (dis)allow different groups of cookies. */
const COOKIE_CATEGORIES = {
  _ga: 'analytics',
  _gid: 'analytics',

  /* Essential cookies
   *
   * Essential cookies cannot be deselected, but we want our cookie code to
   * only allow adding cookies that are documented in this object, so they need
   * to be added here.
   */
  CONSENT_COOKIE_NAME: 'essential'
}

/*
 * Default cookie preferences if user has no cookie preferences.
 *
 * Note that this doesn't include a key for essential cookies, essential
 * cookies cannot be disallowed. If the object contains { essential: false }
 * this will be ignored.
 */
const DEFAULT_COOKIE_CONSENT = {
  analytics: false
}

/*
 * Set, get, and delete cookies.
 *
 * Usage:
 *
 *   Setting a cookie:
 *   Cookie('hobnob', 'tasty', { days: 30 })
 *
 *   Reading a cookie:
 *   Cookie('hobnob')
 *
 *   Deleting a cookie:
 *   Cookie('hobnob', null)
 */
export function Cookie (name, value, options) {
  if (typeof value !== 'undefined') {
    if (value === false || value === null) {
      return deleteCookie(name)
    } else {
      // Default expiry date of 30 days
      if (typeof options === 'undefined') {
        options = { days: 30 }
      }
      return setCookie(name, value, options)
    }
  } else {
    return getCookie(name)
  }
}

/** Return the user's cookie preferences. */
export function getConsentCookie () {
  var consentCookie = getCookie(CONSENT_COOKIE_NAME)
  var consentCookieObj

  if (consentCookie) {
    try {
      consentCookieObj = JSON.parse(consentCookie)
    } catch (err) {
      return null
    }
  } else {
    return null
  }

  return consentCookieObj
}

/** Update the user's cookie preferences. */
export function setConsentCookie (options) {
  var cookieConsent = getConsentCookie()

  if (!cookieConsent) {
    cookieConsent = JSON.parse(JSON.stringify(DEFAULT_COOKIE_CONSENT))
  }

  for (var cookieType in options) {
    // Essential cookies cannot be deselected, ignore this cookie type
    if (cookieType === 'essential') {
      continue
    }

    // Update existing user cookie consent preferences
    cookieConsent[cookieType] = options[cookieType]

    // Delete cookies of that type if consent being set to false
    if (!options[cookieType]) {
      for (var cookie in COOKIE_CATEGORIES) {
        if (COOKIE_CATEGORIES[cookie] === cookieType) {
          Cookie(cookie, null)

          if (Cookie(cookie)) {
            document.cookie = cookie + '=;expires=' + new Date() + ';domain=' + window.location.hostname.replace(/^www\./, '.') + ';path=/'
          }
        }
      }
    }
  }

  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(cookieConsent), { days: 365 })
}

function userAllowsCookieCategory (cookieCategory, cookiePreferences) {
  // Essential cookies are always allowed
  if (cookieCategory === 'essential') {
    return true
  }

  // Sometimes cookiePreferences is malformed in some of the tests, so we need to handle these
  try {
    return cookiePreferences[cookieCategory]
  } catch (e) {
    console.error(e)
    return false
  }
}

function userAllowsCookie (cookieName) {
  // Always allow setting the consent cookie
  if (cookieName === CONSENT_COOKIE_NAME) {
    return true
  }

  if (COOKIE_CATEGORIES[cookieName]) {
    var cookieCategory = COOKIE_CATEGORIES[cookieName]

    // Get the current cookie preferences, or the default if no preferences set
    var cookiePreferences = getConsentCookie() || DEFAULT_COOKIE_CONSENT

    return userAllowsCookieCategory(cookieCategory, cookiePreferences)
  } else {
    // Deny the cookie if it is not known to us
    return false
  }
}

function getCookie (name) {
  var nameEQ = name + '='
  var cookies = document.cookie.split(';')
  for (var i = 0, len = cookies.length; i < len; i++) {
    var cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

function setCookie (name, value, options) {
  if (userAllowsCookie(name)) {
    if (typeof options === 'undefined') {
      options = {}
    }
    var cookieString = name + '=' + value + '; path=/'
    if (options.days) {
      var date = new Date()
      date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000))
      cookieString = cookieString + '; expires=' + date.toGMTString()
    }
    if (document.location.protocol === 'https:') {
      cookieString = cookieString + '; Secure'
    }
    document.cookie = cookieString
  }
}

function deleteCookie (name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  return null
}
