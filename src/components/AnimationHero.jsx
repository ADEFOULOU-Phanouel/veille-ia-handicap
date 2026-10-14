import { useEffect, useRef } from 'react'

const IMAGE_SIGNE = 60 // image où le robot fait signe de la main

/*
 * Animation du héro (LottieFiles « Technology in the care of patients and the disabled »).
 * Jouée une seule fois jusqu'au signe de la main, puis figée.
 * Figée directement si l'utilisateur a arrêté les animations.
 * Le lecteur Lottie est chargé à part, pour ne pas ralentir l'affichage des articles.
 */
export default function AnimationHero({ calme }) {
  const zone = useRef(null)

  useEffect(() => {
    let anim = null
    let annule = false
    const reduit = calme || window.matchMedia('(prefers-reduced-motion: reduce)').matches

    Promise.all([import('lottie-web/build/player/lottie_light'), import('../assets/animation-hero.json')]).then(([lib, json]) => {
      if (annule || !zone.current) return
      anim = lib.default.loadAnimation({
        container: zone.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: json.default,
      })
      if (reduit) anim.goToAndStop(IMAGE_SIGNE, true)
      else anim.playSegments([0, IMAGE_SIGNE], true)
    })

    return () => {
      annule = true
      anim?.destroy()
    }
  }, [calme])

  return (
    <div className="scene" aria-hidden="true">
      <div className="anim-hero" ref={zone} />
    </div>
  )
}
