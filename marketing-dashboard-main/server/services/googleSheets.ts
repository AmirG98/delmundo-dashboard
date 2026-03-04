/**
 * Google Sheets Integration Service
 * Fetches marketing data from a public Google Sheet
 * Includes hardcoded LinkedIn and Bing data
 */

// Sheet configuration
const SHEET_ID = '1DDw7kBS828ZQ7kGLMAlgnmuXoHxrvYro9vbsY2LI1dI';

// Sheet name mappings to business units and platforms
interface SheetMapping {
  sheetName: string;
  businessUnit: 'lemonsuite' | 'casetracking' | 'lemonflow';
  platform: 'google' | 'meta' | 'linkedin' | 'hubspot' | 'bing';
  subUnit?: string;
  dataFormat: 'google_ads' | 'meta_ads';
}

const SHEET_MAPPINGS: SheetMapping[] = [
  { sheetName: 'SUITE - Google Ads Lemonsuite', businessUnit: 'lemonsuite', platform: 'google', dataFormat: 'google_ads' },
  { sheetName: 'CaseTracking - Google Ads - LemonSuite', businessUnit: 'casetracking', platform: 'google', dataFormat: 'google_ads' },
  { sheetName: 'SUITE - LemonSuite - Meta', businessUnit: 'lemonsuite', platform: 'meta', dataFormat: 'meta_ads' },
  { sheetName: 'CaseTracking Enterprise - Google Ads - LemonFlow', businessUnit: 'casetracking', platform: 'google', subUnit: 'enterprise', dataFormat: 'google_ads' },
  { sheetName: 'FLOW - Google Ads - LemonFlow', businessUnit: 'lemonflow', platform: 'google', dataFormat: 'google_ads' },
  { sheetName: 'FLOW - Meta - LemonFlow', businessUnit: 'lemonflow', platform: 'meta', dataFormat: 'meta_ads' },
];

// Subtotal row names to filter out (these are aggregations, not individual campaigns)
const SUBTOTAL_ROWS = [
  'SEARCH',
  'P. MAX',
  'P.MAX',
  'PMAX',
  'TOTAL GENERAL',
  'TOTAL',
];

// Campaign type detection patterns
export type CampaignType = 'pmax' | 'search' | 'other';

function detectCampaignType(campaignName: string): CampaignType {
  const upperName = campaignName.toUpperCase();
  if (upperName.includes('[P.MAX]') || upperName.includes('[P. MAX]') || upperName.includes('[PMAX]') || upperName.startsWith('P.MAX') || upperName.startsWith('P. MAX')) {
    return 'pmax';
  }
  if (upperName.includes('[SEARCH]') || upperName.includes('[SEARH]') || upperName.startsWith('SEARCH')) {
    return 'search';
  }
  return 'other';
}

/**
 * Detect if a campaign belongs to CTF (Firms) or CTE (Enterprise) sub-unit
 * Returns 'ctf', 'cte', or undefined if not applicable
 */
export type SubUnitType = 'ctf' | 'cte' | undefined;

function detectSubUnit(campaignName: string, existingSubUnit?: string): SubUnitType {
  // If already marked as enterprise from sheet mapping, it's CTE
  if (existingSubUnit === 'enterprise') {
    return 'cte';
  }
  
  const upperName = campaignName.toUpperCase();
  
  // Check for CTF (Firms) indicators
  if (upperName.includes('[CTF]') || upperName.includes('CTF') || upperName.includes('FIRMS')) {
    return 'ctf';
  }
  
  // Check for CTE (Enterprise) indicators
  if (upperName.includes('[CTE]') || upperName.includes('CTE') || upperName.includes('ENTERPRISE')) {
    return 'cte';
  }
  
  return undefined;
}

function isSubtotalRow(campaignName: string): boolean {
  const trimmed = campaignName.trim().toUpperCase();
  return SUBTOTAL_ROWS.some(subtotal => trimmed === subtotal.toUpperCase());
}

export interface CampaignData {
  campaign: string;
  campaignType: CampaignType;
  clicks: number;
  clicksComparison: number;
  clicksChange: number;
  cpc: number;
  cpcComparison: number;
  cpcChange: number;
  conversions: number;
  conversionsComparison: number;
  conversionsChange: number;
  costPerConversion: number;
  costPerConversionComparison: number;
  costPerConversionChange: number;
  conversionRate: number;
  conversionRateComparison: number;
  conversionRateChange: number;
  impressionShare: number;
  impressionShareComparison: number;
  impressionShareChange: number;
  businessUnit: string;
  platform: string;
  subUnit?: string;
  detectedSubUnit?: SubUnitType;
  // Meta-specific fields
  reach?: number;
  reachComparison?: number;
  reachChange?: number;
  spend?: number;
  spendComparison?: number;
  spendChange?: number;
  ctr?: number;
  ctrComparison?: number;
  ctrChange?: number;
}

export interface CampaignTypeMetrics {
  clicks: number;
  clicksComparison: number;
  clicksChange: number;
  cpc: number;
  cpcComparison: number;
  cpcChange: number;
  conversions: number;
  conversionsComparison: number;
  conversionsChange: number;
  costPerConversion: number;
  conversionRate: number;
  impressionShare: number;
  spend: number;
  spendComparison: number;
  campaigns: CampaignData[];
}

export interface SheetData {
  dateRange: string;
  comparisonDateRange: string;
  campaigns: CampaignData[];
  totals: {
    clicks: number;
    clicksComparison: number;
    clicksChange: number;
    cpc: number;
    cpcComparison: number;
    cpcChange: number;
    conversions: number;
    conversionsComparison: number;
    conversionsChange: number;
    costPerConversion: number;
    conversionRate: number;
    impressionShare: number;
  };
}

