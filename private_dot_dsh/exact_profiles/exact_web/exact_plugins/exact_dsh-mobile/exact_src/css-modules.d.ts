/** CSS Modules ambient declaration (the build inlines .module.css via lightningcss). */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

declare module '*.css'
