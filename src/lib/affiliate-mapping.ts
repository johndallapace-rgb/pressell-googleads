export const AFFILIATE_MAPPING = {
    'ClickBank': {
        defaultId: 'johnpace',
        idField: 'affiliate_id',
        urlPattern: 'https://hop.clickbank.net/?vendor=PRODUCT_VENDOR&affiliate=AFFILIATE_ID'
    },
    'Digistore24': {
        defaultId: 'JohnPace',
        idField: 'affiliate_id',
        urlPattern: 'https://www.digistore24.com/redir/PRODUCT_ID/AFFILIATE_ID'
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
