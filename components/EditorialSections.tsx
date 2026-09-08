import { ArrowRight, ArrowUpRight, Plus } from "lucide-react"

const founders = [
  { name: "Oki Mek", role: "CEO", image: "Oki_Mek", linkedin: "https://www.linkedin.com/in/oki-mek/" },
  { name: "Rodi Bechara", role: "Business Development", image: "Rodi_Bechara", linkedin: "https://www.linkedin.com/in/rodi-bechara-50913910/" },
  { name: "David Han", role: "CTO", image: "David_Han", linkedin: "https://www.linkedin.com/in/david-han-4246233aa/" },
  { name: "Josh Lee", role: "Head of Operations", image: "Josh_Lee", linkedin: null },
  { name: "Steven Hernandez", role: "CISO", image: "Steven_Hernandez", linkedin: "https://www.linkedin.com/in/sthernandez/" },
  { name: "Eli Radi", role: "Partner", image: "Eli_Radi", linkedin: null },
  { name: "Tim Han", role: "Head of Development", image: "Tim_Han", linkedin: "https://www.linkedin.com/in/timothyhan12/" },
]

const advisors = [
  { name: "Karen Newnam", role: "Chief Senior Advisor", image: "Karen_Newnam", linkedin: null },
  { name: "Pamela Patenaude", role: "Advisor", image: "Pamela_Patenaude", linkedin: "https://www.linkedin.com/in/pamela-patenaude-9794847a/" },
  { name: "Margaret Weichert", role: "Advisor", image: "Margaret_Weichert", linkedin: "https://www.linkedin.com/in/mweichert/" },
  { name: "Jenny Hudgins", role: "Advisor", image: "Jenny_Hudgins", linkedin: "https://www.linkedin.com/in/jenny-hudgins-42993a82/" },
]

const capabilities = [
  { number: "01", title: "See risk in context.", name: "Live Risk Command", text: "Connect controls, risks, and POA&Ms to the systems and missions they support. Follow the evidence behind a finding, then see what needs attention.", details: ["Unified risk dashboards", "System-to-evidence traceability", "Mission-aligned prioritization"] },
  { number: "02", title: "Move the work forward.", name: "Mission Workflows", text: "Bring your people, systems, assets, and business processes into the same workflow. Coordinate ATO, FedRAMP, and CDM activities with the mission as the starting point.", details: ["Connected security workflows", "OSCAL-enabled information", "Security and privacy in context"] },
  { number: "03", title: "Put AI to work.", name: "AI Native", text: "Start with a system description. Use AI assistance to draft control narratives, identify information types, and prioritize risk actions, with your team reviewing the output.", details: ["Assisted control narratives", "Information categorization", "Human review and accountability"] },
]

