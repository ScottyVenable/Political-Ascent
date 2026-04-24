import { Button } from '../components/Button';
import { useRouter } from '../router';

/**
 * Main menu — entry point. Heavy on atmosphere, light on options: a
 * stylized title slab, a short tagline, and the core four buttons.
 */
export function MainMenu(): JSX.Element {
  const navigate = useRouter((s) => s.navigate);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Ambient gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-red/10" />

      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="mb-2 tracking-[0.3em] text-xs text-accent-gold font-mono">AN AMERICAN CAREER</div>
        <h1 className="font-headline text-6xl md:text-7xl font-bold text-text-primary mb-4">
          Political <span className="text-accent-gold">Ascent</span>
        </h1>
        <p className="max-w-xl text-text-secondary italic mb-10">
          The floor is open. The cameras are rolling. The clock starts now.
        </p>

        <div className="flex flex-col gap-3 w-56">
          <Button variant="primary" size="lg" onClick={() => navigate('character-creation')}>
            New Game
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('achievements')}>
            Achievements
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('settings')}>
            Settings
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              if (typeof window !== 'undefined' && 'close' in window) window.close();
            }}
          >
            Quit
          </Button>
        </div>
      </main>

      <footer className="relative text-center text-xs text-text-muted py-4">
        v0.1.0-alpha.1 · Political Ascent — a turn-based political career sim
      </footer>
    </div>
  );
}
