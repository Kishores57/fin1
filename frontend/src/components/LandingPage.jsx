import React, { useEffect, useRef, useState } from 'react';
import {
  Trees,
  MapPin,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import treeHero from '../assets/tree.jpg';
import treeCanopy from '../assets/tree2.jpg';
import beesImg from '../assets/bees.jpg';
import './LandingPage.css';

const canopyBio = '/canopy_biodiversity.png';
const medicinalImg = '/medicinal_apothecary.png';

const WHY_TREES = [
  { icon: '🌍', title: 'Climate Change Mitigation', body: 'Trees cool the planet by storing carbon and moderating local temperatures across cities and farms.' },
  { icon: '🌬', title: 'Oxygen Production', body: 'Through photosynthesis, trees release the oxygen our communities breathe every day.' },
  { icon: '🌳', title: 'Carbon Sequestration', body: 'Living biomass locks atmospheric CO₂ into wood, roots, and soil for decades.' },
  { icon: '🌧', title: 'Rainwater Conservation', body: 'Canopies intercept rainfall, slow runoff, and recharge groundwater beneath cities.' },
  { icon: '🌿', title: 'Air Purification', body: 'Leaves trap dust and filter pollutants, improving neighbourhood air quality.' },
  { icon: '🏙', title: 'Urban Heat Island Reduction', body: 'Shade and evapotranspiration cut surface heat on roads, roofs, and plazas.' },
  { icon: '🐦', title: 'Wildlife Habitat', body: 'Branches, cavities, nectar, and fruit sustain birds, bees, and urban mammals.' },
  { icon: '💧', title: 'Groundwater Recharge', body: 'Deep root systems channel rainwater underground, replenishing aquifers that millions depend on.' },
  { icon: '🛡', title: 'Soil Erosion Prevention', body: 'Root networks bind soil on slopes and riverbanks, preventing landslides and sedimentation.' },
  { icon: '🧠', title: 'Mental Health & Wellbeing', body: 'Green canopy corridors reduce stress, lower blood pressure, and improve cognitive focus in urban dwellers.' },
];

const BIODIVERSITY = [
  { icon: '🐦', title: 'Birds', body: 'Crowns offer nesting sites, perches, and seasonal fruit that keep urban birdlife thriving.' },
  { icon: '🦋', title: 'Butterflies', body: 'Flowering trees supply nectar corridors that sustain butterflies across fragmented cities.' },
  { icon: '🐝', title: 'Bees', body: 'Bloom periods deliver pollen and nectar that power honeybee and solitary bee colonies.' },
  { icon: '🐿', title: 'Squirrels', body: 'Canopy cover and seed crops give shelter and forage for arboreal mammals.' },
  { icon: '🐛', title: 'Insects', body: 'Bark, litter, and flowers host pollinators, decomposers, and the food web beneath birds.' },
  { icon: '🌱', title: 'Microorganisms', body: 'Root zones and leaf litter feed soils that recycle nutrients and store carbon.' },
];

const FEATURES = [
  { icon: '🌿', title: 'AI Species Detection', body: 'Identify and profile trees with structured botanical metadata for every inventory record.' },
  { icon: '📊', title: 'Climatic Impact Analysis', body: 'Turn measurements into cooling, shade, and climate-service insights for each tree.' },
  { icon: '🌎', title: 'Carbon Footprint Estimation', body: 'Quantify carbon storage and CO₂ equivalents using allometric science.' },
  { icon: '🌳', title: 'GIS Tree Mapping', body: 'Place every tree on an interactive Leaflet map with live inventory markers.' },
  { icon: '🧮', title: 'Biomass Calculator', body: 'Estimate aboveground biomass from GBH, height, and species wood density.' },
  { icon: '📈', title: 'CO₂ Sequestration Calculator', body: 'Convert biomass into lifetime and annual sequestration metrics.' },
  { icon: '🤖', title: 'AI Tree Knowledge (RAG + Gemini)', body: 'Retrieve species knowledge and generate lasting climatic narratives.' },
  { icon: '📍', title: 'Live Tree Inventory', body: 'Register, store, and revisit trees permanently with MongoDB-backed records.' },
];

const LAWS = [
  {
    title: 'Indian Forest Act, 1927',
    purpose: 'Consolidates laws relating to forests, transit of forest produce, and duties on timber.',
    why: 'Creates the legal backbone for classifying reserved, protected, and village forests.',
    rules: 'Restricts felling, grazing, and removal of forest produce without lawful authority in reserved forests.',
    penalties: 'Unauthorized felling or removal of forest produce can attract fines and imprisonment under the Act.',
    link: 'https://www.indiacode.nic.in/handle/123456789/2252',
  },
  {
    title: 'Forest (Conservation) Act, 1980',
    purpose: 'Regulates diversion of forest land for non-forest purposes.',
    why: 'Stops unchecked conversion of forests for industry, mining, or infrastructure without central scrutiny.',
    rules: 'State governments need prior approval of the Central Government before de-reserving forest land or using it for non-forest use.',
    penalties: 'Violations can lead to prosecution and restoration directions for illegally diverted forest land.',
    link: 'https://forestsclearance.nic.in/',
  },
  {
    title: 'Environment (Protection) Act, 1986',
    purpose: 'Provides an umbrella framework to protect and improve the environment.',
    why: 'Empowers the government to set standards and regulate activities that harm air, water, land, and living beings.',
    rules: 'Authorities may restrict industrial operations and mandate safeguards where ecological harm is likely.',
    penalties: 'Contraventions can result in imprisonment and fines depending on the offence and duration.',
    link: 'https://www.moef.gov.in/',
  },
  {
    title: 'Biological Diversity Act, 2002',
    purpose: 'Conserves biological diversity and regulates access to biological resources and associated knowledge.',
    why: 'Protects India’s genetic heritage and traditional knowledge linked to plants and ecosystems.',
    rules: 'Access to biological resources for research or commercial use often requires approvals through biodiversity authorities.',
    penalties: 'Unauthorized access or transfer of biological resources can invite penalties under the Act.',
    link: 'http://nbaindia.org/',
  },
  {
    title: 'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975',
    purpose: 'Protects and preserves trees in urban areas of Maharashtra, including cities like Nashik and Mumbai.',
    why: 'Urban canopies need local legal shields against arbitrary felling on streets, campuses, and private plots.',
    rules: 'Cutting, girdling, or damaging trees in urban areas typically requires permission from the Tree Authority / designated officers.',
    penalties: 'Illegal felling can invite fines, imprisonment, and obligations to plant compensatory trees as directed.',
    link: 'https://www.maharashtra.gov.in/',
  },
];

function FloatingLeaves() {
  return (
    <div className="lp-leaves" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className={`lp-leaf lp-leaf-${i + 1}`} />
      ))}
    </div>
  );
}

