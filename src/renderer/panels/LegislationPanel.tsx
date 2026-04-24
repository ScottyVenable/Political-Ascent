import { useMemo, useState } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { LegislationSystem } from '@/systems/LegislationSystem';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { BillId, BillTemplate } from '@/types';

/**
 * LegislationPanel — draft, advance, and vote on bills.
 *
 * Stage advance and vote resolution are performed here by calling
 * `LegislationSystem` directly; all store writes happen inside that module.
 */
export function LegislationPanel(): JSX.Element {
  const templates = useMemo(() => GameEngine.getBillTemplates(), []);
  const pending = useWorldStore((s) => s.pendingLegislation);
  const passed = useWorldStore((s) => s.passedLegislation);
  const failed = useWorldStore((s) => s.failedLegislation);
  const pc = useGameStore((s) => s.politicalCapital);
  const pushToast = useUIStore((s) => s.pushToast);

  const [tab, setTab] = useState<'draft' | 'pending' | 'archive'>('pending');

  function draft(template: BillTemplate): void {
    LegislationSystem.draftBill(template);
    pushToast({ message: `Drafted: ${template.title}`, severity: 'info', ttl: 3000 });
    setTab('pending');
  }

  function advance(id: BillId): void {
    const res = LegislationSystem.advanceStage(id);
    if (!res.ok) {
      pushToast({ message: res.reason ?? 'Cannot advance', severity: 'warning', ttl: 3000 });
    } else if (res.newStage === 'vote') {
      pushToast({ message: 'Bill reached floor vote', severity: 'info', ttl: 3000 });
    }
  }

  function vote(id: BillId): void {
    const res = LegislationSystem.resolveVote(id);
    pushToast({
      message: res.passed
        ? `PASSED ${res.yea}–${res.nay}`
        : `FAILED ${res.yea}–${res.nay}`,
      severity: res.passed ? 'success' : 'danger',
      ttl: 4000,
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          In Flight ({pending.length})
        </TabButton>
        <TabButton active={tab === 'draft'} onClick={() => setTab('draft')}>
          Draft New
        </TabButton>
        <TabButton active={tab === 'archive'} onClick={() => setTab('archive')}>
          Archive ({passed.length + failed.length})
        </TabButton>
      </div>

      {tab === 'draft' && (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} title={t.title} accent="blue">
              <p className="text-sm text-text-secondary mb-2">{t.description}</p>
              <div className="text-xs text-text-muted flex flex-wrap gap-2 mb-3">
                {t.tags.map((tag) => (
                  <span key={tag} className="bg-bg-tertiary rounded px-2 py-0.5">{tag}</span>
                ))}
                <span className="ml-auto">Opposition {t.opposition}</span>
              </div>
              <Button variant="primary" size="sm" onClick={() => draft(t)}>
                Draft
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-text-muted italic">No bills in flight. Draft one to get started.</p>
          )}
          {pending.map((b) => (
            <Card key={b.id} title={b.title} subtitle={`Stage: ${b.stage}`} accent="gold">
              <p className="text-sm text-text-secondary mb-3">{b.description}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                <span>Opposition: {b.opposition}</span>
                <span>PC invested: {b.pcInvested}</span>
                <span>Support: {b.supportVotes} / Oppose: {b.opposeVotes}</span>
              </div>
              <div className="flex gap-2">
                {b.stage !== 'vote' ? (
                  <Button size="sm" variant="primary" onClick={() => advance(b.id)} disabled={pc < 10}>
                    Advance stage
                  </Button>
                ) : (
                  <Button size="sm" variant="gold" onClick={() => vote(b.id)}>
                    Call the vote
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'archive' && (
        <div className="grid md:grid-cols-2 gap-3">
          {passed.map((b) => (
            <Card key={b.id} title={b.title} subtitle="Passed" accent="gold">
              <p className="text-xs text-text-muted">
                Yea {b.supportVotes} – Nay {b.opposeVotes}
              </p>
            </Card>
          ))}
          {failed.map((b) => (
            <Card key={b.id} title={b.title} subtitle="Failed" accent="red">
              <p className="text-xs text-text-muted">
                Yea {b.supportVotes} – Nay {b.opposeVotes}
              </p>
            </Card>
          ))}
          {passed.length + failed.length === 0 && (
            <p className="text-sm text-text-muted italic">No bills in the archive yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-sm font-headline ${
        active
          ? 'bg-accent-gold text-bg-primary'
          : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
      }`}
    >
      {children}
    </button>
  );
}
