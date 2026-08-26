"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from "@/components/auth/LoginModal";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  if (pathname?.startsWith("/dashboard") || pathname === "/login") {
    return null;
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Course", href: "/course" },
    { name: "About", href: "/about" },
    { name: "Resources", href: "/resources" },
  ];

  return (
    <>
      <nav className="w-full bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo/logo.png"
                  alt="Hustlify Logo"
                  width={160}
                  height={50}
                  className="h-11 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Right side: Desktop Navigation Links + Action Button */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <div className="flex items-center space-x-6 lg:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-white text-sm lg:text-base font-medium tracking-wide hover:text-neutral-300 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="bg-white text-black font-semibold text-sm lg:text-base px-6 py-2.5 rounded-full hover:bg-neutral-200 transition-all duration-200 shadow-sm"
              >
                Sign In
              </button>
            </div>

            {/* Mobile menu button with rotation animation */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white p-2 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer (slides in from the left, pure white background, black text, no border) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
              />

              {/* Left slide-in menu drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white text-black z-50 p-6 flex flex-col justify-between shadow-2xl md:hidden"
              >
                <div>
                  {/* Header in sidebar with logo and close button with rotation */}
                  <div className="flex items-center justify-between pb-6">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                      <Image
                        src="/logo/logo.png"
                        alt="Hustlify Logo"
                        width={140}
                        height={45}
                        className="h-10 w-auto object-contain invert"
                      />
                    </Link>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-black p-2 hover:bg-neutral-100 rounded-full focus:outline-none"
                      aria-label="Close navigation menu"
                    >
                      <motion.div
                        whileTap={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </motion.div>
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-4 pt-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-black text-lg font-semibold hover:text-neutral-600 transition-colors duration-150 py-1"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Action Button at bottom */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="block w-full bg-black text-white text-center font-semibold text-base py-3 px-6 rounded-full hover:bg-neutral-800 transition-colors shadow-md"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Login Popup Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
