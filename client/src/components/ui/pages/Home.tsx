import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { trpc } from "../lib/trpc";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDot,
  Code2,
  ExternalLink,
  Facebook,
  Github,
  Instagram,
  Layers3,
  Linkedin,
  Mail,
  Menu,
  MessageCircle,
  MousePointer2,
  Orbit,
  Send,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";

type Project = {
  id?: number;
  title: string;
  eyebrow: string;
  description: string;
  tags: string[];
  color: string;
  glyph: string;
  number: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string | null;
  instagramUrl?: string | null;
  whatsappUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
};

const projects: Project[] = [
  {
    title: "Frostline OS",
    eyebrow: "Operations platform",
    description: "A calm command center for teams that need signal, speed, and a little more breathing room.",
    tags: ["React", "Node", "Realtime"],
    color: "mint",
    glyph: "↗",
    number: "01",
  },
  {
    title: "Mallow Market",
    eyebrow: "E-commerce experience",
    description: "A considered shopping flow that turns complex catalogs into an easy, confident decision.",
    tags: ["Next.js", "Shopify", "UX"],
    color: "mustard",
    glyph: "✦",
    number: "02",
  },
  {
    title: "Northstar Data",
    eyebrow: "Analytics system",
    description: "A living visual language for data teams—built to make the next right move obvious.",
    tags: ["TypeScript", "Charts", "API"],
    color: "ink",
    glyph: "◌",
    number: "03",
  },
];

const teamLinks = {
  github: "https://github.com/SnowCodeTeam",
  facebook: "https://www.facebook.com/profile.php?id=61593709923569",
  whatsapp: "https://wa.me/201501915633",
  instagram: "https://www.instagram.com/snowcodeteam",
  emailOne: "mailto:asyl68372@gmail.com",
  emailTwo: "mailto:ferasmhyop2003@gmail.com",
};

const snowCodeMark = "/manus-storage/snowcode-mark_2b5b9404.png";

