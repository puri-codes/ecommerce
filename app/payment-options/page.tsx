import { Banknote, QrCode, Truck, Phone } from 'lucide-react';

export default function PaymentOptionsPage() {
  return (
    <div className="flex flex-col pb-20">
      <section className="max-w-[760px] mx-auto w-full px-4 sm:px-6 py-16">

        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-2">Ordering info</p>
          <h1 className="text-[32px] font-semibold text-black">Payment Options</h1>
          <p className="text-[#696969] text-sm mt-3">
            Simple, flexible payment — done at your door.
          </p>
        </div>

        {/* Payment methods */}
        <div className="flex flex-col gap-px bg-gray-100 mb-10">
          <div className="bg-white p-7 flex items-start gap-5">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-black mb-1">Cash on Delivery</h3>
              <p className="text-[14px] text-[#696969] leading-relaxed">
                Pay with cash when your order arrives. Our delivery agent will collect payment at your door — no advance payment required.
              </p>
            </div>
          </div>

          <div className="bg-white p-7 flex items-start gap-5">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-black mb-1">Online / QR Payment at Delivery</h3>
              <p className="text-[14px] text-[#696969] leading-relaxed">
                Prefer to pay digitally? Our delivery agent will present a QR code at the door — scan and pay instantly via eSewa, Khalti, or any QR-supported app.
              </p>
            </div>
          </div>
        </div>

        {/* Free delivery callout */}
        <div className="bg-[#f0faf4] border border-[#c3e6cb] px-6 py-5 flex items-start gap-4 mb-10">
          <Truck className="h-5 w-5 text-[#027D48] shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-[#027D48] mb-1">Free delivery on every order</p>
            <p className="text-[13px] text-[#4a7c5f] leading-relaxed">
              No delivery charges — ever. The price shown is exactly what you pay. No hidden fees, no last-minute additions.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-6">How it works</p>
          <ol className="flex flex-col gap-6">
            {[
              { step: '01', title: 'Place your order', desc: 'Add items to your cart and complete the checkout form with your name, phone, and address.' },
              { step: '02', title: 'We call to confirm', desc: 'Our team will call you on the number provided to confirm your order and coordinate a delivery time that works for you.' },
              { step: '03', title: 'Pay at the door', desc: 'When your order arrives, pay with cash or scan the QR code. No advance payment, no hassle.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-5 items-start">
                <span className="text-[11px] font-mono text-[#aaa] mt-1 shrink-0">{step}</span>
                <div>
                  <p className="text-[15px] font-medium text-black mb-1">{title}</p>
                  <p className="text-[13px] text-[#696969] leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Contact prompt */}
        <div className="bg-gray-50 border border-gray-100 px-5 py-4 flex items-start gap-3">
          <Phone className="h-4 w-4 shrink-0 mt-0.5 text-[#696969]" />
          <p className="text-[13px] text-[#696969] leading-relaxed">
            Have questions about payment?{' '}
            <a href="/contact" className="underline text-black hover:opacity-60 transition-opacity">
              Send us a message
            </a>{' '}
            or reach us directly by phone — we're happy to help.
          </p>
        </div>

      </section>
    </div>
  );
}