function SectionIndex({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="section-index"><span>{number} /</span><span>{children}</span></div>
}

export function PlatformSection() {
  return (
    <section id="platform" className="platform-section">
      <div className="brief-strip"><span>GovSecurity360 / Platform overview</span><span>Mission. Context. Action.</span></div>
      <div className="editorial-container">
        <SectionIndex number="01">The platform</SectionIndex>
        <div className="platform-intro">
          <h2>Every control.<br />Every system.<br /><span>One mission.</span></h2>
          <div className="platform-intro-copy">
            <span className="small-rule" aria-hidden />
            <p>Security decisions need the whole picture.</p>
            <p>GovSecurity360 connects governance, risk, and compliance to the work your organization exists to do.</p>
            <a href="#fips199-demo" className="editorial-link">Explore the live demo <ArrowRight size={18} /></a>
          </div>
        </div>

        <div className="mission-map" aria-label="Illustrative workflow connecting mission, systems, controls, evidence, and risk decisions">
          <div className="map-heading"><span>The connected view</span><span>Illustrative workflow / 01</span></div>
          <div className="map-body">
            <div className="map-origin"><span className="map-caption">Start with the mission</span><h3>What needs<br />to keep working?</h3><p>Give every security decision a reason.</p></div>
            <ol className="map-chain">
              <li><span className="node-index">01</span><div><strong>Systems</strong><span>Assets & information</span></div></li>
              <li><span className="node-index">02</span><div><strong>Controls</strong><span>Requirements & owners</span></div></li>
              <li><span className="node-index">03</span><div><strong>Evidence</strong><span>Assessments & findings</span></div></li>
            </ol>
            <div className="map-decision"><span className="map-caption">Make the next decision</span><h3>Risk with{" "}<br />a clear owner.</h3><p>Prioritize. Assign. Act.</p><ArrowUpRight size={32} strokeWidth={1} aria-hidden /></div>
          </div>
          <div className="map-footer"><span className="signal-dot" aria-hidden /><span>Trace the path from a finding back to the mission it affects.</span></div>
        </div>

        <div className="capability-layout">
          <div className="capability-heading"><span className="eyebrow">Built for the work</span><h3>From visibility<br />to follow-through.</h3><p>Three ways to make the connections useful.</p></div>
          <div className="capability-list">
            {capabilities.map((item, index) => (
              <details key={item.number} className="capability" open={index === 0}>
                <summary><span className="capability-number">{item.number}</span><div><span className="eyebrow">{item.name}</span><h4>{item.title}</h4></div><Plus size={20} strokeWidth={1.5} aria-hidden /></summary>
                <div className="capability-detail"><p>{item.text}</p><ul>{item.details.map(detail => <li key={detail}>{detail}</li>)}</ul></div>
              </details>
            ))}
          </div>
        </div>
        <div className="standards-line"><span className="eyebrow">BUILT FOR FEDERAL CYBERSECURITY &amp; COMPLIANCE</span><div><span>NIST 800-53</span><span>RMF</span><span>FedRAMP</span><span>OSCAL</span><span>FISMA</span></div></div>
      </div>
    </section>
  )
}

function Portrait({ person }: { person: typeof founders[number] }) {
  return (
    <article className="portrait">
      <div className="portrait-image">{person.image ? <img src={`/team/optimized/${person.image}.webp`} alt={person.name} width={720} height={480} loading="lazy" decoding="async" /> : <div className="portrait-placeholder" aria-hidden="true">{person.name.split(" ").map(part => part[0]).join("")}</div>}</div>
      <div className="portrait-caption"><div><h4>{person.name}</h4><p>{person.role}</p></div>{person.linkedin && <a href={person.linkedin} target="_blank" rel="noreferrer" aria-label={`${person.name} on LinkedIn`}><ArrowUpRight size={22} strokeWidth={1.5} /></a>}</div>
    </article>
  )
}

export function PeopleSection() {
  return (
    <section id="about" className="people-section">
      <div className="editorial-container">
        <SectionIndex number="03">The people behind the platform</SectionIndex>
        <div className="people-intro"><h2>Built by people<br />who have carried<br /><em>the responsibility.</em></h2><div><p>Former risk executives. Security operators. People who know what it takes to deliver a federal mission.</p><p>Our team brings experience across cybersecurity, privacy, data, and risk governance—and the realities of working across complex departments and agencies.</p><a className="editorial-link" href="#team">Meet the team <ArrowRight size={18} /></a></div></div>
        <div className="experience-line"><div><strong>20+</strong><span>Years of experience<br />on average</span></div><div><strong>6</strong><span>Core<br />disciplines</span></div><div><strong>3</strong><span>Continents<br />of delivery</span></div></div>
        <div id="team" className="team-section"><div className="team-heading"><h3>The founding team</h3><span className="eyebrow">Strategy meets operations</span></div><div className="portrait-grid">{founders.map(person => <Portrait key={person.name} person={person} />)}</div>
          <details className="advisors"><summary><span>Board of advisors</span><span className="advisors-action">Meet our advisors <Plus size={20} aria-hidden /></span></summary><div className="portrait-grid">{advisors.map(person => <Portrait key={person.name} person={person} />)}</div></details>
        </div>
        <div className="belief"><span className="eyebrow">Our starting point</span><p>Compliance should support the mission.<br /><span>So should your software.</span></p></div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return <footer className="editorial-footer"><div className="editorial-container"><a href="#top" className="footer-brand">GovSecurity360<span>Security Intelligence</span></a><p>© {new Date().getFullYear()} GovSecurity360</p><a href="#top" className="back-to-top">Back to top <ArrowUpRight size={18} /></a></div></footer>
}
