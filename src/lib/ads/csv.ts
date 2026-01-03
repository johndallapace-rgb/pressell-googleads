export function convertToCsv(campaigns: any[]): string {
  const headers = [
    "Campaign", "Ad Group", "Keyword", "Criterion Type", 
    "Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5",
    "Description 1", "Description 2", "Final URL", "Path 1", "Path 2"
  ];

  let csvContent = headers.join(",") + "\n";

  campaigns.forEach(camp => {
    camp.adGroups.forEach((group: any) => {
      // Keywords Rows
      group.keywords.forEach((kw: string) => {
        const matchType = kw.startsWith('[') ? 'Exact' : 'Phrase';
        const cleanKw = kw.replace(/[\[\]"]/g, '');
        csvContent += `"${camp.campaignName}","${group.name}","${cleanKw}","${matchType}",,,,,,,,,\n`;
      });

      // Ad Row (RSA)
      const ad = group.ads[0];
      csvContent += `"${camp.campaignName}","${group.name}","","RSA",` +
        `"${ad.headlines[0] || ''}","${ad.headlines[1] || ''}","${ad.headlines[2] || ''}","${ad.headlines[3] || ''}","${ad.headlines[4] || ''}",` +
        `"${ad.descriptions[0] || ''}","${ad.descriptions[1] || ''}",` +
        `"${ad.finalUrl}","${ad.path1 || ''}","${ad.path2 || ''}"\n`;
    });
  });

  return csvContent;
}
