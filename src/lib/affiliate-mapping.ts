export const AFFILIATE_MAPPING = {
    'ClickBank': {
        defaultId: '', // Removed hardcoded 'johnpace'
        idField: 'affiliate_id',
        urlPattern: 'https://hop.clickbank.net/?vendor=PRODUCT_VENDOR&affiliate=AFFILIATE_ID'
    },
    'Digistore24': {
        defaultId: '', 
        idField: 'affiliate_id',
        urlPattern: '[OFFICIAL_URL]#aff=JohnPace' // STRATEGY: Direct Link + Suffix (No more /redir/ IDs)
    },
    'BuyGoods': {
        defaultId: '',
        idField: 'affiliate_id',
        urlPattern: ''
    },
    'MaxWeb': {
        defaultId: '',
        idField: 'affiliate_id',
        urlPattern: ''
    }
};

export function getAffiliateId(platform: string): string {
    return AFFILIATE_MAPPING[platform as keyof typeof AFFILIATE_MAPPING]?.defaultId || '';
}