const snowflakes = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 29) % 100}%`,
  delay: `${(index % 9) * 0.7}s`,
  duration: `${8 + (index % 5) * 2}s`,
  size: `${2 + (index % 4)}px`,
  opacity: 0.22 + (index % 5) * 0.08,
}));

function Snowman() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      className="snowman-stage"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -8, y: x * 12 });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      aria-label="Interactive 3D snowman illustration"
      role="img"
    >
      <div className="scene-orbit orbit-one" />
      <div className="scene-orbit orbit-two" />
      <div className="snowman-shadow" />
      <div
        className="snowman"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="snowman-body body-bottom" />
        <div className="snowman-body body-middle">
          <span className="button button-one" />
          <span className="button button-two" />
          <span className="button button-three" />
          <span className="arm arm-left" />
          <span className="arm arm-right" />
        </div>
        <div className="snowman-head">
          <div className="hat-brim" />
          <div className="hat-top"><span /></div>
          <span className="eye eye-left" />
          <span className="eye eye-right" />
          <span className="carrot" />
          <span className="smile smile-one" />
          <span className="smile smile-two" />
          <span className="smile smile-three" />
          <span className="cheek cheek-left" />
          <span className="cheek cheek-right" />
          <div className="scarf" />
        </div>
      </div>
      <div className="scene-caption"><CircleDot size={12} /> move your cursor around</div>
    </div>
  );
}

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`section-label ${light ? "section-label-light" : ""}`}>
      <span className="label-line" />
      <span>{children}</span>
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  return (
    <article className={`project-card project-${project.color}`}>
      <div className="project-art">
        {project.imageUrl && <img className="project-image" src={project.imageUrl} alt="" />}
        <span className="project-number">{project.number}</span>
        <span className="project-glyph">{project.glyph}</span>
        <div className="art-grid" />
        <div className="art-orb" />
        <div className="art-word">SNOW</div>
      </div>
      <div className="project-body">
        <div className="project-meta">
          <span>{project.eyebrow}</span>
          <span className="project-arrow"><ArrowUpRight size={16} /></span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="tag-row">
          {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <button className="text-link" onClick={() => onOpen(project)}>
          View case study <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("All work");
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const projectsQuery = trpc.projects.list.useQuery(undefined, { retry: false });
  const teamQuery = trpc.site.team.useQuery(undefined, { retry: false });
  const settingsQuery = trpc.site.settings.useQuery(undefined, { retry: false });
  const contactMutation = trpc.contacts.create.useMutation();
  const trackVisit = trpc.site.trackVisit.useMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    trackVisit.mutate({ path: "/" });
  }, []);

  const siteStyle = settingsQuery.data ? {
    "--site-primary": settingsQuery.data.primaryColor,
    "--site-accent": settingsQuery.data.accentColor,
    "--site-background": settingsQuery.data.backgroundColor,
    "--site-surface": settingsQuery.data.surfaceColor,
  } as CSSProperties : undefined;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActiveProject(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const liveProjects: Project[] = projectsQuery.data?.map((project, index) => ({
    ...project,
    number: String(index + 1).padStart(2, "0"),
    color: project.color || "mint",
    glyph: project.glyph || "✦",
  })) ?? projects;

  const visibleProjects = useMemo(() => {
    if (filter === "All work") return liveProjects;
    return liveProjects.filter((project) => project.eyebrow === filter);
  }, [filter, projectsQuery.data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name || !formState.email || !formState.message) {
      toast.error("Please complete the three fields so we can get back to you.");
      return;
    }
    try {
      await contactMutation.mutateAsync(formState);
      setSent(true);
      toast.success("Message received. We’ll be in touch soon.");
    } catch {
      toast.error("We couldn’t save your note. Please try again or email us directly.");
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="site-shell" style={siteStyle}>
      {isLoading && <div className="brand-loader" role="status" aria-label="Loading SnowCode"><div className="brand-loader-card"><img src={snowCodeMark} alt="SnowCode" /><strong>Snow<span>Code</span></strong><small>BUILD · CODE · GROW</small><div className="loader-line"><span /></div></div></div>}
      <div className="ambient ambient-top" />
      <div className="ambient ambient-bottom" />

      <header className="site-nav">
        <button className="brand-mark" onClick={() => scrollTo("top")} aria-label="Snow Code Team home">
          <span className="brand-icon brand-image-wrap"><img className="brand-image" src={snowCodeMark} alt="SnowCode" /></span>
          <span className="brand-text snowcode-wordmark"><strong>Snow<span>Code</span></strong><em>BUILD · CODE · GROW</em></span>
        </button>
        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <button onClick={() => scrollTo("work")}>Work</button>
          <button onClick={() => scrollTo("approach")}>Approach</button>
          <a className="services-nav-link" href="/services" onClick={() => setMenuOpen(false)}>Services</a>
          <button onClick={() => scrollTo("contact")}>Contact</button>
          <span className="team-social-nav" aria-label="Snow Code Team social links"><a href={teamLinks.github} target="_blank" rel="noreferrer" aria-label="Snow Code Team GitHub"><Github size={14} /></a><a href={teamLinks.facebook} target="_blank" rel="noreferrer" aria-label="Snow Code Team Facebook"><Facebook size={14} /></a><a href={teamLinks.whatsapp} target="_blank" rel="noreferrer" aria-label="Snow Code Team WhatsApp"><MessageCircle size={14} /></a><a href={teamLinks.instagram} target="_blank" rel="noreferrer" aria-label="Snow Code Team Instagram"><Instagram size={14} /></a><a href={teamLinks.emailOne} aria-label="Email asyl68372@gmail.com" title="asyl68372@gmail.com"><Mail size={14} /></a><a href={teamLinks.emailTwo} aria-label="Email ferasmhyop2003@gmail.com" title="ferasmhyop2003@gmail.com"><Mail size={14} /></a></span>
          <a className="nav-admin-link" href="/admin" onClick={() => setMenuOpen(false)}>Admin</a>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? "☼" : "◐"}</button>
          <button className="nav-availability" onClick={() => scrollTo("contact")}>
            <span className="status-dot" /> available for select projects
          </button>
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <SectionLabel>independent digital studio · est. 2024</SectionLabel>
            <h1>Good ideas<br /><span>deserve</span><br />good code.</h1>
            <p className="hero-intro">Snow Code Team builds the quiet, capable digital products behind ambitious ideas.</p>
            <div className="hero-actions">
              <button className="button-primary" onClick={() => scrollTo("work")}>Explore our work <ArrowDown size={16} /></button>
              <button className="button-quiet" onClick={() => scrollTo("contact")}><span className="quiet-icon"><MousePointer2 size={15} /></span> Start a conversation</button>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars"><span>SC</span><span>NB</span><span>+</span></div>
              <p><strong>12 launches</strong><br />made with care</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-note note-top"><Sparkles size={14} /> soft systems, sharp thinking</div>
            <Snowman />
            <div className="visual-note note-bottom"><span>01</span> the team mascot</div>
          </div>
          <div className="hero-footer-line"><span>Scroll to explore</span><span className="line" /><span>01 / 04</span></div>
        </section>

        <section className="statement-section" id="approach">
          <div className="statement-top"><SectionLabel>what we believe</SectionLabel><span className="mono-note">[ 001 — 004 ]</span></div>
          <div className="statement-grid">
            <p className="statement-lead">We make digital things feel <i>inevitable.</i></p>
            <div className="statement-copy">
              <p>Not louder. Not busier. Just clearer. We pair thoughtful design with sturdy engineering to turn complicated problems into products people actually enjoy using.</p>
              <button className="text-link" onClick={() => scrollTo("contact")}>How we work <ArrowRight size={15} /></button>
            </div>
          </div>
          <div className="principles-grid">
            <div><span className="principle-index">01</span><Code2 size={21} /><h3>Craft over noise</h3><p>Every detail has a job. Every interaction earns its place.</p></div>
            <div><span className="principle-index">02</span><Layers3 size={21} /><h3>Systems that breathe</h3><p>Flexible foundations that stay useful as you grow.</p></div>
            <div><span className="principle-index">03</span><Zap size={21} /><h3>Momentum, calmly</h3><p>Fast feedback loops without the frantic energy.</p></div>
          </div>
        </section>

        <section className="work-section" id="work">
          <div className="section-heading-row">
            <div><SectionLabel>selected work</SectionLabel><h2>Built for the<br /><em>long run.</em></h2></div>
            <div className="work-controls">
              {['All work', 'Operations platform', 'E-commerce experience', 'Analytics system'].map((item) => (
                <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}</button>
              ))}
            </div>
          </div>
          <div className="projects-grid">
            {visibleProjects.map((project) => <ProjectCard key={project.title} project={project} onOpen={setActiveProject} />)}
          </div>
          <div className="work-footer"><span>More work available on request</span><a href={teamLinks.github} target="_blank" rel="noreferrer">See our GitHub <Github size={16} /></a></div>
        </section>

        {teamQuery.data?.length ? <section className="team-section" id="team">
          <div className="section-heading-row"><div><SectionLabel>the people</SectionLabel><h2>Good people<br /><em>make good work.</em></h2></div><span className="mono-note">[ OUR TEAM ]</span></div>
          <div className="team-grid">
            {(teamQuery.data as TeamMember[]).map((member) => <article className="team-card" key={member.id}><div className="team-card-avatar">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : <span>{member.name.slice(0, 1).toUpperCase()}</span>}</div><h3>{member.name}</h3><p>{member.role}</p><div className="team-socials">{member.instagramUrl && <a href={member.instagramUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} Instagram`}><Instagram size={16} /></a>}{member.whatsappUrl && <a href={member.whatsappUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} WhatsApp`}><MessageCircle size={16} /></a>}{member.githubUrl && <a href={member.githubUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} GitHub`}><Github size={16} /></a>}{member.linkedinUrl && <a href={member.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} LinkedIn`}><Linkedin size={16} /></a>}</div></article>)}
          </div>
        </section> : null}

        <section className="marquee-section" aria-hidden="true">
          <div className="marquee-track">WE MAKE THINGS <span>✳</span> THAT LAST <span>✳</span> WE MAKE THINGS <span>✳</span> THAT LAST <span>✳</span></div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-copy"><SectionLabel light>have a good one?</SectionLabel><h2>Let’s make<br /><em>something</em> useful.</h2><p>Tell us the messy version. We’ll bring the structure, the curiosity, and the good questions.</p><div className="contact-direct"><Mail size={17} /><a href="mailto:hello@snowcode.team">hello@snowcode.team</a></div></div>
          <div className="contact-form-wrap">
            {sent ? (
              <div className="success-state"><div className="success-icon"><Check size={26} /></div><span className="mono-note">MESSAGE RECEIVED</span><h3>That’s a good start.</h3><p>We’ll read this properly and get back to you within two working days.</p><button className="button-secondary" onClick={() => { setSent(false); setFormState({ name: "", email: "", message: "" }); }}>Send another note</button></div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label><span>Your name</span><input value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} placeholder="Jane Doe" /></label>
                <label><span>Email address</span><input type="email" value={formState.email} onChange={(event) => setFormState({ ...formState, email: event.target.value })} placeholder="jane@company.com" /></label>
                <label><span>What are we making?</span><textarea value={formState.message} onChange={(event) => setFormState({ ...formState, message: event.target.value })} placeholder="A few words about the challenge..." rows={4} /></label>
                <button className="button-secondary form-submit" type="submit">Send the note <Send size={16} /></button>
                <span className="form-footnote">No sales pitch. No mailing list. Just a thoughtful reply.</span>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-icon brand-image-wrap"><img className="brand-image" src={snowCodeMark} alt="SnowCode" /></span><span className="snowcode-wordmark"><strong>Snow<span>Code</span></strong><em>BUILD · CODE · GROW</em></span></div><p>Quietly building the next useful thing.</p><div className="footer-socials"><a href={teamLinks.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a><a href={teamLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17} /></a><a href={teamLinks.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={17} /></a><a href={teamLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a><a href={teamLinks.emailOne} aria-label="Email asyl68372@gmail.com" title="asyl68372@gmail.com"><Mail size={17} /></a><a href={teamLinks.emailTwo} aria-label="Email ferasmhyop2003@gmail.com" title="ferasmhyop2003@gmail.com"><Mail size={17} /></a></div><div className="footer-emails"><a href={teamLinks.emailOne}>asyl68372@gmail.com</a><a href={teamLinks.emailTwo}>ferasmhyop2003@gmail.com</a></div><span className="footer-year">© 2024 — 2026</span><span className="dev-credit">Dev By: SnowCodeTeam</span></footer>

      {activeProject && <div className="modal-backdrop" role="presentation" onClick={() => setActiveProject(null)}><div className="project-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveProject(null)} aria-label="Close project"><X size={19} /></button><div className={`modal-art project-${activeProject.color}`}><span>{activeProject.number}</span><strong>{activeProject.title}</strong><i>{activeProject.glyph}</i></div><div className="modal-content"><span className="mono-note">CASE STUDY / {activeProject.eyebrow.toUpperCase()}</span><h3>{activeProject.title}</h3><p>{activeProject.description} This project is part of our selected work archive; a detailed case study is available when we start a conversation.</p><div className="tag-row">{activeProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button className="button-primary" onClick={() => { setActiveProject(null); scrollTo("contact"); }}>Talk about a similar project <ArrowRight size={16} /></button></div></div></div>}
    </div>
  );
}
