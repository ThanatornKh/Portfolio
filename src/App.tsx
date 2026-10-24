import { useEffect } from 'react';
import { initSmoothScroll, ScrollTrigger } from './lib/motion';
import { useWorkRoute } from './lib/route';
import Preloader from './components/Preloader';
import TargetCursor from './components/TargetCursor';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Pipeline from './components/Pipeline';
import Flagship from './components/Flagship';
import UnderTheHood from './components/UnderTheHood';
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

  return (
    <>
      <Preloader />
      <TargetCursor />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Pipeline />
        <Flagship />
        <UnderTheHood />
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
