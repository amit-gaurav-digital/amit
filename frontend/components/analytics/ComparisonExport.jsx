'use client';

import { useState } from 'react';

export default function ComparisonExport({ blogs, analyticsData, dateRange }) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const generateCSVReport = () => {
    let csv = 'Blog Comparison Report\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Period: Last ${dateRange} Days\n`;
    csv += `Blogs Compared: ${blogs.length}\n\n`;

    // Summary Section
    csv += '=== SUMMARY ===\n';
    csv += 'Blog Name,URL,Total Views,Total Visitors,Avg Engagement %,Bounce Rate %,Sessions,Avg Duration\n';

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      csv += `"${blog.title.replace(/"/g, '""')}","${blog.url.replace(/"/g, '""')}`,`;
      csv += `${data?.totalViews || 0},`;
      csv += `${data?.totalVisitors || 0},`;
      csv += `"${(data?.avgEngagementScore || 0).toFixed(1)}",`;
      csv += `"${(data?.avgBounceRate || 0).toFixed(1)}",`;
      csv += `${data?.sessionsAnalysis?.totalSessions || 0},`;
      csv += `"${Math.floor(data?.sessionsAnalysis?.avgDuration || 0)}s"\n`;
    });

    // Performance Metrics Section
    csv += '\n=== PERFORMANCE METRICS ===\n';
    csv += 'Blog Name,Page Load Time (ms),FCP (ms),LCP (ms)\n';

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      csv += `"${blog.title.replace(/"/g, '""')}",`;
      csv += `${(data?.performanceMetrics?.avgPageLoadTime || 0).toFixed(0)},`;
      csv += `${(data?.performanceMetrics?.avgFCP || 0).toFixed(0)},`;
      csv += `${(data?.performanceMetrics?.avgLCP || 0).toFixed(0)}\n`;
    });

    // Top Pages Section
    csv += '\n=== TOP PAGES ===\n';
    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      csv += `\n${blog.title}:\n`;
      csv += 'Page URL,Events\n';

      if (data?.topPages && data.topPages.length > 0) {
        data.topPages.slice(0, 5).forEach(page => {
          csv += `"${page.url?.replace(/"/g, '""') || 'N/A'}",${page.totalEvents || 0}\n`;
        });
      }
    });

    // Traffic Sources Section
    csv += '\n=== TRAFFIC SOURCES ===\n';
    csv += 'Blog Name,Source,Users,Sessions,Bounce Rate %\n';

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      if (data?.channels) {
        Object.entries(data.channels).forEach(([source, metrics]) => {
          csv += `"${blog.title.replace(/"/g, '""')}",${source},${metrics.users || 0},${metrics.sessions || 0},"${(metrics.bounceRate || 0).toFixed(1)}"\n`;
        });
      }
    });

    return csv;
  };

  const generateHTMLReport = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Blog Comparison Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              margin: 40px;
              color: #1f2937;
              background-color: #f9fafb;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            h1 {
              color: #1f2937;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 10px;
            }
            h2 {
              color: #374151;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #3b82f6;
              padding-left: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover {
              background-color: #f9fafb;
            }
            .blog-card {
              display: inline-block;
              margin: 10px 0;
              padding: 15px;
              background-color: #f9fafb;
              border-left: 4px solid;
              border-radius: 4px;
              margin-right: 20px;
            }
            .metric {
              display: inline-block;
              margin-right: 20px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .metric-label {
              font-size: 12px;
              color: #6b7280;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Blog Comparison Report</h1>
            <p>Generated: ${new Date().toLocaleDateString()} | Period: Last ${dateRange} Days | Blogs: ${blogs.length}</p>

            <h2>Summary Overview</h2>
            <table>
              <thead>
                <tr>
                  <th>Blog</th>
                  <th>Views</th>
                  <th>Visitors</th>
                  <th>Engagement %</th>
                  <th>Bounce Rate %</th>
                </tr>
              </thead>
              <tbody>
    `;

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      html += `
        <tr>
          <td><strong>${blog.title}</strong></td>
          <td>${(data?.totalViews || 0).toLocaleString()}</td>
          <td>${(data?.totalVisitors || 0).toLocaleString()}</td>
          <td>${(data?.avgEngagementScore || 0).toFixed(1)}%</td>
          <td>${(data?.avgBounceRate || 0).toFixed(1)}%</td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>

            <h2>Detailed Blog Analysis</h2>
    `;

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      html += `
        <div class="blog-card" style="border-color: ${colors[idx % 5]}">
          <h3>${blog.title}</h3>
          <p><em>${blog.url}</em></p>
          <div class="metric">
            <div class="metric-label">Total Views</div>
            <div class="metric-value">${(data?.totalViews || 0).toLocaleString()}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Visitors</div>
            <div class="metric-value">${(data?.totalVisitors || 0).toLocaleString()}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Sessions</div>
            <div class="metric-value">${(data?.sessionsAnalysis?.totalSessions || 0).toLocaleString()}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Avg Duration</div>
            <div class="metric-value">${Math.floor(data?.sessionsAnalysis?.avgDuration || 0)}s</div>
          </div>
        </div>
      `;
    });

    html += `
            <h2>Performance Metrics</h2>
            <table>
              <thead>
                <tr>
                  <th>Blog</th>
                  <th>Page Load (ms)</th>
                  <th>FCP (ms)</th>
                  <th>LCP (ms)</th>
                </tr>
              </thead>
              <tbody>
    `;

    blogs.forEach((blog, idx) => {
      const data = analyticsData[idx];
      html += `
        <tr>
          <td><strong>${blog.title}</strong></td>
          <td>${(data?.performanceMetrics?.avgPageLoadTime || 0).toFixed(0)}</td>
          <td>${(data?.performanceMetrics?.avgFCP || 0).toFixed(0)}</td>
          <td>${(data?.performanceMetrics?.avgLCP || 0).toFixed(0)}</td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>

            <div class="footer">
              <p>This report compares analytics data for ${blogs.length} blogs over the last ${dateRange} days.</p>
              <p>For more details, visit the analytics dashboard.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      if (exportFormat === 'csv') {
        const csv = generateCSVReport();
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `blog-comparison-${new Date().getTime()}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else if (exportFormat === 'html') {
        const html = generateHTMLReport();
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
        element.setAttribute('download', `blog-comparison-${new Date().getTime()}.html`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#1f2937',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        📥 Export Comparison Report
      </h3>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#374151',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white'
            }}
          >
            <option value="csv">📊 CSV Spreadsheet</option>
            <option value="html">📄 HTML Report</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '10px 20px',
            backgroundColor: exporting ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          {exporting ? '⏳ Exporting...' : '📥 Download Report'}
        </button>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>
          {exportFormat === 'csv'
            ? '📊 CSV format is perfect for importing into Excel or other spreadsheet applications'
            : '📄 HTML format creates a formatted report that you can open in any web browser'}
        </p>
      </div>
    </div>
  );
}
