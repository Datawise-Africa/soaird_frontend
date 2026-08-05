/**
 * Generates an object containing Google Analytics gtag initialization script.
 *
 * @param gtagId - The Google Analytics tracking ID (e.g., 'G-XXXXXXXXXX' or 'UA-XXXXXXXXX-X')
 * @returns An object with an `__html` property containing the inline script as a string.
 *          This object is intended to be used with React's `dangerouslySetInnerHTML` prop.
 *
 * @example
 * ```tsx
 * <script dangerouslySetInnerHTML={loadGTagScripts('G-XXXXXXXXXX')} />
 * ```
 *
 * @remarks
 * The generated script:
 * - Initializes the Google Analytics dataLayer array
 * - Defines the gtag function for pushing events
 * - Sets the current timestamp
 * - Configures Google Analytics with the provided tracking ID
 */
export function loadGTagScripts(gtagId: string) {
  return {
    __html: [
      `window.dataLayer = window.dataLayer || [];`,
      `function gtag(){dataLayer.push(arguments);}`,
      `gtag('js', new Date());`,
      `gtag('config', '${gtagId}');`,
    ].join('\n'),
  };
}
