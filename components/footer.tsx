'use client';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-[#f5f5f5] py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md w-full">
            <h3 className="text-3xl font-semibold mb-4 text-[#000]">Save 20% on Your Purchase Today.</h3>
          </div>
          <form className="flex flex-col sm:flex-row gap-4 w-full md:max-w-md" onSubmit={(e) => e.preventDefault()}>
            <div className="flex-1 border-b border-[#000]">
              <div className="text-sm text-[#000] mb-1">Email</div>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent outline-none py-2 text-[#000] placeholder:text-[#696969]"
                required
              />
            </div>
            <button type="submit" className="bg-[#000] text-white px-8 py-3 rounded-sm h-fit hover:bg-black/90 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="bg-[#000] text-[#e5e5e5] py-12 px-4 flex flex-col items-center">
        <Link href="/" className="mb-8">
          <h2 className="text-white text-3xl font-serif tracking-widest">DANANA</h2>
        </Link>
        <div className="flex gap-6 mb-8 text-white">
          <a href="#" className="hover:text-gray-300">Int</a>
          <a href="#" className="hover:text-gray-300">Pin</a>
          <a href="#" className="hover:text-gray-300">Tik</a>
          <a href="#" className="hover:text-gray-300">X</a>
          <a href="#" className="hover:text-gray-300">Yt</a>
        </div>
        <p className="text-[#696969] text-sm">© 2025 DANANA. All rights reserved.</p>
      </div>
    </footer>
  );
}
