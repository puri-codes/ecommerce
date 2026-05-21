import { getProducts } from '@/lib/db';
import { ProductCard } from '@/components/product-card';

export const revalidate = 60;

const heroImage =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2400';

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col pb-16">

      {/* Hero — fills the full visible viewport below the fixed navbar */}
      <section className="h-[calc(100vh-5rem)] relative overflow-hidden bg-gray-100">
        <img
          src={heroImage}
          alt="DANANA — New Season Collection"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-10 left-6 sm:left-10">
          <p className="text-white/70 text-xs uppercase tracking-[0.3em] mb-2">New Season</p>
          <h2 className="text-white text-4xl sm:text-5xl font-serif tracking-widest">DANANA</h2>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-16">
        <h2 className="text-[32px] font-semibold text-black mb-10">Products</h2>

        {products.length === 0 ? (
          <div className="py-24 text-center text-[#696969]">
            <p>No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