function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const nodes = el.querySelectorAll('.lp-reveal');
    nodes.forEach((n) => n.classList.remove('lp-in'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('lp-in');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    nodes.forEach((n) => io.observe(n));
    // Show above-the-fold immediately
    requestAnimationFrame(() => {
      nodes.forEach((n) => {
        const rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) n.classList.add('lp-in');
      });
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function LandingNav({ view, scrolled, onHome, onNav, onEnter }) {
  const solid = scrolled || view !== 'home';
  return (
    <nav className={`lp-nav ${solid ? 'lp-nav-solid' : ''}`}>
      <div className="lp-nav-inner">
        <button type="button" className="lp-brand" onClick={onHome}>
          <Trees className="w-6 h-6" />
          <span>VanJeevan</span>
        </button>
        <div className="lp-nav-links">
          <button type="button" className={view === 'home' ? 'active' : ''} onClick={() => onNav('home', 'why')}>
            Why Trees
          </button>
          <button type="button" className={view === 'home' ? '' : ''} onClick={() => onNav('home', 'bees')}>
            Bees
          </button>
          <button
            type="button"
            className={view === 'biodiversity' ? 'active' : ''}
            onClick={() => onNav('biodiversity')}
          >
            Biodiversity
          </button>
          <button type="button" className={view === 'laws' ? 'active' : ''} onClick={() => onNav('laws')}>
            Laws
          </button>
          <button type="button" onClick={() => onNav('home', 'features')}>
            AI Features
          </button>
        </div>
        <button type="button" className="lp-nav-cta" onClick={onEnter}>
          Enter Platform
        </button>
      </div>
    </nav>
  );
}

function BiodiversityPage({ onBack }) {
  return (
    <div className="lp-subpage lp-bio-section">
      <div className="lp-container lp-subpage-body">
        <button type="button" className="lp-back-link" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="lp-bio-grid">
          {BIODIVERSITY.map((item, i) => (
            <article key={item.title} className="lp-bio-card lp-reveal" style={{ transitionDelay: `${i * 40}ms` }}>
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function LawsPage({ onBack }) {
  const [openLaw, setOpenLaw] = useState(null);
  return (
    <div className="lp-subpage lp-laws-section">
      <div className="lp-laws-side" style={{ backgroundImage: `url(${medicinalImg})` }} aria-hidden="true" />
      <div className="lp-container lp-subpage-body lp-laws-wrap">
        <button type="button" className="lp-back-link lp-back-link-light" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="lp-section-head lp-section-head-light lp-reveal">
          <h2>Know the Laws Before Cutting a Tree</h2>
          <p>Before species detection and inventory, understand the legal duty to protect trees.</p>
        </div>
        <div className="lp-laws-list">
          {LAWS.map((law, idx) => {
            const open = openLaw === idx;
            return (
              <div key={law.title} className={`lp-law-card lp-reveal ${open ? 'open' : ''}`}>
                <button type="button" className="lp-law-toggle" onClick={() => setOpenLaw(open ? null : idx)}>
                  <span>{law.title}</span>
                  <ChevronDown className={`lp-chevron ${open ? 'rot' : ''}`} />
                </button>
                {open && (
                  <div className="lp-law-body">
                    <p><strong>Purpose:</strong> {law.purpose}</p>
                    <p><strong>Why it exists:</strong> {law.why}</p>
                    <p><strong>Key rules:</strong> {law.rules}</p>
                    <p><strong>Penalties:</strong> {law.penalties}</p>
                    {law.link && (
                      <a href={law.link} target="_blank" rel="noreferrer" className="lp-law-link">
                        Official resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="lp-law-footer lp-reveal">
          Protecting trees is not only an environmental responsibility but also a legal responsibility.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage({ onEnterApp }) {
  const [view, setView] = useState('home'); // home | biodiversity | laws
  const [scrolled, setScrolled] = useState(false);
  const [parallax, setParallax] = useState(0);
  const [activeWhy, setActiveWhy] = useState(0);
  const [openLaw, setOpenLaw] = useState(null);
  const rootRef = useReveal([view]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setParallax(Math.min(window.scrollY * 0.35, 180));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (view !== 'home') return undefined;
    const id = setInterval(() => {
      setActiveWhy((i) => (i + 1) % WHY_TREES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [view]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const go = (tab) => onEnterApp?.(tab || 'calculator');

  const goHome = () => {
    setView('home');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const onNav = (nextView, sectionId) => {
    if (nextView === 'biodiversity' || nextView === 'laws') {
      setView(nextView);
      return;
    }
    setView('home');
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="lp-root" ref={rootRef}>
      <LandingNav
        view={view}
        scrolled={scrolled}
        onHome={goHome}
        onNav={onNav}
        onEnter={() => go('calculator')}
      />

      {view === 'biodiversity' && <BiodiversityPage onBack={goHome} />}
      {view === 'laws' && <LawsPage onBack={goHome} />}

      {view === 'home' && (
        <>
          <header className="lp-hero">
            <div className="lp-hero-media" aria-hidden="true">
              <img
                src={treeHero}
                alt=""
                className="lp-hero-photo"
                style={{ transform: `translateY(${parallax * 0.45}px) scale(1.08)` }}
              />
              <div className="lp-hero-overlay" />
              <FloatingLeaves />
            </div>
            <div className="lp-hero-content lp-reveal">
              <p className="lp-brand-mark">VanJeevan · AI GIS Tree Inventory</p>
              <h1>
                Every Tree Matters.
                <br />
                <em>Every Tree Has a Story.</em>
              </h1>
              <p className="lp-hero-sub">
                AI Powered GIS Tree Inventory, Species Detection, Climatic Impact Analysis and Urban Biodiversity Monitoring.
              </p>
              <div className="lp-hero-ctas">
                <button type="button" className="lp-btn-primary" onClick={() => go('calculator')}>
                  🌳 Detect Tree Species
                </button>
                <button type="button" className="lp-btn-secondary" onClick={() => go('map')}>
                  📍 Explore Tree Map
                </button>
              </div>
            </div>
            <a href="#why" className="lp-scroll-hint" aria-label="Scroll">
              <ChevronDown />
            </a>
          </header>

          <section id="why" className="lp-section lp-why-section">
            <div className="lp-why-bg" style={{ backgroundImage: `url(${treeCanopy})` }} aria-hidden="true" />
            <div className="lp-why-veil" aria-hidden="true" />
            <div className="lp-container">
              <div className="lp-section-head lp-section-head-on-photo lp-reveal">
                <h2>Why Trees Matter</h2>
                <p>Living infrastructure that cools cities, cleans air, and shelters life.</p>
              </div>
              <div className="lp-why-spotlight lp-reveal">
                <div className="lp-why-spotlight-icon">{WHY_TREES[activeWhy].icon}</div>
                <div>
                  <h3>{WHY_TREES[activeWhy].title}</h3>
                  <p>{WHY_TREES[activeWhy].body}</p>
                </div>
              </div>
              <div className="lp-why-grid">
                {WHY_TREES.map((item, i) => (
                  <button
                    type="button"
                    key={item.title}
                    className={`lp-why-card lp-reveal ${activeWhy === i ? 'active' : ''}`}
                    onMouseEnter={() => setActiveWhy(i)}
                    onFocus={() => setActiveWhy(i)}
                    onClick={() => setActiveWhy(i)}
                  >
                    <span className="lp-why-icon">{item.icon}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="bees" className="lp-section lp-bees-section">
            <div className="lp-container lp-bees-layout">
              <div className="lp-bees-copy lp-reveal">
                <p className="lp-amber-label">Pollinators · Food · Forests</p>
                <h2>🐝 The Tiny Guardians of Life</h2>
                <blockquote className="lp-bees-quote">
                  <p>
                    &ldquo;If the bee disappeared off the face of the Earth, humanity would have only four years left to live…&rdquo;
                  </p>
                  <cite>— Commonly attributed to Albert Einstein</cite>
                </blockquote>
                <p className="lp-bees-lead">
                  🌼 Bees pollinate more than <strong>75%</strong> of the world&apos;s flowering plants and support
                  ecosystems that sustain forests, wildlife, and human food systems. Every tree planted creates a
                  healthier habitat for pollinators and strengthens our planet&apos;s future.
                </p>
                <ul>
                  <li>Bees pollinate nearly one-third of the world&apos;s food crops.</li>
                  <li>Trees provide nectar, pollen, and habitat that keep pollinators alive.</li>
                  <li>Without bees, biodiversity declines and harvests become fragile.</li>
                  <li>Protecting flowering trees protects pollinators—and our food future.</li>
                </ul>
                <button type="button" className="lp-btn-honey" onClick={() => go('calculator')}>
                  Protect trees with AI analysis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="lp-bees-visual lp-reveal">
                <div className="lp-bees-frame">
                  <img src={beesImg} alt="Honeybees on honeycomb" className="lp-bees-photo" />
                  <div className="lp-bees-caption">Every flowering tree is a living pantry for bees.</div>
                </div>
                <div className="lp-bees-stats">
                  <div className="lp-bees-stat">
                    <strong>75%+</strong>
                    <span>Flowering plants need pollinators</span>
                  </div>
                  <div className="lp-bees-stat">
                    <strong>1/3</strong>
                    <span>Of food crops depend on bees</span>
                  </div>
                  <div className="lp-bees-stat">
                    <strong>Trees</strong>
                    <span>Build nectar &amp; nesting habitat</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="lp-section lp-feat-section">
            <div className="lp-container">
              <div className="lp-section-head lp-reveal">
                <h2>Our AI Features</h2>
                <p>Science-backed tools for inventory, climate impact, and living maps.</p>
              </div>
              <div className="lp-feat-grid">
                {FEATURES.map((f, i) => (
                  <article key={f.title} className="lp-feat-card lp-reveal" style={{ transitionDelay: `${i * 35}ms` }}>
                    <div className="lp-feat-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                    <span className="lp-feat-glow" aria-hidden="true" />
                  </article>
                ))}
              </div>
              <div className="lp-cta-band lp-reveal">
                <div>
                  <Sparkles className="w-5 h-5" style={{ color: '#3d8b63' }} />
                  <h3>Ready to inventory your first tree?</h3>
                  <p>Run climatic analysis, learn why not to cut, and save trees to the live map.</p>
                </div>
                <div className="lp-hero-ctas">
                  <button type="button" className="lp-btn-primary dark-text" onClick={() => go('calculator')}>
                    🌳 Detect Tree Species
                  </button>
                  <button type="button" className="lp-btn-ghost" onClick={() => go('map')}>
                    <MapPin className="w-4 h-4" />
                    Explore Tree Map
                  </button>
                </div>
              </div>
            </div>
          </section>


          {/* ── BIODIVERSITY (inline on home) ── */}
          <section id="biodiversity" className="lp-section lp-bio-section" style={{ paddingTop: '5rem', paddingBottom: '5rem', background: 'rgba(4,12,6,0.97)' }}>
            <div className="lp-container">
              <div className="lp-section-head" style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#7ee8a2', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)' }}>Urban Biodiversity</h2>
                <p style={{ color: 'rgba(230,255,235,0.85)' }}>Trees are keystones — every species they shelter matters.</p>
              </div>
              <div className="lp-bio-grid">
                {BIODIVERSITY.map((item) => (
                  <article key={item.title} className="lp-bio-card" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(126,232,162,0.2)' }}>
                    <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                    <h3 style={{ color: '#e8ffe8', marginTop: '0.5rem' }}>{item.title}</h3>
                    <p style={{ color: 'rgba(220,255,225,0.82)', fontSize: '0.9rem' }}>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>


          {/* ── LAWS (inline on home) ── */}
          <section id="laws" className="lp-section" style={{ background: 'rgba(3,9,5,0.98)', paddingTop: '4rem', paddingBottom: '5rem' }}>
            <div className="lp-container" style={{ maxWidth: '860px' }}>
              <div className="lp-section-head" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', color: '#7ee8a2' }}>🌿 Tree Protection Laws</h2>
                <p style={{ color: 'rgba(220,255,225,0.85)' }}>Know your rights and responsibilities when it comes to trees in India.</p>
              </div>
              <div className="lp-laws-list">
                {LAWS.map((law, idx) => {
                  const open = openLaw === idx;
                  return (
                    <div key={law.title} className={`lp-law-card ${open ? 'open' : ''}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(126,232,162,0.18)' }}>
                      <button
                        type="button"
                        className="lp-law-toggle"
                        onClick={() => setOpenLaw(open ? null : idx)}
                        aria-expanded={open}
                      >
                        <span>{law.title}</span>
                        <ChevronDown className={`lp-chevron ${open ? 'rot' : ''}`} />
                      </button>
                      {open && (
                        <div className="lp-law-body">
                          <p><strong>Purpose:</strong> {law.purpose}</p>
                          <p><strong>Why it matters:</strong> {law.why}</p>
                          <p><strong>Key rules:</strong> {law.rules}</p>
                          <p><strong>Penalties:</strong> {law.penalties}</p>
                          <a href={law.link} target="_blank" rel="noreferrer" className="lp-law-link">
                            Read full text <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="lp-footer">
            <div className="lp-container lp-footer-inner">
              <div className="lp-brand">
                <Trees className="w-5 h-5" />
                <span>VanJeevan</span>
              </div>
              <p>AI-Powered GIS Tree Inventory & Climatic Impact Analysis System</p>
              <button type="button" className="lp-nav-cta" onClick={() => go('calculator')}>
                Launch App
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
