import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiSun, FiMoon, FiBarChart2, FiActivity, FiTag, FiCoffee, FiBookOpen, FiUsers, FiDatabase, FiPlayCircle, FiTool, FiRepeat, FiServer, FiCode, FiZap, FiGlobe, FiLayers, FiShield } from "react-icons/fi";
import "./frontPage.css";
import {
    FiCpu as AIIcon,
    FiGrid as WorkspaceIcon,
    FiGlobe as SocialIcon,
    FiDatabase as StorageIcon,
    FiGitBranch as RepoIcon,
    FiSliders as CustomIcon,
} from 'react-icons/fi';
import appLogo from '../../assets/logo.png';
import appLogoComplete from '../../assets/logo-comp.png';

export default function FrontPage() {
    const { scrollYProgress } = useScroll();
    const scaleY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const wrapperRef = useRef();
    return (
        <div ref={wrapperRef} className="fp-page-wrapper">
      <motion.div className="fp-page">
              <Nav scrollContainerRef={wrapperRef}/>

            {/* <motion.div className="fp-progress" style={{ scaleY }} /> */}
            <Hero />
            <Features />
            <Insights />
            <UseCases />
            <Workflow />
            <ApiOverview />
            <EcosystemIntegrations />
            <Footer />
        </motion.div>
        </div>
    );
}


function Nav({ scrollContainerRef }) {
  const sections = ["features", "insights", "usecases", "workflow", "api", "components"];

const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  console.log(scrolled);

  return (
    <motion.nav
      className={`fp-nav fp-nav--sticky ${scrolled ? 'scrolled' : ''}`}
      initial={false}
      transition={{ duration: 0.4 }}
    >
      <div className='fp-logo'>
        <Link to={`/`}>
          <img src={appLogo} alt="Logo" />
          <h2 className='neon-text'>4Space</h2>
          <img src={appLogoComplete} className='fade-image' alt="Complete Logo" />
        </Link>
      </div>
      <ul className="fp-nav-links">
        {sections.map(id => (
          <li key={id} className="nav-item">
            <a href={`#${id}`} className="nav-link">
              {id === "usecases"
                ? "Use Cases"
                : id.charAt(0).toUpperCase() + id.slice(1)}
              <motion.span
                className="underline"
                layoutId="underline"
              />
            </a>
          </li>
        ))}
      </ul>
      <div className="fp-nav-actions">
        <Link to="/register" className="btn btn--primary">Try for Free</Link>
        <Link to="/login" className="btn btn--outline">Sign In</Link>
      </div>
    </motion.nav>
  );
}


function Hero() {
    return (
        <header className="fp-hero paper" id="hero">
            <div className="fp-hero-bg">
                <div className="blob blob1" />
                <div className="blob blob2" />
            </div>
            <motion.div
                className="fp-hero-inner"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1>Power Your Workflow with AI-Driven Collaboration</h1>
                <p>From kickoff to delivery, blend async updates and live sessions on a modular canvas powered by intelligent automation.</p>
                <div className="fp-hero-ctas">
                    <Link to="/register" className="btn btn--secondary">Get Started Free</Link>
                    <a href="#features" className="btn btn--outline">See Core Features</a>
                </div>
            </motion.div>
        </header>
    );
}

function Section({ id, title, children }) {
    return (
        <section id={id} className="fp-section paper">
            <motion.h2
                className="fp-section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                {title}
            </motion.h2>
            {children}
        </section>
    );
}

