import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Not a PDF file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({ data: uint8, verbosity: 0 });
    const textResult = await parser.getText();

    return NextResponse.json({
      text: textResult.text,
      pages: textResult.total,
    });
  } catch (err) {
    console.error('PDF extraction failed:', err);
    return NextResponse.json(
      { error: 'PDF extraction failed: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
