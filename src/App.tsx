import { useEffect } from 'react';
import { useLang } from './lib/i18n';
import { initSmoothScroll, ScrollTrigger } from './lib/motion';
import { useWorkRoute } from './lib/route';
import Preloader from './components/Preloader';
import CircuitBackground from './components/CircuitBackground';
import TargetCursor from './components/TargetCursor';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Core from './components/Core';
import About from './components/About';
import Pipeline from './components/Pipeline';
import Flagship from './components/Flagship';
import Collection from './components/Collection';
import Stack from './components/Stack';
import Journey from './components/Journey';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WorkDetail from './components/WorkDetail';

export default function App() {
  useWorkRoute();

  useEffect(() => {
    initSmoothScroll();
    // ฟอนต์มาแล้ว layout เปลี่ยน → คำนวณตำแหน่ง ScrollTrigger ใหม่
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // เปลี่ยนภาษา: ตั้ง <html lang> และคำนวณตำแหน่ง ScrollTrigger ใหม่ (ข้อความยาวไม่เท่ากัน ความสูงหน้าเปลี่ยน)
  const lang = useLang(s => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    const skip = document.querySelector('.skip');
    if (skip) skip.textContent = lang === 'en' ? 'Skip to content' : 'ข้ามไปที่เนื้อหา';
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => cancelAnimationFrame(raf);
  }, [lang]);

  return (
    <>
      <CircuitBackground />
      <Preloader />
      <TargetCursor />
      <Nav />
      <main id="main">
        <Hero />
        <Core />
        <About />
        <Pipeline />
        <Flagship />
        <Collection />
        <Stack />
        <Journey />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WorkDetail />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
