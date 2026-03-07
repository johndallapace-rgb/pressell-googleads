import { NextRequest, NextResponse } from 'next/server';
import { getAssets, addAsset } from '@/lib/assets';

export async function GET() {
    try {
        const assets = await getAssets();
        return NextResponse.json(assets);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, productName, type, url, label, notes } = body;

        if (!productId || !type || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newAsset = await addAsset({
            productId,
            productName: productName || productId,
            type,
            url,
            label: label || 'New Asset',
            notes: notes || ''
        });

        if (!newAsset) {
            return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 });
        }

        return NextResponse.json(newAsset);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
