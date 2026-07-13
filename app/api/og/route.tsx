import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'MoneyVerse';
  const description = searchParams.get('description') || 'A safe financial learning world for kids and families.';

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full p-12 text-white justify-center"
        style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #87CEEB 100%)' }}
      >
        <div tw="flex items-center mb-6">
          <div tw="w-12 h-12 rounded-full bg-white mr-4" />
          <div tw="text-4xl font-bold">MoneyVerse</div>
        </div>
        <div tw="text-6xl font-bold leading-tight mb-6 max-w-4xl">{title}</div>
        <div tw="text-3xl max-w-3xl opacity-90">{description}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
