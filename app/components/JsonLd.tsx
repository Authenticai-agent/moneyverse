import { headers } from 'next/headers';

interface JsonLdProps {
  schema: object;
}

export default async function JsonLd({ schema }: JsonLdProps) {
  const h = await headers();
  const nonce = h.get('x-csp-nonce') ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