/**
 * Parse a percentage string to number
 */
function parsePercentage(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '-' || value === '') return 0;
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a number string (handles locale formatting)
 * Handles Chilean format: $383.240 (dot as thousands separator)
 * Handles European format: 1.234,56 (dot as thousands, comma as decimal)
 * Handles US format: 1,234.56 (comma as thousands, dot as decimal)
 */
function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '-' || value === '') return 0;
  
  let cleaned = String(value).trim();
  
  // Check if this is a currency value (starts with $ or contains $)
  const isCurrency = cleaned.includes('$');
  
  // Remove currency symbol and spaces
  cleaned = cleaned.replace(/[$\s]/g, '');
  
  // If contains both . and ,, determine format
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Check which comes last - that's the decimal separator
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // European format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // Only dots - check if it's Chilean format (dot as thousands separator)
    // Chilean format: 383.240 (no decimals for currency, dot is thousands)
    const parts = cleaned.split('.');
    if (isCurrency || (parts.length >= 2 && parts[parts.length - 1].length === 3)) {
      // Likely Chilean thousands separator: 383.240 or 1.234.567
      cleaned = cleaned.replace(/\./g, '');
    }
    // Otherwise keep as is (decimal point)
  } else if (cleaned.includes(',')) {
    // Only commas - could be decimal separator or thousands
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal: 1234,56
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousands: 1,234
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  cleaned = cleaned.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch data from a specific sheet tab using Google Sheets API v4
 */
async function fetchSheetTab(sheetName: string): Promise<string[][]> {
  const encodedSheetName = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch sheet ${sheetName}: ${response.status}`);
      return [];
    }
    
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Parse CSV text into 2D array
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      if (char === '\r') i++; // Skip \n after \r
    } else if (char !== '\r') {
      currentCell += char;
    }
  }
  
  // Don't forget the last cell and row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Parse Google Ads sheet data into campaign objects
 * Now filters out subtotal rows and categorizes campaigns by type
 */
function parseGoogleAdsData(rows: string[][], mapping: SheetMapping): { campaigns: CampaignData[], dateRange: string } {
  const campaigns: CampaignData[] = [];
  let dateRange = '';
  
  if (rows.length < 2) return { campaigns, dateRange };
  
  // Extract date range from first row header
  if (rows[0] && rows[0][0]) {
    dateRange = rows[0][0];
  }
  
  // Parse data rows (starting from row 2, index 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || row[0].trim() === '') continue;
    
    const campaignName = row[0].trim();
    
    // Skip subtotal rows (SEARCH, P.MAX, TOTAL GENERAL, etc.)
    if (isSubtotalRow(campaignName)) {
      continue;
    }
    
    // Detect campaign type
    const campaignType = detectCampaignType(campaignName);
    
    // Map columns based on the ACTUAL structure observed from the sheet:
    // A (0): Campaign name
    // B (1): Gasto (spend - NOW POPULATED)
    // C (2): Clics (current)
    // D (3): Clics (comparison)
    // E (4): Clics (change %)
    // F (5): CPC medio (current)
    // G (6): CPC medio (comparison)
    // H (7): CPC medio (change %)
    // I (8): Conversiones (current)
    // J (9): Conversiones (comparison)
    // K (10): Conversiones (change %)
    // L (11): Coste/conv. (current)
    // M (12): Coste/conv. (comparison)
    // N (13): Coste/conv. (change %)
    // O (14): Tasa de conversión (current)
    // P (15): Tasa de conversión (comparison)
    // Q (16): Tasa de conversión (change %)
    // R (17): Cuota de impr. de búsqueda (current)
    // S (18): Cuota de impr. de búsqueda (comparison)
    // T (19): Cuota de impr. de búsqueda (change %)
    
    // Correct column indices based on actual sheet structure:
    // 0: Campaña, 1: Gasto actual, 2: Gasto anterior, 3: Gasto cambio%
    // 4: Clics, 5: Clics comp, 6: Clics cambio%
    // 7: CPC medio, 8: CPC comp, 9: CPC cambio%
    // 10: Conversiones, 11: Conv comp, 12: Conv cambio%
    // 13: Coste/conv, 14: Coste/conv comp, 15: Coste/conv cambio%
    // 16: Tasa conv, 17: Tasa conv comp, 18: Tasa conv cambio%
    // 19: Cuota impr, 20: Cuota impr comp, 21: Cuota impr cambio%
    
    // Read raw values from sheet
    // Column structure: 0=Campaña, 1=Gasto actual, 2=Gasto anterior, 3=Gasto cambio%
    // 4=Clics, 5=Clics comp, 6=Clics cambio%, 7=CPC (ignore), 8=CPC comp (ignore), 9=CPC cambio%
    // 10=Conversiones, 11=Conv comp, 12=Conv cambio%, etc.
    
    const spend = parseNumber(row[1]); // Gasto Período actual (e.g., $383.240 = 383240)
    const spendComparison = parseNumber(row[2]); // Período anterior (Gasto)
    const clicks = parseNumber(row[4]); // Clics (e.g., 99)
    const clicksComp = parseNumber(row[5]); // Clics (Comparar con)
    const conversions = parseNumber(row[10]); // Conversiones (e.g., 4)
    const conversionsComp = parseNumber(row[11]); // Conversiones (Comparar con)
    
    // CALCULATE CPC and conversion rate mathematically instead of reading from sheet
    const cpc = clicks > 0 ? Math.round(spend / clicks) : 0; // CPC = Gasto / Clics
    const cpcComp = clicksComp > 0 ? Math.round(spendComparison / clicksComp) : 0;
    const cpcChange = cpcComp > 0 ? ((cpc - cpcComp) / cpcComp) * 100 : 0;
    
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0; // Tasa = Conv / Clics * 100
    const conversionRateComp = clicksComp > 0 ? (conversionsComp / clicksComp) * 100 : 0;
    const conversionRateChange = conversionRateComp > 0 ? ((conversionRate - conversionRateComp) / conversionRateComp) * 100 : 0;
    
    const costPerConversion = conversions > 0 ? Math.round(spend / conversions) : 0;
    const costPerConversionComp = conversionsComp > 0 ? Math.round(spendComparison / conversionsComp) : 0;
    const costPerConversionChange = costPerConversionComp > 0 ? ((costPerConversion - costPerConversionComp) / costPerConversionComp) * 100 : 0;
    
    const campaign: CampaignData = {
      campaign: campaignName,
      campaignType,
      clicks,
      clicksComparison: clicksComp,
      clicksChange: parsePercentage(row[6]), // Clics (Cambiar %)
      cpc,
      cpcComparison: cpcComp,
      cpcChange,
      conversions,
      conversionsComparison: conversionsComp,
      conversionsChange: parsePercentage(row[12]), // Conversiones (Cambiar %)
      costPerConversion,
      costPerConversionComparison: costPerConversionComp,
      costPerConversionChange,
      conversionRate,
      conversionRateComparison: conversionRateComp,
      conversionRateChange,
      impressionShare: parsePercentage(row[19]), // Cuota de impr. de búsqueda
      impressionShareComparison: parsePercentage(row[20]), // Cuota de impr. (Comparar con)
      impressionShareChange: parsePercentage(row[21]), // Cuota de impr. (Cambiar %)
      businessUnit: mapping.businessUnit,
      platform: mapping.platform,
      subUnit: mapping.subUnit,
      detectedSubUnit: detectSubUnit(campaignName, mapping.subUnit),
      spend,
      spendComparison,
    };
    
    campaigns.push(campaign);
  }
  
  return { campaigns, dateRange };
}

/**
 * Parse Meta Ads sheet data into campaign objects
 * Meta Ads has different column structure than Google Ads
 * 
 * Actual Meta Ads columns from "SUITE - LemonSuite - Meta":
 * A: Empty, B: Nombre de la campaña
 * C: Alcance (current), D: Alcance (comparison), E: Alcance Cambio (%)
 * F: Frecuencia (current), G: Frecuencia (comparison), H: Frecuencia Cambio (%)
 * I: Tipo de resultado
 * J: Resultados (current), K: Resultados (comparison), L: Resultados Cambio (%)
 * M: Tasa de resultados (current), N: Tasa de resultados (comparison), O: Tasa de resultados Cambio (%)
 * P: Costo por resultado (current), Q: Costo por resultado (comparison), R: Costo por resultado Cambio (%)
 * S: Importe gastado (CLP) (current), T: Importe gastado (CLP) (comparison), U: Importe gastado (CLP) Cambio (%)
 * V: CPM (current), W: CPM (comparison), X: CPM Cambio (%)
 * Y: Clics en el enlace (current), Z: Clics en el enlace (comparison), AA: Clics en el enlace Cambio (%)
 * AB: CTR (current), AC: CTR (comparison), AD: CTR Cambio (%)
 */
function parseMetaAdsData(rows: string[][], mapping: SheetMapping): { campaigns: CampaignData[], dateRange: string } {
  const campaigns: CampaignData[] = [];
  let dateRange = '';
  
  if (rows.length < 2) return { campaigns, dateRange };
  
  // Extract date range from header row - look for date pattern in column headers
  if (rows[0]) {
    for (const cell of rows[0]) {
      if (cell && cell.includes('Jan')) {
        const match = cell.match(/\(([^)]+)\)/);
        if (match) {
          dateRange = match[1];
          break;
        }
      }
    }
  }
  
  // Parse data rows (starting from row 2, index 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Campaign name is in column B (index 1)
    if (!row || !row[1] || row[1].trim() === '') continue;
    
    const campaignName = row[1].trim();
    
    // Skip subtotal rows
    if (isSubtotalRow(campaignName)) {
      continue;
    }
    
    // Parse values based on actual column positions:
    // Column indices (0-based):
    // 1: Campaign name
    // 2: Reach (current), 3: Reach (comp), 4: Reach change %
    // 5: Frequency (current), 6: Frequency (comp), 7: Frequency change %
    // 8: Result type
    // 9: Results/Conversions (current), 10: Results (comp), 11: Results change %
    // 12: Result rate (current), 13: Result rate (comp), 14: Result rate change %
    // 15: Cost per result (current), 16: Cost per result (comp), 17: Cost per result change %
    // 18: Spend (current), 19: Spend (comp), 20: Spend change %
    // 21: CPM (current), 22: CPM (comp), 23: CPM change %
    // 24: Link clicks (current), 25: Link clicks (comp), 26: Link clicks change %
    // 27: CTR (current), 28: CTR (comp), 29: CTR change %
    
    const clicks = parseNumber(row[24]);  // Clics en el enlace
    const clicksComp = parseNumber(row[25]);
    const clicksChange = parsePercentage(row[26]);
    
    const spend = parseNumber(row[18]);  // Importe gastado (CLP)
    const spendComp = parseNumber(row[19]);
    const spendChange = parsePercentage(row[20]);
    
    const conversions = parseNumber(row[9]);  // Resultados
    const conversionsComp = parseNumber(row[10]);
    const conversionsChange = parsePercentage(row[11]);
    
    const costPerResult = parseNumber(row[15]);  // Costo por resultado
    const costPerResultComp = parseNumber(row[16]);
    const costPerResultChange = parsePercentage(row[17]);
    
    const ctr = parsePercentage(row[27]);  // CTR
    const ctrComp = parsePercentage(row[28]);
    const ctrChange = parsePercentage(row[29]);
    
    const reach = parseNumber(row[2]);  // Alcance
    const reachComp = parseNumber(row[3]);
    const reachChange = parsePercentage(row[4]);
    
    // Calculate CPC from spend and clicks
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpcComp = clicksComp > 0 ? spendComp / clicksComp : 0;
    const cpcChange = cpcComp > 0 ? ((cpc - cpcComp) / cpcComp) * 100 : 0;
    
    // Determine business unit - CTF campaigns go to CaseTracking regardless of sheet mapping
    let actualBusinessUnit = mapping.businessUnit;
    if (campaignName.toUpperCase().includes('CTF') || campaignName.toUpperCase().includes('[CTF]')) {
      actualBusinessUnit = 'casetracking';
    }
    
    const campaign: CampaignData = {
      campaign: campaignName,
      campaignType: 'other', // Meta campaigns are categorized as 'other'
      clicks,
      clicksComparison: clicksComp,
      clicksChange,
      cpc,
      cpcComparison: cpcComp,
      cpcChange,
      conversions,
      conversionsComparison: conversionsComp,
      conversionsChange,
      costPerConversion: costPerResult,
      costPerConversionComparison: costPerResultComp,
      costPerConversionChange: costPerResultChange,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      conversionRateComparison: clicksComp > 0 ? (conversionsComp / clicksComp) * 100 : 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: actualBusinessUnit,
      platform: mapping.platform,
      subUnit: mapping.subUnit,
      detectedSubUnit: detectSubUnit(campaignName, mapping.subUnit),
      spend,
      spendComparison: spendComp,
      spendChange,
      ctr,
      ctrComparison: ctrComp,
      ctrChange,
      reach,
      reachComparison: reachComp,
      reachChange,
    };
    
    campaigns.push(campaign);
  }
  
  return { campaigns, dateRange };
}

/**
 * Parse sheet data based on format type
 */
function parseSheetData(rows: string[][], mapping: SheetMapping): { campaigns: CampaignData[], dateRange: string } {
  if (mapping.dataFormat === 'meta_ads') {
    return parseMetaAdsData(rows, mapping);
  }
  return parseGoogleAdsData(rows, mapping);
}

// USD to CLP exchange rate for LinkedIn data conversion
const USD_TO_CLP = 980;

/**
 * Get hardcoded LinkedIn campaigns data (all SUITE)
 * Data extracted from user-provided screenshot
 * Original values in USD, converted to CLP for consistency with other platforms
 */
function getLinkedInCampaigns(): CampaignData[] {
  return [
    {
      campaign: 'AG - LemonSuite - Website Conv (MX-CL)',
      campaignType: 'other',
      clicks: 29,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: Math.round(5.83 * USD_TO_CLP), // $5.83 USD -> CLP
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 1,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: Math.round(169.15 * USD_TO_CLP), // $169.15 USD -> CLP
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.59,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'linkedin',
      spend: Math.round(169.15 * USD_TO_CLP), // $169.15 USD -> CLP
      spendComparison: 0,
      ctr: 0.59,
    },
    {
      campaign: 'AG - LemonSuite - Videos - Website Conv (MX-CL)',
      campaignType: 'other',
      clicks: 18,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: Math.round(8.73 * USD_TO_CLP), // $8.73 USD -> CLP
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 1,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: Math.round(157.08 * USD_TO_CLP), // $157.08 USD -> CLP
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.48,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'linkedin',
      spend: Math.round(157.08 * USD_TO_CLP), // $157.08 USD -> CLP
      spendComparison: 0,
      ctr: 0.48,
    },
    {
      campaign: 'AG - LemonSuite - Legal Spotlight Colombia 2026',
      campaignType: 'other',
      clicks: 4,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: Math.round(27.14 * USD_TO_CLP), // $27.14 USD -> CLP
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.42,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'linkedin',
      spend: Math.round(108.56 * USD_TO_CLP), // $108.56 USD -> CLP
      spendComparison: 0,
      ctr: 0.42,
    },
    {
      campaign: 'AG - LemonSuite - Legal Spotlight Colombia 2026 (Videos)',
      campaignType: 'other',
      clicks: 6,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: Math.round(16.33 * USD_TO_CLP), // $16.33 USD -> CLP
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.43,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'linkedin',
      spend: Math.round(98.00 * USD_TO_CLP), // $98.00 USD -> CLP
      spendComparison: 0,
      ctr: 0.43,
    },
  ];
}

/**
 * Get hardcoded Bing campaigns data (divided by business unit)
 * Data extracted from user-provided screenshot
 * Business unit mapping based on campaign name patterns
 */
function getBingCampaigns(): CampaignData[] {
  return [
    // LemonFlow campaigns
    {
      campaign: '[MX][FLOW]Compliance',
      campaignType: 'search',
      clicks: 291,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 286.31,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 21,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 3968.33,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 6.95,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 19.45,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonflow',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 83314.87,
      spendComparison: 0,
    },
    {
      campaign: 'LIA [FLOW] [CL] COMPLIANCE',
      campaignType: 'search',
      clicks: 62,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 1211.21,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 1.10,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 29.50,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonflow',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 75094.81,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [FLOW] [CL] COMPLIANCE',
      campaignType: 'search',
      clicks: 2,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 579.97,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 2.50,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 14.86,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonflow',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 1159.94,
      spendComparison: 0,
    },
    // LemonSuite campaigns
    {
      campaign: 'SEARCH [SUITE] [Gestión Tiempo]',
      campaignType: 'search',
      clicks: 100,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 548.10,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 1.67,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 26.20,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 54809.53,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [SUITE] [MX] KEYWORDS',
      campaignType: 'search',
      clicks: 23,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 996.33,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 3.19,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 18.13,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 22915.70,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [SUITE] [CO] KEYWORDS',
      campaignType: 'search',
      clicks: 9,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 1291.87,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.75,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 2.80,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 11626.82,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [SUITE] [CL] KEYWORDS',
      campaignType: 'search',
      clicks: 0,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 0,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 8.00,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 0,
      spendComparison: 0,
    },
    {
      campaign: '[PE] [SOFTWARE ABOGADOS] [SEARH] [SUITE]',
      campaignType: 'search',
      clicks: 0,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 0,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 100.00,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'lemonsuite',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 0,
      spendComparison: 0,
    },
    // CaseTracking campaigns
    {
      campaign: '[SEARCH] [CT] [MX] KEYWORDS',
      campaignType: 'search',
      clicks: 42,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 470.37,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 1,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 19755.54,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.76,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 9.28,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 19755.54,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [CL] [CT] KEYWORDS',
      campaignType: 'search',
      clicks: 7,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 613.24,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.17,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 6.06,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 4292.70,
      spendComparison: 0,
    },
    // CaseTracking Enterprise campaigns
    {
      campaign: '[SEARCH] [CTE] [MX] KEYWORDS',
      campaignType: 'search',
      clicks: 20,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 435.21,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.81,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 5.92,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      subUnit: 'enterprise',
      detectedSubUnit: 'cte',
      spend: 8704.13,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH][CTE][PE]KEYWORDS',
      campaignType: 'search',
      clicks: 14,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 120.04,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0.51,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 1.74,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      subUnit: 'enterprise',
      detectedSubUnit: 'cte',
      spend: 1680.55,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [CTE] [MX] COMPETENCIA',
      campaignType: 'search',
      clicks: 1,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 36.53,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 2.08,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 2.13,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      subUnit: 'enterprise',
      detectedSubUnit: 'cte',
      spend: 36.53,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [CTF] [MX] COMPETENCIA',
      campaignType: 'search',
      clicks: 0,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 0,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      subUnit: 'firms',
      spend: 0,
      spendComparison: 0,
    },
    {
      campaign: '[SEARCH] [CL] COMPETENCIA',
      campaignType: 'search',
      clicks: 0,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 0,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      costPerConversionComparison: 0,
      costPerConversionChange: 0,
      conversionRate: 0,
      conversionRateComparison: 0,
      conversionRateChange: 0,
      impressionShare: 0,
      impressionShareComparison: 0,
      impressionShareChange: 0,
      businessUnit: 'casetracking',
      platform: 'bing',
      detectedSubUnit: undefined,
      spend: 0,
      spendComparison: 0,
    },
  ];
}

/**
 * Calculate aggregated metrics from a list of campaigns
 */
function calculateMetrics(campaigns: CampaignData[]): CampaignTypeMetrics {
  if (campaigns.length === 0) {
    return {
      clicks: 0,
      clicksComparison: 0,
      clicksChange: 0,
      cpc: 0,
      cpcComparison: 0,
      cpcChange: 0,
      conversions: 0,
      conversionsComparison: 0,
      conversionsChange: 0,
      costPerConversion: 0,
      conversionRate: 0,
      impressionShare: 0,
      spend: 0,
      spendComparison: 0,
      campaigns: [],
    };
  }
  
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalClicksComp = campaigns.reduce((sum, c) => sum + c.clicksComparison, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalConversionsComp = campaigns.reduce((sum, c) => sum + c.conversionsComparison, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || c.cpc * c.clicks), 0);
  const totalSpendComp = campaigns.reduce((sum, c) => sum + (c.spendComparison || c.cpcComparison * c.clicksComparison), 0);
  
  // Calculate weighted averages for CPC
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpcComp = totalClicksComp > 0 ? totalSpendComp / totalClicksComp : 0;
  
  // Calculate changes
  const clicksChange = totalClicksComp > 0 ? ((totalClicks - totalClicksComp) / totalClicksComp) * 100 : 0;
  const cpcChange = avgCpcComp > 0 ? ((avgCpc - avgCpcComp) / avgCpcComp) * 100 : 0;
  const conversionsChange = totalConversionsComp > 0 ? ((totalConversions - totalConversionsComp) / totalConversionsComp) * 100 : 0;
  
  // Calculate rates
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;
  
  // Calculate average impression share (only for campaigns that have it)
  const campaignsWithImprShare = campaigns.filter(c => c.impressionShare > 0);
  const avgImpressionShare = campaignsWithImprShare.length > 0
    ? campaignsWithImprShare.reduce((sum, c) => sum + c.impressionShare, 0) / campaignsWithImprShare.length
    : 0;
  
  return {
    clicks: totalClicks,
    clicksComparison: totalClicksComp,
    clicksChange,
    cpc: avgCpc,
    cpcComparison: avgCpcComp,
    cpcChange,
    conversions: totalConversions,
    conversionsComparison: totalConversionsComp,
    conversionsChange,
    costPerConversion,
    conversionRate,
    impressionShare: avgImpressionShare,
    spend: totalSpend,
    spendComparison: totalSpendComp,
    campaigns,
  };
}

/**
 * Fetch all sheet data and aggregate
 */
export async function fetchAllSheetData(): Promise<{
  campaigns: CampaignData[];
  dateRange: string;
  byBusinessUnit: Record<string, CampaignData[]>;
  byPlatform: Record<string, CampaignData[]>;
  byCampaignType: Record<CampaignType, CampaignData[]>;
  totals: CampaignTypeMetrics;
}> {
  const allCampaigns: CampaignData[] = [];
  const byBusinessUnit: Record<string, CampaignData[]> = {};
  const byPlatform: Record<string, CampaignData[]> = {};
  const byCampaignType: Record<CampaignType, CampaignData[]> = {
    pmax: [],
    search: [],
    other: [],
  };
  const totals = calculateMetrics([]);
  let dateRange = '';
  
  // Fetch data from Google Sheets
  for (const mapping of SHEET_MAPPINGS) {
    try {
      const rows = await fetchSheetTab(mapping.sheetName);
      const { campaigns, dateRange: sheetDateRange } = parseSheetData(rows, mapping);
      
      if (!dateRange && sheetDateRange) {
        dateRange = sheetDateRange;
      }
      
      allCampaigns.push(...campaigns);
      
      // Group by business unit
      if (!byBusinessUnit[mapping.businessUnit]) {
        byBusinessUnit[mapping.businessUnit] = [];
      }
      byBusinessUnit[mapping.businessUnit].push(...campaigns);
      
      // Group by platform
      if (!byPlatform[mapping.platform]) {
        byPlatform[mapping.platform] = [];
      }
      byPlatform[mapping.platform].push(...campaigns);
      
      // Group by campaign type
      for (const campaign of campaigns) {
        byCampaignType[campaign.campaignType].push(campaign);
      }
      
    } catch (error) {
      console.error(`Error processing sheet ${mapping.sheetName}:`, error);
    }
  }
  
  // Add hardcoded LinkedIn campaigns
  const linkedInCampaigns = getLinkedInCampaigns();
  allCampaigns.push(...linkedInCampaigns);
  
  // Group LinkedIn by business unit
  for (const campaign of linkedInCampaigns) {
    if (!byBusinessUnit[campaign.businessUnit]) {
      byBusinessUnit[campaign.businessUnit] = [];
    }
    byBusinessUnit[campaign.businessUnit].push(campaign);
    
    if (!byPlatform['linkedin']) {
      byPlatform['linkedin'] = [];
    }
    byPlatform['linkedin'].push(campaign);
    
    byCampaignType[campaign.campaignType].push(campaign);
  }
  
  // Add hardcoded Bing campaigns
  const bingCampaigns = getBingCampaigns();
  allCampaigns.push(...bingCampaigns);
  
  // Group Bing by business unit
  for (const campaign of bingCampaigns) {
    if (!byBusinessUnit[campaign.businessUnit]) {
      byBusinessUnit[campaign.businessUnit] = [];
    }
    byBusinessUnit[campaign.businessUnit].push(campaign);
    
    if (!byPlatform['bing']) {
      byPlatform['bing'] = [];
    }
    byPlatform['bing'].push(campaign);
    
    byCampaignType[campaign.campaignType].push(campaign);
  }
  
  return {
    campaigns: allCampaigns,
    dateRange,
    byBusinessUnit,
    byPlatform,
    byCampaignType,
    totals,
  };
}

/**
 * Get aggregated metrics for a specific business unit and/or platform
 * Now includes breakdown by campaign type (PMax vs Search vs Other)
 */
export async function getAggregatedMetrics(
  businessUnit?: string,
  platform?: string
): Promise<{
  clicks: number;
  clicksChange: number;
  cpc: number;
  cpcChange: number;
  conversions: number;
  conversionsChange: number;
  costPerConversion: number;
  conversionRate: number;
  impressionShare: number;
  spend: number;
  campaigns: CampaignData[];
  dateRange: string;
  // Breakdown by campaign type
  byType: {
    pmax: CampaignTypeMetrics;
    search: CampaignTypeMetrics;
    other: CampaignTypeMetrics;
  };
  // Breakdown by campaign type AND platform
  byTypeAndPlatform: {
    searchGoogle: CampaignTypeMetrics;
    searchBing: CampaignTypeMetrics;
    pmaxGoogle: CampaignTypeMetrics;
    metaLinkedin: CampaignTypeMetrics;
  };
  // Breakdown by sub-unit (CTF vs CTE) for CaseTracking
  bySubUnit?: {
    ctf: CampaignTypeMetrics;
    cte: CampaignTypeMetrics;
  };
}> {
  const data = await fetchAllSheetData();
  
  let campaigns = data.campaigns;
  
  // Filter by business unit
  if (businessUnit && businessUnit !== 'all') {
    campaigns = campaigns.filter(c => c.businessUnit === businessUnit);
  }
  
  // Filter by platform
  if (platform && platform !== 'all') {
    campaigns = campaigns.filter(c => c.platform === platform);
  }
  
  // Calculate total metrics
  const totalMetrics = calculateMetrics(campaigns);
  
  // Calculate metrics by campaign type
  const pmaxCampaigns = campaigns.filter(c => c.campaignType === 'pmax');
  const searchCampaigns = campaigns.filter(c => c.campaignType === 'search');
  const otherCampaigns = campaigns.filter(c => c.campaignType === 'other');
  
  // Calculate metrics by campaign type AND platform
  const searchGoogleCampaigns = campaigns.filter(c => c.campaignType === 'search' && c.platform === 'google');
  const searchBingCampaigns = campaigns.filter(c => c.campaignType === 'search' && c.platform === 'bing');
  const pmaxGoogleCampaigns = campaigns.filter(c => c.campaignType === 'pmax' && c.platform === 'google');
  const metaLinkedinCampaigns = campaigns.filter(c => c.platform === 'meta' || c.platform === 'linkedin');
  
  // Calculate metrics by sub-unit (CTF vs CTE) for CaseTracking
  const ctfCampaigns = campaigns.filter(c => c.detectedSubUnit === 'ctf');
  const cteCampaigns = campaigns.filter(c => c.detectedSubUnit === 'cte');
  
  return {
    clicks: totalMetrics.clicks,
    clicksChange: totalMetrics.clicksChange,
    cpc: totalMetrics.cpc,
    cpcChange: totalMetrics.cpcChange,
    conversions: totalMetrics.conversions,
    conversionsChange: totalMetrics.conversionsChange,
    costPerConversion: totalMetrics.costPerConversion,
    conversionRate: totalMetrics.conversionRate,
    impressionShare: totalMetrics.impressionShare,
    spend: totalMetrics.spend,
    campaigns,
    dateRange: data.dateRange,
    byType: {
      pmax: calculateMetrics(pmaxCampaigns),
      search: calculateMetrics(searchCampaigns),
      other: calculateMetrics(otherCampaigns),
    },
    byTypeAndPlatform: {
      searchGoogle: calculateMetrics(searchGoogleCampaigns),
      searchBing: calculateMetrics(searchBingCampaigns),
      pmaxGoogle: calculateMetrics(pmaxGoogleCampaigns),
      metaLinkedin: calculateMetrics(metaLinkedinCampaigns),
    },
    // Only include bySubUnit for CaseTracking business unit
    bySubUnit: businessUnit === 'casetracking' ? {
      ctf: calculateMetrics(ctfCampaigns),
      cte: calculateMetrics(cteCampaigns),
    } : undefined,
  };
}

/**
 * Get time series data (aggregated by date if available, otherwise by campaign)
 */
export async function getTimeSeriesData(
  businessUnit?: string,
  platform?: string
): Promise<{
  labels: string[];
  clicks: number[];
  conversions: number[];
  spend: number[];
}> {
  const metrics = await getAggregatedMetrics(businessUnit, platform);
  
  // Since the sheet doesn't have daily data, we'll return campaign-level data
  const labels = metrics.campaigns.map(c => c.campaign.substring(0, 20));
  const clicks = metrics.campaigns.map(c => c.clicks);
  const conversions = metrics.campaigns.map(c => c.conversions);
  const spend = metrics.campaigns.map(c => c.spend || c.cpc * c.clicks);
  
  return { labels, clicks, conversions, spend };
}


// Calendar Sheet configuration
const CALENDAR_SHEET_ID = '1eGaK3X25D9iyO6uALiJXMKwmLwv8cKnakG5H-ifLy5Y';
const CALENDAR_SHEET_GID = '650669931';

export interface CalendarAction {
  id: string;
  title: string;
  notes: string;
  status: 'hecho' | 'por_hacer' | 'en_proceso' | 'en_revision' | 'reunion_cliente' | 'pending';
  businessUnit?: 'lemonsuite' | 'casetracking' | 'lemonflow' | 'all';
  week?: string;
}

/**
 * Map status from Spanish to normalized values
 */
function normalizeStatus(status: string): CalendarAction['status'] {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'hecho') return 'hecho';
  if (normalized === 'por hacer') return 'por_hacer';
  if (normalized.includes('en proceso')) return 'en_proceso';
  if (normalized.includes('en revisión') || normalized.includes('en revision')) return 'en_revision';
  if (normalized.includes('reunión') || normalized.includes('reunion')) return 'reunion_cliente';
  return 'pending';
}

/**
 * Detect business unit from task title
 */
function detectBusinessUnitFromTitle(title: string): CalendarAction['businessUnit'] {
  const upperTitle = title.toUpperCase();
  if (upperTitle.includes('SUITE') || upperTitle.includes('LEMONSUITE')) return 'lemonsuite';
  if (upperTitle.includes('CT') || upperTitle.includes('CTE') || upperTitle.includes('CTF') || upperTitle.includes('CASETRACKING')) return 'casetracking';
  if (upperTitle.includes('FLOW') || upperTitle.includes('LEMONFLOW')) return 'lemonflow';
  if (upperTitle.includes('ALL')) return 'all';
  return 'all';
}

/**
 * Fetch calendar/timeline data from the Cronograma de Entregables sheet
 */
export async function fetchCalendarData(): Promise<CalendarAction[]> {
  const url = `https://docs.google.com/spreadsheets/d/${CALENDAR_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${CALENDAR_SHEET_GID}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch calendar sheet:', response.status);
      return [];
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 5) return [];
    
    const actions: CalendarAction[] = [];
    
    // Parse data rows (starting from row 5, index 4 - after headers)
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1] || row[1].trim() === '') continue;
      
      const title = row[1].trim();
      
      // Skip section headers and empty titles
      if (title === 'General' || title === 'Reportes' || title === 'Creativos / Copy' || 
          title === 'Landing Pages' || title === 'Pending' || title === 'Cronograma de Entregables') {
        continue;
      }
      
      const notes = row[3]?.trim() || '';
      
      // Find the latest status from the week columns (columns 7+)
      let latestStatus = 'pending';
      let latestWeek = '';
      
      // Scan columns for status values
      for (let j = 7; j < row.length; j++) {
        const cellValue = row[j]?.trim();
        if (cellValue && cellValue !== '') {
          latestStatus = cellValue;
          // Determine week from column position
          const weekIndex = Math.floor((j - 7) / 5);
          latestWeek = `Semana ${weekIndex + 1}`;
        }
      }
      
      const action: CalendarAction = {
        id: `cal-${i}`,
        title,
        notes,
        status: normalizeStatus(latestStatus),
        businessUnit: detectBusinessUnitFromTitle(title),
        week: latestWeek,
      };
      
      actions.push(action);
    }
    
    return actions;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return [];
  }
}

