"use client";

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CloudUpload, 
  Edit3, 
  Download, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { LanguageSwitcher } from '@/client/components/ui/LanguageSwitcher';

export default function LandingPage() {
  const { t } = useTranslations('landing');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">
                Resume<span className="text-indigo-600">Builder</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {t.nav.features}
              </Link>
              <Link href="#templates" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {t.nav.templates}
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {t.nav.pricing}
              </Link>
              {/* Temporarily hidden login button */}
              {/* <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {t.nav.login}
              </Link> */}
              <LanguageSwitcher variant="pill" />
              <Link href="/builder" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-95">
                <Sparkles size={15} className="text-amber-300" />
                <span>{t.nav.buildResume}</span>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher variant="pill" />
              <Link href="/builder" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                <Sparkles size={12} className="text-amber-300" />
                <span>{t.nav.buildResume}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-20 pb-32 overflow-hidden bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Hero Copy */}
              <div className="max-w-2xl">
                {/* Value highlight pill badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
                  <Sparkles size={15} className="text-indigo-600 animate-pulse" />
                  <span>{t.hero.badge}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.2] mb-6">
                  {t.hero.titlePrefix}
                  <span className="text-indigo-600">{t.hero.titleHighlight}</span>
                  {t.hero.titleSuffix}
                </h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                  {t.hero.description}
                </p>

                {/* High-Visibility Hero CTA */}
                <div className="flex flex-col items-start gap-4">
                  <div className="relative group w-full sm:w-auto">
                    {/* Glowing animated background underlay */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>

                    <Link
                      href="/builder"
                      className="relative flex items-center justify-center gap-3 px-10 py-4.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-lg sm:text-xl font-extrabold shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 active:scale-95 transition-all text-center w-full sm:w-auto tracking-wide"
                    >
                      <Sparkles size={22} className="text-amber-300 shrink-0" />
                      <span>{t.hero.ctaButton}</span>
                      <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform shrink-0" />
                    </Link>
                  </div>

                  {/* Trust check badge */}
                  <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-2 pt-1">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <span>{t.hero.noCreditCard}</span>
                  </p>
                </div>
              </div>

              {/* Hero Graphic */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:h-[500px] flex items-center justify-center">
                {/* Decorative background blobs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl -z-10"></div>
                
                {/* Document Mockup */}
                <div className="relative w-[320px] sm:w-[380px] aspect-[1/1.4] bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 ease-out z-10">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full mb-6 flex items-center justify-center">
                    <div className="w-8 h-8 text-indigo-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                  </div>
                  
                  {/* Skeleton lines */}
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded-full w-1/2"></div>
                    <div className="h-px bg-slate-200 w-full my-6"></div>
                    
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-100 rounded-full w-5/6"></div>
                    </div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-100 rounded-full w-4/6"></div>
                    </div>
                  </div>

                  {/* AI Badge overlay */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center text-white transform rotate-12 animate-pulse-slow">
                    <Sparkles size={24} className="mb-1" />
                    <span className="font-bold text-xl">{t.hero.aiBadge}</span>
                  </div>

                  {/* Checkmark overlay */}
                  <div className="absolute -bottom-5 -right-5 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-slate-50">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle size={24} />
                    </div>
                  </div>
                </div>

                {/* Back decorative document */}
                <div className="absolute top-4 -left-4 w-[320px] sm:w-[380px] aspect-[1/1.4] bg-indigo-600 rounded-2xl shadow-xl transform -rotate-6 z-0 hidden sm:block"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.templates.title}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">{t.templates.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Template Card 1 */}
              <div className="group flex flex-col items-center">
                <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 shadow-sm relative transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="w-full h-full bg-slate-50 flex flex-col">
                     <div className="h-1/4 bg-slate-600 w-full relative">
                        <div className="absolute bottom-2 left-4 w-10 h-10 rounded-full bg-slate-300"></div>
                     </div>
                     <div className="flex-1 p-4 px-6 flex gap-3">
                       <div className="w-1/3 bg-slate-200 h-full rounded-sm opacity-50"></div>
                       <div className="w-2/3 flex flex-col gap-2 pt-2">
                         <div className="h-2 w-full bg-slate-300 rounded-full"></div>
                         <div className="h-2 w-full bg-slate-300 rounded-full"></div>
                         <div className="h-2 w-5/6 bg-slate-300 rounded-full"></div>
                       </div>
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-semibold text-slate-800 mb-3">{t.templates.modernProfessional}</h3>
                <Link href="/builder" className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                  {t.templates.preview}
                </Link>
              </div>

              {/* Template Card 2 */}
              <div className="group flex flex-col items-center">
                <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 shadow-sm relative transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="w-full h-full bg-zinc-900 p-4 px-6 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-zinc-700"></div>
                       <div className="w-20 h-3 bg-zinc-700 rounded-full"></div>
                     </div>
                     <div className="flex gap-4 h-full pt-4">
                       <div className="w-8 h-full bg-zinc-800 rounded-sm"></div>
                       <div className="flex-1 flex flex-col gap-3">
                         <div className="h-2 w-full bg-zinc-600 rounded-full"></div>
                         <div className="h-2 w-full bg-zinc-600 rounded-full"></div>
                         <div className="h-2 w-4/6 bg-zinc-600 rounded-full"></div>
                       </div>
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-semibold text-slate-800 mb-3">{t.templates.creativePortfolio}</h3>
                <Link href="/builder" className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                  {t.templates.preview}
                </Link>
              </div>

              {/* Template Card 3 */}
              <div className="group flex flex-col items-center">
                <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 shadow-sm relative transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                   <div className="w-full h-full bg-white flex flex-col p-6">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="w-24 h-4 bg-slate-800 rounded-full"></div>
                     </div>
                     <div className="flex flex-col gap-3">
                         <div className="flex gap-2 w-full">
                           <div className="w-1 bg-slate-800 h-10 rounded-full"></div>
                           <div className="flex flex-col gap-1 w-full justify-center">
                             <div className="h-2 w-full bg-slate-200 rounded-full"></div>
                             <div className="h-2 w-4/5 bg-slate-200 rounded-full"></div>
                           </div>
                         </div>
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-semibold text-slate-800 mb-3">{t.templates.classicExecutive}</h3>
                <Link href="/builder" className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                  {t.templates.preview}
                </Link>
              </div>

              {/* Template Card 4 */}
              <div className="group flex flex-col items-center">
                <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-200 shadow-sm relative transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                   <div className="w-full h-full bg-white flex p-4 gap-4">
                     <div className="w-1/4 h-full flex flex-col gap-2">
                        <div className="w-full aspect-square bg-slate-300 rounded-full mb-2"></div>
                        <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                        <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                     </div>
                     <div className="flex-1 flex flex-col gap-4 mt-2">
                         <div className="w-1/2 h-4 bg-slate-800 rounded-full"></div>
                         <div className="flex flex-col gap-2">
                           <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                           <div className="h-2 w-5/6 bg-slate-100 rounded-full"></div>
                           <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                           <div className="h-2 w-4/5 bg-slate-100 rounded-full"></div>
                         </div>
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-semibold text-slate-800 mb-3">{t.templates.simpleClean}</h3>
                <Link href="/builder" className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                  {t.templates.preview}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="features" className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t.howItWorks.title}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">{t.howItWorks.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 text-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50">
                  <CloudUpload size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t.howItWorks.step1Title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs">{t.howItWorks.step1Desc}</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center relative">
                {/* Connecting Line (hidden on mobile) */}
                <div className="hidden md:block absolute top-10 left-[calc(-50%+4rem)] w-[calc(100%-8rem)] h-[2px] bg-gradient-to-r from-indigo-100 to-indigo-200 -z-10"></div>
                
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50">
                  <Edit3 size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t.howItWorks.step2Title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs">{t.howItWorks.step2Desc}</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-10 left-[calc(-50%+4rem)] w-[calc(100%-8rem)] h-[2px] bg-gradient-to-r from-indigo-200 to-indigo-200 -z-10"></div>

                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50">
                  <Download size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t.howItWorks.step3Title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs">{t.howItWorks.step3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-50 rounded-3xl p-12 text-center border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">{t.cta.title}</h2>
                <div className="relative inline-block group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                  <Link
                    href="/builder"
                    className="relative flex items-center justify-center gap-3 px-10 py-4.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                  >
                    <Sparkles size={20} className="text-amber-300" />
                    <span>{t.cta.button}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-slate-900 mb-4">{t.footer.resources}</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.blog}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.guides}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.examples}</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-slate-900 mb-4">{t.footer.company}</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.about}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.careers}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.contact}</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-slate-900 mb-4">{t.footer.support}</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.helpCenter}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.faqs}</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{t.footer.privacyPolicy}</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-slate-900 mb-4">{t.footer.newsletter}</h4>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder={t.footer.newsletterPlaceholder}
                  className="w-full px-4 py-2 border border-slate-200 rounded-l-lg 
                             focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent 
                             text-sm text-slate-900 placeholder:text-slate-400"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">
                  {t.footer.subscribe}
                </button>
              </form>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 gap-4">
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">{t.footer.aboutUs}</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">{t.footer.contact}</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">{t.footer.privacyPolicy}</Link>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
