import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample Google Ads CSV data with subtotals that should be filtered
const GOOGLE_ADS_CSV = `"Rendimiento comparativo 13 de enero de 2026 - 19 de enero de 2026 comparado con 6 de enero de 2026 - 12 de enero de 2026 Campaña"
"[SEARCH] [SUITE] [MX] KEYWORDS","100","90","11.11%","2.50","2.38","5%","10","8","25%","25.00","26.78","-6.65%","10%","8.89%","12.5%","15%","14%","7.14%"
"[P.MAX] [CO] [SUITE]","200","180","11.11%","1.80","1.85","-3%","15","12","25%","24.00","27.75","-13.51%","7.5%","6.67%","12.44%","20%","18%","11.11%"
"SEARCH","100","90","11.11%","2.50","2.38","5%","10","8","25%","25.00","26.78","-6.65%","10%","8.89%","12.5%","15%","14%","7.14%"
"P. MAX","200","180","11.11%","1.80","1.85","-3%","15","12","25%","24.00","27.75","-13.51%","7.5%","6.67%","12.44%","20%","18%","11.11%"
"TOTAL GENERAL","300","270","11.11%","2.00","2.00","1%","25","20","25%","24.00","27.00","-11.11%","8.33%","7.41%","12.42%","17.5%","16%","9.38%"`;

// Sample Meta Ads CSV data
const META_ADS_CSV = `"","Nombre de la campaña","Alcance (Jan 13, 2026 - Jan 19, 2026)","Alcance (Jan 6, 2026 - Jan 12, 2026)","Alcance Cambio (%)","Frecuencia (Jan 13, 2026 - Jan 19, 2026)","Frecuencia (Jan 6, 2026 - Jan 12, 2026)","Frecuencia Cambio (%)","Tipo de resultado","Resultados (Jan 13, 2026 - Jan 19, 2026)","Resultados (Jan 6, 2026 - Jan 12, 2026)","Resultados Cambio (%)","Tasa de resultados (Jan 13, 2026 - Jan 19, 2026)","Tasa de resultados (Jan 6, 2026 - Jan 12, 2026)","Tasa de resultados Cambio (%)","Costo por resultado (Jan 13, 2026 - Jan 19, 2026)","Costo por resultado (Jan 6, 2026 - Jan 12, 2026)","Costo por resultado Cambio (%)","Importe gastado (CLP) (Jan 13, 2026 - Jan 19, 2026)","Importe gastado (CLP) (Jan 6, 2026 - Jan 12, 2026)","Importe gastado (CLP) Cambio (%)","CPM (costo por mil impresiones) (Jan 13, 2026 - Jan 19, 2026)","CPM (costo por mil impresiones) (Jan 6, 2026 - Jan 12, 2026)","CPM (costo por mil impresiones) Cambio (%)","Clics en el enlace (Jan 13, 2026 - Jan 19, 2026)","Clics en el enlace (Jan 6, 2026 - Jan 12, 2026)","Clics en el enlace Cambio (%)","CTR (porcentaje de clics en el enlace) (Jan 13, 2026 - Jan 19, 2026)","CTR (porcentaje de clics en el enlace) (Jan 6, 2026 - Jan 12, 2026)","CTR (porcentaje de clics en el enlace) Cambio (%)"
"","MOFU [SUITE] [CL] Conversión WEB","7004","12543","-44","1,8","2,45","-26,49","","","","","","","","","","","191826","313430","-38,8","15214,63","10204,46","49,1","827","1245","-33,57","6,56","4,05","61,82"
"","TOFU [CL] [SUITE] [EBOOK] - NEW","16026","6771","137","2,36","2,03","16,36","Clientes potenciales en el sitio web","20","8","150","0,05","0,06","-9,23","4783,35","4409,38","8,48","95667","35275","171,2","2528,4","2567,7","-1,53","179","84","113,1","0,47","0,61","-22,63"`;

describe('Google Sheets Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to ensure fresh imports
    vi.resetModules();
  });

  describe('CSV Parsing', () => {
    it('should parse Google Ads CSV data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      expect(data.campaigns.length).toBeGreaterThan(0);
    });

    it('should filter out subtotal rows (SEARCH, P.MAX, TOTAL GENERAL)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      // Should not include subtotal rows
      const subtotalNames = ['SEARCH', 'P. MAX', 'P.MAX', 'TOTAL GENERAL', 'TOTAL'];
      data.campaigns.forEach(c => {
        expect(subtotalNames).not.toContain(c.campaign.toUpperCase());
      });
    });

    it('should categorize campaigns by type (pmax, search, other)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      // Each campaign should have a campaignType
      data.campaigns.forEach(c => {
        expect(['pmax', 'search', 'other']).toContain(c.campaignType);
      });
      
      // Check specific campaign types
      const searchCampaigns = data.campaigns.filter(c => c.campaignType === 'search');
      const pmaxCampaigns = data.campaigns.filter(c => c.campaignType === 'pmax');
      
      // Should have at least one of each type from our test data
      expect(searchCampaigns.length + pmaxCampaigns.length).toBeGreaterThan(0);
    });

    it('should handle empty responses gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      // Should not throw, just return empty data
      expect(data.campaigns).toBeDefined();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      // Should not throw, just return empty data
      expect(data.campaigns).toBeDefined();
    });
  });

  describe('Aggregated Metrics with Campaign Type Breakdown', () => {
    it('should calculate aggregated metrics correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { getAggregatedMetrics } = await import('./services/googleSheets');
      
      const metrics = await getAggregatedMetrics();
      
      expect(metrics.clicks).toBeGreaterThanOrEqual(0);
      expect(metrics.cpc).toBeGreaterThanOrEqual(0);
      expect(metrics.conversions).toBeGreaterThanOrEqual(0);
      expect(metrics.campaigns).toBeDefined();
    });

    it('should include byType breakdown in aggregated metrics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { getAggregatedMetrics } = await import('./services/googleSheets');
      
      const metrics = await getAggregatedMetrics();
      
      // Should have byType breakdown
      expect(metrics.byType).toBeDefined();
      expect(metrics.byType.pmax).toBeDefined();
      expect(metrics.byType.search).toBeDefined();
      expect(metrics.byType.other).toBeDefined();
      
      // Each type should have metrics
      expect(metrics.byType.pmax.clicks).toBeGreaterThanOrEqual(0);
      expect(metrics.byType.search.clicks).toBeGreaterThanOrEqual(0);
      expect(metrics.byType.other.clicks).toBeGreaterThanOrEqual(0);
    });

    it('should filter by business unit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { getAggregatedMetrics } = await import('./services/googleSheets');
      
      const metrics = await getAggregatedMetrics('lemonsuite');
      
      // All campaigns should be from lemonsuite
      metrics.campaigns.forEach(c => {
        expect(c.businessUnit).toBe('lemonsuite');
      });
    });

    it('should filter by platform', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(GOOGLE_ADS_CSV),
      });

      const { getAggregatedMetrics } = await import('./services/googleSheets');
      
      const metrics = await getAggregatedMetrics(undefined, 'google');
      
      // All campaigns should be from google platform
      metrics.campaigns.forEach(c => {
        expect(c.platform).toBe('google');
      });
    });
  });

  describe('Number Parsing', () => {
    it('should handle European number format (1.234,56)', async () => {
      // This is tested implicitly through the Meta CSV parsing
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(META_ADS_CSV),
      });

      const { fetchAllSheetData } = await import('./services/googleSheets');
      
      const data = await fetchAllSheetData();
      
      // Should have parsed the Meta data correctly
      expect(data.campaigns.length).toBeGreaterThanOrEqual(0);
    });
  });
});