// ============ MULTI-TENANT FUNCTIONS ============

/**
 * Fetch sheet tab data for a specific organization
 * Uses the organization's googleSheetId instead of the hardcoded SHEET_ID
 */
async function fetchSheetTabForOrganization(
  sheetId: string,
  tabName: string
): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch sheet tab ${tabName}:`, response.status);
      return [];
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching sheet tab ${tabName}:`, error);
    return [];
  }
}

/**
 * Fetch all sheet data for a specific organization
 */
export async function fetchSheetDataForOrganization(organizationId: number): Promise<{
  campaigns: CampaignData[];
  dateRange: string;
  byFunnel: Record<string, CampaignData[]>;
  byPlatform: Record<string, CampaignData[]>;
  byCampaignType: Record<CampaignType, CampaignData[]>;
  totals: CampaignTypeMetrics;
} | null> {
  try {
    const { getOrganization, getFunnelsByOrganization } = await import('../db');

    const organization = await getOrganization(organizationId);
    if (!organization || !organization.googleSheetId) {
      console.error(`Organization ${organizationId} not found or has no Google Sheet configured`);
      return null;
    }

    const funnels = await getFunnelsByOrganization(organizationId);
    if (funnels.length === 0) {
      console.warn(`No active funnels found for organization ${organizationId}`);
      return {
        campaigns: [],
        dateRange: '',
        byFunnel: {},
        byPlatform: {},
        byCampaignType: { pmax: [], search: [], other: [] },
        totals: calculateMetrics([]),
      };
    }

    const allCampaigns: CampaignData[] = [];
    const byFunnel: Record<string, CampaignData[]> = {};
    const byPlatform: Record<string, CampaignData[]> = {};
    const byCampaignType: Record<CampaignType, CampaignData[]> = {
      pmax: [],
      search: [],
      other: [],
    };
    let dateRange = '';

    // Fetch data from each funnel
    for (const funnel of funnels) {
      try {
        const rows = await fetchSheetTabForOrganization(organization.googleSheetId, funnel.sheetTabName);

        // Create a temporary mapping for parseSheetData
        const mapping: SheetMapping = {
          sheetName: funnel.sheetTabName,
          businessUnit: 'lemonsuite' as any, // Will be replaced by funnel name
          platform: funnel.platform as any,
          dataFormat: (funnel.platform === 'meta_ads' ? 'meta_ads' : 'google_ads') as any,
        };

        const { campaigns, dateRange: sheetDateRange } = parseSheetData(rows, mapping);

        if (!dateRange && sheetDateRange) {
          dateRange = sheetDateRange;
        }

        // Override businessUnit with funnel name
        const funnelCampaigns = campaigns.map(c => ({
          ...c,
          businessUnit: funnel.name,
          platform: funnel.platform,
        }));

        allCampaigns.push(...funnelCampaigns);

        // Group by funnel
        if (!byFunnel[funnel.name]) {
          byFunnel[funnel.name] = [];
        }
        byFunnel[funnel.name].push(...funnelCampaigns);

        // Group by platform
        if (!byPlatform[funnel.platform]) {
          byPlatform[funnel.platform] = [];
        }
        byPlatform[funnel.platform].push(...funnelCampaigns);

        // Group by campaign type
        for (const campaign of funnelCampaigns) {
          byCampaignType[campaign.campaignType].push(campaign);
        }

      } catch (error) {
        console.error(`Error processing funnel ${funnel.name}:`, error);
      }
    }

    return {
      campaigns: allCampaigns,
      dateRange,
      byFunnel,
      byPlatform,
      byCampaignType,
      totals: calculateMetrics(allCampaigns),
    };
  } catch (error) {
    console.error(`Error fetching sheet data for organization ${organizationId}:`, error);
    return null;
  }
}

