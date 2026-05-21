import { Suspense } from 'react';
import { ProductListClient } from '@/components/product-list-client';

type SearchParams = Promise<{
  gender?:   string;
  category?: string;
  size?:     string;
  sort?:     string;
  q?:        string;
}>;

const GENDER_LABEL: Record<string, string> = {
  male:   "Men's",
  female: "Women's",
  unisex: 'Unisex',
};

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const pageTitle = params.gender && GENDER_LABEL[params.gender]
    ? `${GENDER_LABEL[params.gender]} Collection`
    : 'All Products';

  return (
    <div className="flex flex-col pb-20">
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-[32px] font-semibold text-black mb-8">{pageTitle}</h1>

        <Suspense fallback={<div className="py-24 text-center text-sm text-[#696969]">Loading…</div>}>
          <ProductListClient
            initialGender={params.gender}
            initialCategory={params.category}
            initialSize={params.size}
            initialSort={params.sort}
            initialQ={params.q}
          />
        </Suspense>
      </section>
    </div>
  );
}
