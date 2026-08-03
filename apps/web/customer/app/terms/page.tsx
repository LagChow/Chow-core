import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background font-sans">
      <section className="relative bg-accent border-b border-black/10 pt-8 pb-20">
        <div className="absolute top-0 w-full p-6">
          <Link href="/">
            <Button variant="ghost" className="hover:bg-black/10 text-black rounded-full px-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to LagChow
            </Button>
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 pt-20 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tight">
            Terms of Use
          </h1>
        </div>
        
        <div className="absolute bottom-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDEwdjEwSDB6bTEwIDEwaDEwdjEwaC0xMHptMTAgMGgxMHYxMGgtMTB6bTEwLTEwaDEwdjEwaC0xMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </section>

      <section className="bg-card">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="font-semibold text-white mb-2">Version 1.0 · University of Lagos Campus</p>
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-8 text-sm text-accent">
              <p className="font-bold mb-1">Disclaimer</p>
              <p>Before use: this is a founder-drafted operational document based on decisions made across the LagChow legal pack so far — it has not been reviewed by a licensed Nigerian lawyer. Have one review it before publishing, particularly Sections 9 (Limitation of Liability) and 13 (Governing Law). This document should be read alongside the LagChow Refund & Cancellation Policy and Privacy Policy, referenced throughout rather than repeated here.</p>
            </div>

            <div className="space-y-12 text-muted-foreground leading-relaxed">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>These Terms & Conditions ("Terms") govern access to and use of the LagChow platform, including the website, mobile application, and related services (together, "the Platform"), operated for the University of Lagos (UNILAG) campus community. By creating an account, placing an order, or otherwise using the Platform, you agree to be bound by these Terms. If you do not agree, you should not use the Platform.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Definitions</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Customer:</strong> A student, staff member, or other user who places an order through LagChow</li>
                  <li><strong>Vendor:</strong> A food seller listed on the LagChow platform</li>
                  <li><strong>Trekker:</strong> A Campus Express foot (or bicycle) delivery partner</li>
                  <li><strong>Rider:</strong> A Campus Connect bicycle or motorcycle delivery partner</li>
                  <li><strong>Order:</strong> A confirmed food purchase placed through the LagChow platform</li>
                  <li><strong>Campus Convenience Fee:</strong> The fee charged by LagChow to the Customer for use of the Platform, separate from the price of food</li>
                  <li><strong>Delivery Fee:</strong> The fee charged for last-mile delivery by a Trekker or Rider</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Eligibility</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Primary use of LagChow is intended for UNILAG students, though staff, lecturers, and visitors may also use the Platform.</li>
                  <li>You must be able to form a legally binding contract to use LagChow. If you are using the Platform on behalf of someone else (e.g. ordering for a friend), you remain responsible for the order and payment.</li>
                  <li>LagChow may request verification (such as a UNILAG student email address) to confirm eligibility and reduce fraudulent account activity.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. What LagChow Is — and Isn't</h2>
                <p>LagChow is a campus food operations platform. We connect Customers with independent Vendors and coordinate delivery through Trekkers and Riders. LagChow does not prepare, cook, or own the food sold on the Platform — Vendors are independent businesses responsible for their own menu, pricing, food safety, and preparation. Trekkers and Riders are independent contractors, not LagChow employees (see the LagChow Trekker Agreement).</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Account Registration</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must provide accurate, current information when creating an account, including a valid delivery location (e.g. hostel, department, or off-campus address).</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</li>
                  <li>LagChow may suspend or terminate accounts that provide false information or are used for fraudulent activity.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Orders & Pricing</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Menu prices are set by the Vendor. LagChow does not mark up food prices — you pay the same price shown on the Vendor's own menu.</li>
                  <li>A Campus Convenience Fee and a Delivery Fee are added at checkout and shown transparently before you confirm payment. Neither fee is hidden or added after the fact.</li>
                  <li>From time to time, LagChow may run promotional offers (e.g. waived Campus Convenience Fee under a set order value, for a limited number of orders). Promotional terms will be stated clearly where they apply and may be withdrawn or changed at LagChow's discretion.</li>
                  <li>All orders are subject to Vendor acceptance. An order is not confirmed until the Vendor accepts it — see the LagChow Refund & Cancellation Policy for what happens at each order stage.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Payment</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments are processed through LagChow's payment partner. LagChow does not store your full card or bank details.</li>
                  <li>By placing an order, you authorize LagChow to charge your selected payment method for the full order total (food price + Campus Convenience Fee + Delivery Fee).</li>
                  <li>If a payment fails or is duplicated, see Section 8 of the LagChow Refund & Cancellation Policy for how this is resolved.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Delivery</h2>
                <p className="mb-2">LagChow assigns each order to the most efficient delivery method available — Campus Express (Trekker) for short campus-only routes, or Campus Connect (Rider) for nearby off-campus locations — based on estimated walking time and distance, not a fixed rule chosen by the Customer.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Estimated preparation and delivery times shown in the app are estimates, not guarantees. Actual times may vary with vendor demand, weather, and campus conditions.</li>
                  <li>You are responsible for providing an accurate delivery location and being reasonably available to receive your order. See Section 7.6 of the Refund & Cancellation Policy for what happens if a delivery cannot be completed.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
                <p>To the fullest extent permitted by law, LagChow is not liable for the quality, safety, or legality of food prepared by Vendors, or for the acts or omissions of independent Trekkers and Riders, except as LagChow directly caused the issue (e.g. a platform error). LagChow's role is to facilitate ordering and coordinate delivery, not to prepare food or guarantee Vendor conduct. Claims relating to food quality, missing items, or delivery issues are handled under the LagChow Refund & Cancellation Policy.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. User Conduct</h2>
                <p className="mb-2">When using LagChow, you agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Place orders with no genuine intent to receive delivery</li>
                  <li>Submit false, exaggerated, or fabricated refund or complaint claims</li>
                  <li>Harass, threaten, or behave abusively toward Vendors, Trekkers, Riders, or LagChow staff</li>
                  <li>Attempt to circumvent the Platform to transact directly with a Vendor, Trekker, or Rider in a way that avoids LagChow fees, where that Vendor/Trekker/Rider relationship originated on LagChow</li>
                  <li>Use the Platform for any unlawful purpose</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Suspension & Termination</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>LagChow may suspend or terminate your account for violation of these Terms, fraudulent activity, or abusive conduct toward other users.</li>
                  <li>You may stop using LagChow and close your account at any time by contacting support.</li>
                  <li>Sections of these Terms that by their nature should survive termination (e.g. Limitation of Liability) will continue to apply after your account is closed.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">12. Privacy</h2>
                <p>LagChow collects and uses personal information (such as your name, contact details, and delivery location) to operate the Platform. This is governed by the separate LagChow Privacy Policy, which should be read alongside these Terms.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">13. Changes to These Terms</h2>
                <p>LagChow may update these Terms from time to time. Material changes will be communicated with reasonable notice via email or in-app notification. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">14. Governing Law</h2>
                <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes not resolved informally or through LagChow's dispute resolution process may be brought before the courts of Lagos State, Nigeria.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">15. Contact</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>General Support:</strong> support@lagchow.com</li>
                  <li><strong>Response Hours:</strong> 8:00 AM – 10:00 PM, Monday to Saturday</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