function Features() {
    const features = [
        ["1", "Persistent Spaces", "Contextual hubs where your team’s history of messages, files, and notes lives on."],
        ["2", "Modular Canvas", "Add code, text, media, and tasks. Resize and arrange blocks to suit your flow."],
        ["3", "Live & Async Modes", "Work together live or leave threaded updates. Perfect for global teams."],
        ["4", "Smart Automation", "Use AI to summarize threads, tag files, generate tasks, and send smart nudges."]
    ];

    return (
        <Section id="features" title="Core Features">
            <div className="fp-feature-list">
                {features.map(([icon, title, desc], i) => (
                    <motion.div
                        key={i}
                        className="fp-feature-row"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="icon-placeholder">{icon}</div>
                        <div>
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}

function Insights() {
    const insights = [
        { icon: <FiBarChart2 />, title: "Real-time Dashboards", desc: "Monitor engagement, tasks, and content flows as they happen with live updates." },
        { icon: <FiActivity />, title: "Auto-generated Insights", desc: "Spot missed replies, open tasks, and content metrics instantly through AI." },
        { icon: <FiTag />, title: "AI Tagging & Summaries", desc: "Automatically tag threads and summarize discussions to stay focused." },
    ];

    return (
        <section id="insights" className="fp-insights-section">
            {/* Dynamic background accents */}
            <div className="fp-insights-bg" />
            <h2 className="fp-insights-header">Insights & Automation</h2>
            <div className="fp-insights-cards">
                {insights.map((item, idx) => (
                    <motion.div
                        key={idx}
                        className={`insight-card card-${idx + 1}`}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.2, type: "spring", stiffness: 120 }}
                        whileHover={{ rotate: idx % 2 === 0 ? -2 : 2, scale: 1.05 }}
                    >
                        <div className="card-icon">{item.icon}</div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

function UseCases() {
    const cases = [
        {
            icon: <FiUsers />,
            title: "Startups",
            desc: "Iterate fast with async deliverables, live design critiques, and automated sprint reports.",
            bg: "case-bg-1",
        },
        {
            icon: <FiCoffee />,  // Agencies
            title: "Agencies",
            desc: "Manage multiple clients in parallel. Centralize feedback loops and deliver revisions seamlessly.",
            bg: "case-bg-2",
        },
        {
            icon: <FiBookOpen />, // Educators
            title: "Educators",
            desc: "Run blended learning: lecture notes, student projects, and peer reviews all on one dynamic canvas.",
            bg: "case-bg-3",
        },
        {
            icon: <FiDatabase />, // Researchers
            title: "Researchers",
            desc: "Document experiments, share datasets, and co-author papers without endless email threads.",
            bg: "case-bg-4",
        },
    ];

    return (
        <section id="usecases" className="fp-usecases-section">
            <div className="fp-usecases-header">
                <span className="header-deco" />
                <h2>Designed for Every Team</h2>
                <span className="header-deco" />
            </div>
            <div className="fp-usecases-cards">
                {cases.map((item, idx) => (
                    <motion.div
                        key={idx}
                        className={`usecase-card ${item.bg}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
                        whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                    >
                        <div className="usecase-icon">{item.icon}</div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                        <a href={`#${item.title.toLowerCase()}`} className="usecase-link">Learn More →</a>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}



function Workflow() {
    const steps = [
        {
            icon: <FiPlayCircle />, title: "Kickoff & Setup",
            desc: "Start projects instantly with AI-generated space templates tailored to your goal."
        },
        {
            icon: <FiTool />, title: "Customize & Build",
            desc: "Drag-and-drop modules: code snippets, Kanban boards, media embeds, and more."
        },
        {
            icon: <FiUsers />, title: "Collaborate Live & Async",
            desc: "Seamlessly switch between live sessions and threaded updates to fit your team's rhythm."
        },
        {
            icon: <FiRepeat />, title: "Automate & Iterate",
            desc: "Set up AI-driven summaries, reminders, and smart nudges to keep workflows on track."
        }
    ];

    return (
        <section id="workflow" className="fp-workflow-section">
            <div className="workflow-header">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    How It Works
                </motion.h2>
                <motion.p
                    className="workflow-subtitle"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    A four-step path from setup to automation that accelerates your team's productivity.
                </motion.p>
            </div>
            <div className="workflow-steps-container">
                {steps.map((step, idx) => (
                    <motion.div
                        key={idx}
                        className="workflow-step-card"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.2, type: "spring", stiffness: 110 }}
                        whileHover={{ scale: 1.05, boxShadow: "0 16px 32px rgba(0,0,0,0.5)" }}
                    >
                        <div className="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}



function ApiOverview() {
    return (
        <section id="api" className="fp-api-section">
            <motion.div
                className="api-header"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <FiServer className="api-header-icon" />
                <h2>API &amp; Integration</h2>
                <p className="api-subtitle">
                    Connect and extend your workflow with our powerful REST endpoints and real-time events.
                </p>
            </motion.div>
            <div className="api-content">
                <motion.div
                    className="api-features"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {[
                        { icon: <FiCode />, label: "OpenAPI Spec" },
                        { icon: <FiZap />, label: "AI-Driven Endpoints" },
                        { icon: <FiCode />, label: "CLI Tools" },
                        { icon: <FiZap />, label: "Webhooks & Events" }
                    ].map((f, i) => (
                        <div key={i} className="feature-item">
                            {f.icon}
                            <span>{f.label}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    className="api-code-container"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <div className="code-toolbar">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                    </div>
                    <pre className="api-code-panel">
                        <code>
                            <span className="token comment">// GET all spaces</span>
                            <span className="token method">GET</span> <span className="token url">/v1/spaces</span>

                            <span className="token comment">// POST: Create AI Space</span>
                            <span className="token method">POST</span> <span className="token url">/v1/spaces</span>
                            <span className="token string">{"{"} "template":"ai_brainstorm" {"}"}</span>

                            <span className="token comment"># include auth header</span>
                            <span className="token header">Authorization:</span> <span className="token string">Bearer YOUR_TOKEN</span>
                        </code>
                    </pre>
                </motion.div>
            </div>
        </section>
    );
}






function EcosystemIntegrations() {
    const items = [
        { name: 'AI Assistant', Icon: AIIcon, desc: 'Smart summarization and insights powered by AI' },
        { name: 'Workspace', Icon: WorkspaceIcon, desc: 'Flexible canvases, boards, and collaborative spaces' },
        { name: 'Social Hub', Icon: SocialIcon, desc: 'Unified feed from multiple social channels' },
        { name: 'Storage', Icon: StorageIcon, desc: 'Secure cloud file management and sharing' },
        { name: 'Repo', Icon: RepoIcon, desc: 'Versioned code repositories and asset tracking' },
        { name: 'Customization', Icon: CustomIcon, desc: 'Adaptable layouts and workflow automation' },
    ];

    return (
        <Section id="components" className="eco-section" title="Core Platform Components">
            {/* <section id="integrations" className="eco-section"> */}
            <p className="eco-subtitle">
                Explore the building blocks that power your AI-driven workspace and unified social experience.
            </p>
            <div className="timeline-container">
                <div className="timeline-line" />
                {items.map((item, idx) => (
                    <motion.div
                        key={item.name}
                        className={`timeline-item ${idx % 2 === 0 ? 'up' : 'down'}`}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, type: 'spring', stiffness: 120 }}
                    >
                        <div className="icon-circle">
                            <item.Icon className="icon" />
                        </div>
                        <div className="text-box">
                            <h4>{item.name}</h4>
                            <p>{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            {/* </section> */}
        </Section>
    );
}



function Footer() {
    return (
        <footer className="fp-footer">
            <div className="footer-top">
                {/* link columns... */}
                <div className="footer-col">
                    <h4>Product</h4>
                    <ul>
                        <li><Link to="/features">Features</Link></li>
                        <li><Link to="/pricing">Pricing</Link></li>
                        <li><Link to="/integrations">Integrations</Link></li>
                        <li><Link to="/docs">Docs</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/careers">Careers</Link></li>
                        <li><Link to="/blog">Blog</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Community</h4>
                    <ul>
                        <li><Link to="/events">Events</Link></li>
                        <li><Link to="/forum">Forum</Link></li>
                        <li><Link to="/partners">Partners</Link></li>
                        <li><Link to="/news">News</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Legal</h4>
                    <ul>
                        <li><Link to="/terms">Terms of Service</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                        <li><Link to="/security">Security</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© 2025 4Space Inc. — Built for high-performance collaboration.</p>
            </div>
            {/* Horizontal bars stacking animation */}
            <div className="footer-bars-horizontal">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="hbar" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
            </div>
        </footer>
    );
}