/**
 * Top-level application shell.
 *
 * This is a placeholder landing screen used while the MainMenu,
 * CharacterCreation, ScenarioSelect and Game screens are still being
 * implemented. It renders Tailwind-styled content so `npm run dev` produces
 * something visible end-to-end, and verifies the design-system palette
 * defined in `tailwind.config.ts`.
 */
export function App(): JSX.Element {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-8">
      <section className="max-w-2xl w-full bg-bg-secondary rounded-lg p-8 shadow-xl border border-bg-tertiary">
        <h1 className="font-headline text-4xl font-bold text-accent-gold mb-2">
          Political Ascent
        </h1>
        <p className="font-flavor text-text-secondary italic mb-6">
          Power is compromise; principle is exhaustion.
        </p>
        <p className="text-text-primary mb-4">
          v0.1 alpha scaffolding — the game shell is under construction.
        </p>
        <ul className="font-mono text-sm text-text-secondary space-y-1">
          <li>• Engine: partial</li>
          <li>• Systems: partial</li>
          <li>• Content: pending</li>
          <li>• UI: in progress</li>
        </ul>
      </section>
    </main>
  );
}
