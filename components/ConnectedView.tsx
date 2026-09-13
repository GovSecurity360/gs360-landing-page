"use client"

import { ArrowRight, ArrowUpRight, FileCheck2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import "@/styles/connected-view.css"

const stages = [
  { id: "mission", label: "Mission", heading: "Keep essential services available.", text: "Start with the public service that depends on this system. That context gives the access-review finding a reason to matter.", field: "Mission objective", value: "Continuity of public services", related: "Supported by", connection: "Federal Mission Support System" },
  { id: "system", label: "System", heading: "Identify what the finding affects.", text: "The system connects operational information, applications, and the people delivering the service. Follow the finding back to that dependency.", field: "Affected system", value: "Federal Mission Support System", related: "Review scope", connection: "Privileged user access" },
  { id: "control", label: "Control", heading: "Put the requirement in context.", text: "An access review connects a security requirement to a specific system and the team responsible for carrying it out.", field: "Control activity", value: "Review privileged access", related: "Evidence needed", connection: "A current access-review record" },
  { id: "evidence", label: "Evidence", heading: "See the basis for the decision.", text: "An overdue review is a finding to investigate—not proof of a compromise. Keep the observation and its supporting evidence together.", field: "Observed gap", value: "Access review is overdue", related: "Required follow-up", connection: "Validate the review record" },
  { id: "owner", label: "Owner", heading: "Make the next action explicit.", text: "The system owner coordinates the review, records the outcome, and links the evidence back to the finding. Responsibility stays visible.", field: "Responsible role", value: "System owner", related: "Next action", connection: "Complete the review and attach evidence" },
]

export default function ConnectedView() {
  return (
    <section id="connected-view" className="evidence-brief" aria-labelledby="connected-title">
      <div className="brief-masthead"><span>GS360 / Connected context</span><span>Illustrative workflow · Not live system data</span></div>
      <div className="brief-layout">
        <aside className="finding-summary">
          <div className="finding-symbol" aria-hidden="true"><FileCheck2 size={28} strokeWidth={1.25} /></div>
          <span className="brief-label">The finding</span>
          <h3 id="connected-title">One overdue review.<br /><span>A connected picture.</span></h3>
          <p>A privileged-access review needs attention. Explore the context behind the next decision.</p>
          <div className="finding-status"><span aria-hidden="true" />Review required</div>
          <div className="finding-reference"><span>Example record</span><strong>Access review / 001</strong></div>
        </aside>
        <Tabs defaultValue="evidence" className="brief-explorer">
          <TabsList className="brief-tabs" aria-label="Explore the finding’s connected context">
            {stages.map((stage, index) => <TabsTrigger key={stage.id} value={stage.id} className="brief-tab"><span className="brief-tab-number" aria-hidden="true">0{index + 1}</span>{stage.label}</TabsTrigger>)}
          </TabsList>
          {stages.map(stage => (
            <TabsContent key={stage.id} value={stage.id} className="brief-detail">
              <span className="brief-label">{stage.label} / Context</span>
              <h4>{stage.heading}</h4>
              <p>{stage.text}</p>
              <dl className="evidence-record"><div><dt>{stage.field}</dt><dd>{stage.value}</dd></div><div><dt>{stage.related}</dt><dd><ArrowRight size={16} aria-hidden="true" />{stage.connection}</dd></div></dl>
            </TabsContent>
          ))}
          <div className="brief-footnote"><span>Trace the finding. Understand the consequence.</span><a href="#fips199-demo">Try the live demo <ArrowUpRight size={16} aria-hidden="true" /></a></div>
        </Tabs>
      </div>
    </section>
  )
}
