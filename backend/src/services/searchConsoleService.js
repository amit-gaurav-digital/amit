const axios = require('axios');
const SearchConsoleData = require('../models/SearchConsoleData');

class SearchConsoleService {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/webmasters/v3';
  }

  async getSites(accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sites`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data.siteEntry || [];
    } catch (error) {
      throw new Error(`Failed to fetch sites: ${error.message}`);
    }
  }

  async fetchSearchAnalytics(accessToken, siteUrl, startDate, endDate, dimensions = ['query']) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions,
          rowLimit: 10000
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data.rows || [];
    } catch (error) {
      throw new Error(`Failed to fetch search analytics: ${error.message}`);
    }
  }

  async fetchUrlInspection(accessToken, siteUrl, url) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/urlInspection/index:inspect`,
        {
          inspectionUrl: url,
          siteUrl
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error('URL inspection error:', error.message);
      return null;
    }
  }

  async fetchCoverage(accessToken, siteUrl) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data.sitemap || [];
    } catch (error) {
      console.error('Coverage fetch error:', error.message);
      return [];
    }
  }

  async syncData(siteUrl, accessToken, blogId, clientId) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [queryData, pageData, countryData, deviceData, searchTypeData] = await Promise.all([
        this.fetchSearchAnalytics(accessToken, siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['query']),
        this.fetchSearchAnalytics(accessToken, siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['page']),
        this.fetchSearchAnalytics(accessToken, siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['country']),
        this.fetchSearchAnalytics(accessToken, siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['device']),
        this.fetchSearchAnalytics(accessToken, siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['searchType'])
      ]);

      const summary = this.aggregateSummary(queryData);
      const parsedQueries = this.parseQueries(queryData);
      const parsedPages = this.parsePages(pageData);
      const parsedCountries = this.parseCountries(countryData);
      const parsedDevices = this.parseDevices(deviceData);
      const parsedSearchTypes = this.parseSearchTypes(searchTypeData);

      await SearchConsoleData.updateOne(
        { blogId, date: new Date().toISOString().split('T')[0] },
        {
          $set: {
            clientId,
            siteUrl,
            date: new Date(),
            summary,
            queries: parsedQueries,
            pages: parsedPages,
            countries: parsedCountries,
            devices: parsedDevices,
            searchType: parsedSearchTypes,
            syncStatus: { syncedAt: new Date() }
          }
        },
        { upsert: true }
      );

      return { success: true, syncedAt: new Date(), recordsProcessed: queryData.length };
    } catch (error) {
      console.error('Sync failed:', error.message);
      throw error;
    }
  }

  aggregateSummary(rows) {
    let totalClicks = 0;
    let totalImpressions = 0;
    let ctrSum = 0;
    let positionSum = 0;

    rows.forEach(row => {
      totalClicks += row.clicks || 0;
      totalImpressions += row.impressions || 0;
      ctrSum += (row.ctr || 0) * (row.impressions || 1);
      positionSum += (row.position || 0) * (row.impressions || 1);
    });

    return {
      totalClicks,
      totalImpressions,
      averageCTR: totalImpressions > 0 ? (ctrSum / totalImpressions * 100).toFixed(2) : 0,
      averagePosition: totalImpressions > 0 ? (positionSum / totalImpressions).toFixed(2) : 0,
      totalQueries: rows.length
    };
  }

  parseQueries(rows) {
    return rows.slice(0, 100).map(row => ({
      query: row.keys?.[0] || 'Unknown',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position?.toFixed(2) || 0
    }));
  }

  parsePages(rows) {
    return rows.slice(0, 100).map(row => ({
      page: row.keys?.[0] || 'Unknown',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position?.toFixed(2) || 0
    }));
  }

  parseCountries(rows) {
    return rows.map(row => ({
      country: row.keys?.[0] || 'Unknown',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr * 100).toFixed(2),
      position: row.position?.toFixed(2) || 0
    }));
  }

  parseDevices(rows) {
    const devices = {
      mobile: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      desktop: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      tablet: { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    };

    rows.forEach(row => {
      const device = row.keys?.[0]?.toLowerCase() || 'desktop';
      if (devices[device]) {
        devices[device] = {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position?.toFixed(2) || 0
        };
      }
    });

    return devices;
  }

  parseSearchTypes(rows) {
    const types = {
      web: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      image: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      video: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      news: { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    };

    rows.forEach(row => {
      const type = row.keys?.[0]?.toLowerCase() || 'web';
      if (types[type]) {
        types[type] = {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position?.toFixed(2) || 0
        };
      }
    });

    return types;
  }
}

module.exports = new SearchConsoleService();
