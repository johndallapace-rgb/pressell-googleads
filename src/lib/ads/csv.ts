import { StrategySettings, AdAssets } from './strategyPlanner';

export function convertToCsv(campaigns: any[], strategy?: StrategySettings, assets?: AdAssets): string {
  const headers = [
    "Campaign", "Ad Group", "Keyword", "Criterion Type", 
    "Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5",
    "Description 1", "Description 2", "Final URL", "Path 1", "Path 2",
    "Campaign Daily Budget", "Bid Strategy Type", "Location", "Language"
  ];

  let csvContent = headers.join(",") + "\n";

  campaigns.forEach(camp => {
    // 1. Campaign Settings Row (Pseudo-row to establish settings in Editor)
    // Google Ads Editor handles rows based on what columns are filled.
    // We can attach campaign settings to the first row of the campaign or a separate row.
    // Let's create a dedicated Campaign row.
    if (strategy) {
       csvContent += `"${camp.campaignName}","","","Campaign",,,,,,,,,,,` +
         `"${strategy.dailyBudget}","${strategy.bidStrategy}","${strategy.locations.join(';')}", "${camp.language}"\n`;
    }

    camp.adGroups.forEach((group: any) => {
      // Keywords Rows
      group.keywords.forEach((kw: string) => {
        const matchType = kw.startsWith('[') ? 'Exact' : 'Phrase';
        const cleanKw = kw.replace(/[\[\]"]/g, '');
        csvContent += `"${camp.campaignName}","${group.name}","${cleanKw}","${matchType}",,,,,,,,,,,,,,\n`;
      });

      // Ad Rows (Loop through variants)
      group.ads.forEach((ad: any) => {
        // RSA Row
        csvContent += `"${camp.campaignName}","${group.name}","","RSA",` +
          `"${ad.headlines[0] || ''}","${ad.headlines[1] || ''}","${ad.headlines[2] || ''}","${ad.headlines[3] || ''}","${ad.headlines[4] || ''}",` +
          `"${ad.descriptions[0] || ''}","${ad.descriptions[1] || ''}",` +
          `"${ad.finalUrl}","${ad.path1 || ''}","${ad.path2 || ''}",,,,\n`;
      });
    });
    
    // Sitelinks (Basic implementation)
    if (assets?.sitelinks) {
        assets.sitelinks.forEach(link => {
            // Note: Sitelinks in CSV usually require "Sitelink Text", "Sitelink Description 1", etc. 
            // and separate "Campaign Sitelink" association rows. 
            // For simplicity in this v1, we might skip complex extension mapping in single CSV 
            // or just append them as a note or separate section if supported.
            // Google Ads Editor accepts mixed types. We'd need "Sitelink text" column.
            // Let's skip adding Sitelinks to CSV to avoid schema complexity errors for now,
            // as users often set them up at Account level or manually.
        });
    }
  });

  return csvContent;
}

