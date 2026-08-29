import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/footer';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
        </div>
        
        <div className="absolute bottom-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDEwdjEwSDB6bTEwIDEwaDEwdjEwaC0xMHptMTAgMGgxMHYxMGgtMTB6bTEwLTEwaDEwdjEwaC0xMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </section>

      <section className="bg-card">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="font-semibold text-white mb-2">Version 1.1 · University of Lagos Campus</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              At LagChow, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website, mobile application, and related services (collectively, the &quot;Platform&quot;) within the University of Lagos campus.
            </p>

            <div className="space-y-12 text-muted-foreground leading-relaxed">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p>This Privacy Policy describes LagChow&apos;s practices regarding the collection, use, and disclosure of your information. By accessing or using the Platform, you agree to the terms of this Policy. If you do not agree with the terms, please do not use the Platform.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                <p className="mb-2">We collect the following types of information when you use LagChow:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, phone number, and delivery preferences.</li>
                  <li><strong>Order Information:</strong> Items purchased, total amount, special instructions, and transaction history.</li>
                  <li><strong>Delivery Information:</strong> Delivery address (e.g., hostel or department) and delivery instructions.</li>
                  <li><strong>Device Information:</strong> Device type, IP address, browser type, and operating system.</li>
                  <li><strong>Usage Information:</strong> How you interact with the Platform, including pages visited and time spent.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Information We Do Not Collect</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do not store your card number, PIN, CVV, or any sensitive banking credentials.</li>
                  <li>All payment processing is handled by our payment provider (Paystack) under their own privacy and security standards.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Legal Basis for Processing Your Data</h2>
                <p className="mb-2">Under the NDPR and NDPA, we process your personal information on the following legal bases:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Creating and managing your account:</strong> Consent / Contract.</li>
                  <li><strong>Processing and fulfilling your orders:</strong> Contract.</li>
                  <li><strong>Processing payments:</strong> Contract / Legal obligation.</li>
                  <li><strong>Communicating order updates:</strong> Contract.</li>
                  <li><strong>Improving platform performance:</strong> Legitimate interest.</li>
                  <li><strong>Fraud prevention and security:</strong> Legitimate interest / Legal obligation.</li>
                  <li><strong>Complying with Nigerian law:</strong> Legal obligation.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To create and manage your LagChow account</li>
                  <li>To receive, process, and coordinate your food orders</li>
                  <li>To assign and dispatch Campus Connect trekkers or Campus Express riders for delivery</li>
                  <li>To communicate order status, updates, and notifications</li>
                  <li>To process payments and issue refunds where applicable</li>
                  <li>To provide customer support and resolve complaints</li>
                  <li>To improve, test, and develop new platform features</li>
                  <li>To detect and prevent fraudulent or unauthorised activity</li>
                  <li>To comply with applicable Nigerian laws and regulations</li>
                  <li>To send you service-related announcements (not marketing without your consent)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Who We Share Your Information With</h2>
                <p className="mb-2">We do not sell your personal information. We share your information only where necessary to operate the platform:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Vendors (food sellers):</strong> Order details, delivery note (to prepare your order).</li>
                  <li><strong>Trekkers and Riders:</strong> Delivery address, order reference (to deliver your order).</li>
                  <li><strong>Paystack (payment provider):</strong> Payment reference, amount (to process your payment securely).</li>
                  <li><strong>Technical service providers:</strong> Usage data, error logs (to maintain platform infrastructure).</li>
                  <li><strong>Nigerian authorities:</strong> Information required by law (to comply with legal obligations only).</li>
                </ul>
                <p className="mt-4">We require all third parties who handle your personal information to comply with applicable data protection laws and to use your information only for the stated purpose.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
                <p className="mb-2">We implement reasonable and appropriate technical and organisational measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. These measures include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encrypted data transmission (HTTPS / TLS)</li>
                  <li>Secure storage of personal information with access controls</li>
                  <li>Regular review of our security practices</li>
                  <li>Restricted access to personal data on a need-to-know basis</li>
                </ul>
                <p className="mt-4">While we take data security seriously, no digital platform can guarantee absolute security. You are responsible for keeping your account credentials confidential and for notifying us immediately if you suspect unauthorised access to your account.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Data Breach Notification</h2>
                <p className="mb-2">In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, LagChow will:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Notify the National Information Technology Development Agency (NITDA) within 72 hours of becoming aware of the breach, in accordance with NDPR requirements</li>
                  <li>Notify affected users as soon as reasonably practicable where the breach poses a high risk to their rights</li>
                  <li>Take immediate steps to contain and investigate the breach</li>
                  <li>Maintain a record of all data breaches, their effects, and remedial actions taken</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Data Retention</h2>
                <p className="mb-2">We retain your personal information only for as long as necessary to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide you with our services</li>
                  <li>Comply with our legal obligations under Nigerian law</li>
                  <li>Resolve disputes and enforce our agreements</li>
                  <li>Maintain records required for financial and regulatory purposes</li>
                </ul>
                <p className="mt-4">When your information is no longer needed, we will securely delete or anonymise it.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Your Rights Under Nigerian Data Protection Law</h2>
                <p className="mb-2">Under the NDPR 2019 and NDPA 2023, you have the following rights in relation to your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Right to Access:</strong> You can request a copy of the personal information we hold about you.</li>
                  <li><strong>Right to Correction:</strong> You can ask us to correct inaccurate or incomplete personal information.</li>
                  <li><strong>Right to Deletion:</strong> You can ask us to delete your personal information where it is no longer necessary.</li>
                  <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent to data processing at any time, without affecting prior processing.</li>
                  <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format.</li>
                  <li><strong>Right to Object:</strong> You can object to processing based on legitimate interests.</li>
                  <li><strong>Right to Lodge a Complaint:</strong> You can complain to NITDA if you believe we have violated your data rights.</li>
                </ul>
                <p className="mt-4">To exercise any of these rights, contact us at privacy@lagchow.com. We will respond within 30 days of receiving your request.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Cookies and Analytics</h2>
                <p className="mb-2">LagChow may use cookies, local storage, and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyse how the platform is used to improve performance</li>
                  <li>Detect and prevent security threats</li>
                </ul>
                <p className="mt-4">You can manage cookie preferences through your browser settings. Disabling cookies may affect some platform functionality. We do not use cookies for advertising purposes.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">12. Children and Minors</h2>
                <p>LagChow is intended for users who are 18 years of age or older, or who are at least 16 years of age with verified parental or guardian consent. We do not knowingly collect personal information from children under 16 without parental consent. If you believe we have collected information from a child under 16 without appropriate consent, please contact us immediately.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">13. Third Party Links and Services</h2>
                <p>The LagChow platform may contain links to third-party websites or integrate third-party services (such as payment gateways). This Privacy Policy applies only to LagChow. We are not responsible for the privacy practices of third-party services. We encourage you to read the privacy policies of any third-party services you use.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">14. Changes to This Privacy Policy</h2>
                <p className="mb-2">We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or platform features. When we make material changes, we will:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Notify you by email to the address registered on your account, with a minimum of fourteen (14) days&apos; advance notice</li>
                  <li>Display a prominent notice on the LagChow platform</li>
                  <li>Update the &quot;Effective Date&quot; at the top of this document</li>
                </ul>
                <p className="mt-4">Your continued use of the platform after the effective date of any changes constitutes your acceptance of the updated Privacy Policy.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">15. How You Give Consent</h2>
                <p className="mb-2">By creating a LagChow account, you confirm that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You have read and understood this Privacy Policy</li>
                  <li>You are 18 years of age or older (or 16 with parental consent)</li>
                  <li>You consent to the collection, use, and processing of your personal information as described in this Policy</li>
                </ul>
                <p className="mt-4">You may withdraw your consent at any time by contacting us at privacy@lagchow.com or by deleting your account through the platform settings. Withdrawal of consent will not affect the lawfulness of any processing carried out before withdrawal.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">16. Contact Us</h2>
                <p className="mb-2">If you have any questions, concerns, or requests relating to this Privacy Policy or the way we handle your personal information, please contact us:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email:</strong> privacy@lagchow.com</li>
                  <li><strong>Campus Location:</strong> University of Lagos, Akoka, Lagos</li>
                  <li><strong>Response Time:</strong> Within 30 days of receiving your request</li>
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
