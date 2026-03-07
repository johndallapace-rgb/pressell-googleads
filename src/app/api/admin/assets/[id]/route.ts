import { NextRequest, NextResponse } from 'next/server';
import { updateAsset, deleteAsset } from '@/lib/assets';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const success = await updateAsset(id, body);
        
        if (!success) {
            return NextResponse.json({ error: 'Failed to update asset' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const success = await deleteAsset(id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete asset' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