/**
 * Get aggregated metrics for a specific organization and optional funnel
 */
export async function getAggregatedMetricsForOrganization(
  organizationId: number,
  funnelName?: string,
  platform?: string
): Promise<{
  clicks: number;
  clicksChange: number;
  cpc: number;
  cpcChange: number;
  conversions: number;
  conversionsChange: number;
  costPerConversion: number;
  conversionRate: number;
  impressionShare: number;
  spend: number;
  spendChange: number;
  campaigns: CampaignData[];
  byPlatform: Record<string, CampaignTypeMetrics>;
  byCampaignType: Record<CampaignType, CampaignTypeMetrics>;
  dateRange: string;
} | null> {
  const data = await fetchSheetDataForOrganization(organizationId);
  if (!data) {
    return null;
  }

  let filteredCampaigns = data.campaigns;

  // Filter by funnel if specified
  if (funnelName) {
    filteredCampaigns = data.byFunnel[funnelName] || [];
  }

  // Filter by platform if specified
  if (platform) {
    filteredCampaigns = filteredCampaigns.filter(c => c.platform === platform);
  }

  const totals = calculateMetrics(filteredCampaigns);

  // Calculate by platform
  const byPlatform: Record<string, CampaignTypeMetrics> = {};
  for (const [platformKey, campaigns] of Object.entries(data.byPlatform)) {
    let platformCampaigns = campaigns;
    if (funnelName) {
      platformCampaigns = campaigns.filter(c => c.businessUnit === funnelName);
    }
    byPlatform[platformKey] = calculateMetrics(platformCampaigns);
  }

  // Calculate by campaign type
  const byCampaignType: Record<CampaignType, CampaignTypeMetrics> = {
    pmax: calculateMetrics(filteredCampaigns.filter(c => c.campaignType === 'pmax')),
    search: calculateMetrics(filteredCampaigns.filter(c => c.campaignType === 'search')),
    other: calculateMetrics(filteredCampaigns.filter(c => c.campaignType === 'other')),
  };

  return {
    ...totals,
    campaigns: filteredCampaigns,
    byPlatform,
    byCampaignType,
    dateRange: data.dateRange,
  };
}
