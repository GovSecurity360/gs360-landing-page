"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"
import { ArrowDown, ArrowUpRight, Check, FileCheck2, Flag, Layers, Server, ShieldCheck } from "lucide-react"
import "@/styles/connected-view.css"

const stages = [
  { label: "Mission", icon: Flag, title: "Start with what\nneeds to keep working.", text: "Give every security decision a reason. Define the mission your systems and people need to deliver.", category: "Mission objective", example: "Maintain critical government services.", detail: "Keep essential services available to the people and teams that depend on them.", tag: "Public service delivery" },
  { label: "Systems", icon: Server, title: "Find the systems\nthe mission relies on.", text: "Connect the mission to the assets and information behind it. See where a disruption would matter.", category: "Example supporting system", example: "Federal Mission Support System", detail: "Applications, operational data, and supporting services enable the same mission.", tag: "Assets & information" },
  { label: "Controls", icon: ShieldCheck, title: "Give requirements\na place and an owner.", text: "Bring controls into the context of the system they protect, with clear responsibility for the work.", category: "Control in context", example: "Review privileged access.", detail: "Connect the access review to the example system and the team responsible for it.", tag: "Requirements & owners" },
  { label: "Evidence", icon: FileCheck2, title: "Follow the evidence.\nSee what it tells you.", text: "Connect assessments and findings to the controls behind them. Make the basis for a decision visible.", category: "Illustrative finding", example: "An access review is overdue.", detail: "The review record shows a gap. Trace it to the control, the system, and the mission.", tag: "Assessments & findings" },
  { label: "Risk owner", icon: Layers, title: "Turn that context\ninto a next step.", text: "Prioritize the finding, assign the work, and follow through with the mission in view.", category: "Next decision", example: "Assign. Review. Resolve.", detail: "The system owner coordinates the access review and records evidence of the action taken.", tag: "Mission-aligned action" },
]

const motionQuery = "(min-width: 1001px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)"

export default function ConnectedView() {
  const container = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: container, offset: ["start 100px", "end end"] })

  useEffect(() => {
    const query = window.matchMedia(motionQuery)
    const sync = () => setAnimated(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  useMotionValueEvent(scrollYProgress, "change", progress => {
    setActive(Math.min(stages.length - 1, Math.max(0, Math.floor(progress * stages.length))))
  })

  function goToStage(index: number) {
    if (!container.current) return
    const start = window.scrollY + container.current.getBoundingClientRect().top - 100
    const distance = container.current.offsetHeight - window.innerHeight + 100
    window.scrollTo({ top: start + distance * ((index + 0.15) / stages.length), behavior: "smooth" })
  }

  return (
    <div id="connected-view" ref={container} className="connected-view" data-animated={animated}>
      <section className="connected-panel" aria-labelledby="connected-title">
        <div className="connected-heading">
          <h3 id="connected-title">The connected view</h3>
          <span>Illustrative workflow / Example system</span>
        </div>

        {animated ? (
          <>
            <div className="connected-scenes">
              {stages.map((stage, index) => (
                <div key={stage.label} className="connected-scene" data-active={index === active} aria-hidden={index !== active}>
                  <div className="connected-copy">
                    <span className="connected-eyebrow">0{index + 1} / {stage.label}</span>
                    <h4>{stage.title}</h4>
                    <p>{stage.text}</p>
                  </div>
                  <div className="connected-example">
                    <div className="connected-example-top"><stage.icon size={23} strokeWidth={1.4} /><span>{stage.category}</span></div>
                    <strong>{stage.example}</strong>
                    <p>{stage.detail}</p>
                    <div className="connected-tag"><span />{stage.tag}</div>
                  </div>
                </div>
              ))}
            </div>
            <nav className="connected-path" aria-label="Explore the connected workflow">
              <div className="connected-track" aria-hidden="true"><motion.div style={{ scaleX: scrollYProgress }} /></div>
              {stages.map((stage, index) => (
                <button key={stage.label} type="button" className="connected-step" data-reached={index <= active} aria-current={index === active ? "step" : undefined} onClick={() => goToStage(index)}>
                  <span className="connected-step-icon">{index < active ? <Check size={19} /> : <stage.icon size={19} strokeWidth={1.5} />}</span>
                  <span className="connected-step-label"><span>0{index + 1}</span>{stage.label}</span>
                </button>
              ))}
            </nav>
          </>
        ) : (
          <ol className="connected-static">
            {stages.map((stage, index) => (
              <li key={stage.label}>
                <div className="connected-static-marker"><stage.icon size={22} strokeWidth={1.5} /></div>
                <div><span className="connected-eyebrow">0{index + 1} / {stage.label}</span><h4>{stage.title.replace("\n", " ")}</h4><p>{stage.text}</p><div className="connected-static-example"><span>{stage.category}</span><strong>{stage.example}</strong><p>{stage.detail}</p></div></div>
              </li>
            ))}
          </ol>
        )}

        <div className="connected-footer">
          <span>{animated ? <><ArrowDown size={15} /> Scroll to follow the connections</> : "From the mission to the next decision."}</span>
          <a href="#capabilities">Explore capabilities <ArrowUpRight size={16} /></a>
        </div>
      </section>
    </div>
  )
}
