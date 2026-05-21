import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/db';
import { ProductDetails } from '@/components/product-details';
import { ProductCard } from '@/components/product-card';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.meta_title || `${product.name} | DANANA`,
    description: product.meta_description || product.description || undefined,
    keywords: product.meta_keywords || undefined,
    openGraph: {
      title: product.meta_title || `${product.name} | DANANA`,
      description: product.meta_description || product.description || undefined,
      images: product.image_groups?.[0]?.images?.[0]
        ? [{ url: product.image_groups[0].images[0] }]
        : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
  ]);

  if (!product) notFound();

  const related = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex flex-col pb-16">
      <ProductDetails product={product} />

      {related.length > 0 && (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 mt-16">
          <h2 className="text-[28px] font-semibold text-black mb-8">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
