import Opening from "@/components/Opening"
import Fips199Demo from "@/components/Fips199Demo"
import ContactSection from "@/components/ContactSection"
import { PlatformOverview, PlatformSection, PeopleSection, SiteFooter } from "@/components/EditorialSections"

export default function HomePage() {
  return (
    <main>
      <a href="#platform" className="skip-link">Skip to content</a>
      <Opening scenes={[
        { id: "platform", label: "Platform", className: "scene-platform editorial", content: <div id="platform"><PlatformOverview /></div> },
        { id: "workflow", label: "Workflow", className: "editorial shared-content", content: <PlatformSection /> },
        { id: "fips199-demo", label: "Demo", className: "editorial shared-content", content: <Fips199Demo tone="light" /> },
        { id: "about", label: "Team", className: "editorial shared-content", content: <PeopleSection /> },
        { id: "contact", label: "Contact", className: "editorial shared-content", content: <><ContactSection tone="light" /><SiteFooter /></> },
      ]} />
    </main>
  )
}
