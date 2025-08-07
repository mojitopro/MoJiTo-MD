/**
 * API Configuration
 * Centralized API endpoints and authentication keys
 */

export const API_CONFIG = {
  // AI & Text Processing
  amel: 'https://melcanz.com',
  nrtm: 'https://nurutomo.herokuapp.com',
  LeysCoder: 'https://leyscoders-api.herokuapp.com',
  
  // Media & Images
  xteam: 'https://api.xteam.xyz',
  zeks: 'https://api.zeks.me',
  lol: 'https://api.lolhuman.xyz',
  
  // Utility APIs
  bx: 'https://bx-hunter.herokuapp.com',
  nzcha: 'http://nzcha-apii.herokuapp.com',
  bg: 'http://bochil.ddns.net',
  fdci: 'https://api.fdci.se',
  
  // Social & Content
  dzx: 'https://api.dhamzxploit.my.id',
  bsbt: 'https://bsbt-api-rest.herokuapp.com',
  zahir: 'https://zahirr-web.herokuapp.com',
  hardianto: 'https://hardianto-chan.herokuapp.com',
  
  // Custom APIs
  pencarikode: 'https://pencarikode.xyz',
  adiisus: 'https://adiixyzapi.herokuapp.com',
  Velgrynd: 'https://velgrynd.herokuapp.com',
  rey: 'https://server-api-rey.herokuapp.com',
  shadow: 'https://api.reysekha.xyz',
  apialc: 'https://api-alc.herokuapp.com',
  botstyle: 'https://botstyle-api.herokuapp.com',
  neoxr: 'https://neoxr-api.herokuapp.com',
  ana: 'https://anabotofc.herokuapp.com/',
  kanx: 'https://kannxapi.herokuapp.com/',
  dhnjing: 'https://dhnjing.xyz',
  violetics: 'https://violetics.pw'
};

export const API_KEYS = {
  // API Authentication Keys (use environment variables in production)
  'https://api-alc.herokuapp.com': process.env.ALC_API_KEY || 'ConfuMods',
  'https://api.reysekha.xyz': process.env.REYSEKHA_API_KEY || 'apirey',
  'https://melcanz.com': process.env.MELCANZ_API_KEY || 'F3bOrWzY',
  'https://bx-hunter.herokuapp.com': process.env.BX_HUNTER_API_KEY || 'Ikyy69',
  'https://api.xteam.xyz': process.env.XTEAM_API_KEY || '5bd33b276d41d6b4',
  'https://zahirr-web.herokuapp.com': process.env.ZAHIR_API_KEY || 'zahirgans',
  'https://bsbt-api-rest.herokuapp.com': process.env.BSBT_API_KEY || 'benniismael',
  'https://api.zeks.me': process.env.ZEKS_API_KEY || 'apivinz',
  'https://hardianto-chan.herokuapp.com': process.env.HARDIANTO_API_KEY || 'hardianto',
  'https://pencarikode.xyz': process.env.PENCARIKODE_API_KEY || 'pais',
  'https://leyscoders-api.herokuapp.com': process.env.LEYS_API_KEY || 'MIMINGANZ',
  'https://server-api-rey.herokuapp.com': process.env.REY_API_KEY || 'apirey',
  'https://api.lolhuman.xyz': process.env.LOLHUMAN_API_KEY || '9b817532fadff8fc7cb86862',
  'https://botstyle-api.herokuapp.com': process.env.BOTSTYLE_API_KEY || 'Eyar749L',
  'https://neoxr-api.herokuapp.com': process.env.NEOXR_API_KEY || 'yntkts',
  'https://anabotofc.herokuapp.com/': process.env.ANA_API_KEY || 'AnaBot',
  'https://violetics.pw': process.env.VIOLETICS_API_KEY || 'beta'
};

/**
 * Get API endpoint with authentication
 */
export function getAPIEndpoint(apiName, path = '/', params = {}, keyParam = null) {
  const baseURL = API_CONFIG[apiName] || apiName;
  
  if (keyParam && API_KEYS[baseURL]) {
    params[keyParam] = API_KEYS[baseURL];
  }
  
  const queryString = Object.keys(params).length 
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  return baseURL + path + queryString;
}

/**
 * Check if API key is available
 */
export function hasAPIKey(apiName) {
  const baseURL = API_CONFIG[apiName] || apiName;
  return Boolean(API_KEYS[baseURL]);
}

/**
 * Get all available APIs
 */
export function getAvailableAPIs() {
  return Object.keys(API_CONFIG).filter(api => hasAPIKey(api));
}
