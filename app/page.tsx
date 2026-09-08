import Opening from "@/components/Opening"
import Fips199Demo from "@/components/Fips199Demo"
import ContactSection from "@/components/ContactSection"
import { PlatformSection, PeopleSection, SiteFooter } from "@/components/EditorialSections"

export default function HomePage() {
  return (
    <main>
      <a href="#platform" className="skip-link">Skip to content</a>
      <Opening />
      <div className="editorial">
        <PlatformSection />
        <Fips199Demo tone="light" />
        <PeopleSection />
        <ContactSection tone="light" />
        <SiteFooter />
      </div>
    </main>
  )
}
