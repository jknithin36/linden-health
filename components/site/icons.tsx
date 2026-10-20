/** Small custom glyphs that the icon library doesn't cover. */

export function StarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.8 12.5 7l5.7.6-4.3 3.9 1.2 5.6L10 14.2l-5.1 2.9 1.2-5.6L1.8 7.6 7.5 7 10 1.8Z" />
    </svg>
  )
}

/** 3×3 dots used by the navbar menu button. */
export function GridDotsIcon({ className }: { className?: string }) {
  const positions = [5, 12, 19]
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {positions.map((cy) =>
        positions.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} />)
      )}
    </svg>
  )
}

/** Google Play logo, for the footer's app download badge. */
export function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 283" aria-hidden="true" className={className}>
      <path fill="#ea4335" d="M119.553 134.916L1.06 259.061a32.14 32.14 0 0 0 47.062 19.071l133.327-75.934z" />
      <path fill="#fbbc04" d="M239.37 113.814L181.715 80.79l-64.898 56.95l65.162 64.28l57.216-32.67a31.345 31.345 0 0 0 0-55.537z" />
      <path fill="#4285f4" d="M1.06 23.487A30.6 30.6 0 0 0 0 31.61v219.327a32.3 32.3 0 0 0 1.06 8.124l122.555-120.966z" />
      <path fill="#34a853" d="m120.436 141.274l61.278-60.483L48.564 4.503A32.85 32.85 0 0 0 32.051 0C17.644-.028 4.978 9.534 1.06 23.399z" />
    </svg>
  )
}

/** App Store logo, for the footer's app download badge. */
export function AppStoreLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="30 30 800.1 800" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="app-store-logo-gradient" x1="430.05" x2="430.05" y1="-.77" y2="799.23" gradientTransform="translate(0 30.77)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#18bffb" />
          <stop offset="1" stopColor="#2072f3" />
        </linearGradient>
      </defs>
      <path fill="url(#app-store-logo-gradient)" d="M668.4 30H191.6C102.3 30 30 102.3 30 191.6v476.9C30 757.7 102.3 830 191.6 830h476.9c89.2 0 161.6-72.3 161.6-161.6V191.6C830 102.3 757.7 30 668.4 30" />
      <path fill="#fff" d="m426.6 213.8 16.2-28c10-17.5 32.3-23.4 49.8-13.4s23.4 32.3 13.4 49.8L349.9 492.4h112.9c36.6 0 57.1 43 41.2 72.8H173c-20.2 0-36.4-16.2-36.4-36.4s16.2-36.4 36.4-36.4h92.8l118.8-205.9-37.1-64.4c-10-17.5-4.1-39.6 13.4-49.8 17.5-10 39.6-4.1 49.8 13.4zM286.2 602.7l-35 60.7c-10 17.5-32.3 23.4-49.8 13.4S178 644.5 188 627l26-45c29.4-9.1 53.3-2.1 72.2 20.7m301.4-110.1h94.7c20.2 0 36.4 16.2 36.4 36.4s-16.2 36.4-36.4 36.4h-52.6l35.5 61.6c10 17.5 4.1 39.6-13.4 49.8-17.5 10-39.6 4.1-49.8-13.4-59.8-103.7-104.7-181.3-134.5-233-30.5-52.6-8.7-105.4 12.8-123.3 23.9 41 59.6 102.9 107.3 185.5" />
    </svg>
  )
}

/** Google "G" logo, for the "Continue with Google" button. */
export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 262" aria-hidden="true" className={className}>
      <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
      <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
      <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
      <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
    </svg>
  )
}

/** Apple logo, for the "Continue with Apple" button. Uses the current text color. */
export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 315" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262" />
    </svg>
  )
}

/** Linden Health leaf mark: the logo without the wordmark, for tight spots like the collapsed portal sidebar. */
export function LindenMark({ className }: { className?: string }) {
  return (
    <svg viewBox="177 118 797 797" aria-hidden="true" className={className}>
      <path
        fill="#000000"
        d="M487.0,776.5 L440.0,743.5 L392.0,704.5 L352.0,667.5 L315.5,629.0 L280.5,585.0 L262.5,558.0 L246.5,530.0 L224.5,482.0 L209.5,432.0 L203.5,396.0 L201.5,358.0 L206.5,313.0 L216.5,281.0 L232.5,253.0 L250.0,234.5 L279.0,217.5 L307.0,210.5 L345.0,210.5 L389.0,221.5 L421.0,236.5 L466.0,267.5 L502.5,303.0 L528.5,335.0 L550.5,368.0 L533.5,398.0 L509.5,450.0 L487.0,520.5 L448.5,471.0 L423.5,443.0 L385.0,405.5 L349.5,378.0 L385.5,423.0 L420.5,473.0 L445.5,513.0 L477.5,572.0 L472.5,639.0 L473.5,680.0 L477.5,722.0 L487.0,776.5 Z"
      />
      <path
        fill="#333333"
        d="M558.0,822.5 L550.0,821.5 L545.5,817.0 L544.5,814.0 L549.5,797.0 L581.5,711.0 L622.5,627.0 L664.5,556.0 L704.5,497.0 L753.5,433.0 L798.5,381.0 L792.0,383.5 L769.0,401.5 L732.0,433.5 L693.5,472.0 L642.5,531.0 L601.5,587.0 L574.5,629.0 L545.5,680.0 L524.5,726.0 L518.0,735.5 L513.5,706.0 L510.5,659.0 L511.5,616.0 L515.5,575.0 L524.5,528.0 L534.5,492.0 L550.5,450.0 L571.5,407.0 L597.5,365.0 L637.5,314.0 L674.0,278.5 L725.0,242.5 L771.0,221.5 L799.0,213.5 L824.0,209.5 L862.0,211.5 L893.0,222.5 L915.5,240.0 L934.5,268.0 L945.5,300.0 L949.5,329.0 L949.5,369.0 L939.5,425.0 L918.5,484.0 L896.5,526.0 L852.5,590.0 L812.5,635.0 L782.0,664.5 L741.0,699.5 L696.0,733.5 L558.0,822.5 Z"
      />
    </svg>
  )
}
