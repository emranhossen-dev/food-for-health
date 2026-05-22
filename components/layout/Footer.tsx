'use client'

export default function Footer() {
  return (
    <footer className="w-full py-12 px-margin-desktop mt-stack-lg bg-surface-container-highest border-t border-outline-variant">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div className="max-w-sm">
          <div className="font-headline-md text-headline-md text-primary mb-4">Food for Health</div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            Your health, our priority. We bring the freshest organic harvest directly from our farms to your doorstep, ensuring purity in every bite.
          </p>
          <div className="flex gap-4">
            {/* Social icons would go here */}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-label-lg text-label-lg text-primary font-bold">Company</span>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              About Us
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Impact Stories
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Corporate
            </a>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="font-label-lg text-label-lg text-primary font-bold">Support</span>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Contact
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Shipping Info
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Returns
            </a>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="font-label-lg text-label-lg text-primary font-bold">Legal</span>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Privacy Policy
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-container-max mx-auto mt-12 pt-8 border-t border-outline/20 text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          © 2024 Food for Health. All rights reserved. Your health, our priority.
        </p>
      </div>
    </footer>
  )
}
