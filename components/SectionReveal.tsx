"use client"

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"

type Props = ComponentPropsWithoutRef<"div"> & { stagger?: boolean }

export default function SectionReveal({ children, stagger = false, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !window.IntersectionObserver || !element.animate) return

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let animations: Animation[] = []
    // Content stays visible in the HTML and after the animation finishes.
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      if (preference.matches || element.contains(document.activeElement)) return

      const targets = stagger ? Array.from(element.children) : [element]
      animations = targets.map((target, index) => target.animate(
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 480, delay: Math.min(index * 70, 210), easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
      ))
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" })

    const showImmediately = () => {
      observer.disconnect()
      animations.forEach(animation => animation.cancel())
    }
    const onPreferenceChange = () => { if (preference.matches) showImmediately() }
    if (!preference.matches) observer.observe(element)
    preference.addEventListener("change", onPreferenceChange)
    element.addEventListener("focusin", showImmediately)
    return () => {
      showImmediately()
      preference.removeEventListener("change", onPreferenceChange)
      element.removeEventListener("focusin", showImmediately)
    }
  }, [stagger])

  return <div ref={ref} {...props}>{children}</div>
}
