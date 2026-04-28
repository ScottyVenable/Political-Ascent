/**
 * Unit tests for EntityLink — pure routing logic + click behaviour.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityLink, panelForEntity } from './EntityLink';
import { useUIStore } from '@/store/uiStore';

describe('panelForEntity', () => {
  it('routes bills to legislation', () => {
    expect(panelForEntity('bill')).toBe('legislation');
  });

  it('routes npcs to congress', () => {
    expect(panelForEntity('npc')).toBe('congress');
  });

  it('routes groups to population', () => {
    expect(panelForEntity('group')).toBe('population');
  });

  it('routes events to timeline', () => {
    expect(panelForEntity('event')).toBe('timeline');
  });
});

describe('<EntityLink>', () => {
  beforeEach(() => {
    // Reset the panel between tests so click assertions are isolated.
    useUIStore.setState({ activePanel: 'dashboard' });
  });

  it('renders a button labelled by its children with a stable testid', () => {
    render(
      <EntityLink type="bill" id="hr-2024-001">
        H.R. 2024-001
      </EntityLink>,
    );
    const btn = screen.getByTestId('entity-link-bill-hr-2024-001');
    expect(btn.textContent).toBe('H.R. 2024-001');
    expect(btn.getAttribute('data-entity-type')).toBe('bill');
    expect(btn.getAttribute('data-entity-id')).toBe('hr-2024-001');
  });

  it('switches the active panel to the entity type default on click', async () => {
    const user = userEvent.setup();
    render(
      <EntityLink type="bill" id="hr-1">
        A Bill
      </EntityLink>,
    );
    expect(useUIStore.getState().activePanel).toBe('dashboard');
    await user.click(screen.getByTestId('entity-link-bill-hr-1'));
    expect(useUIStore.getState().activePanel).toBe('legislation');
  });

  it('honours an explicit panel override', async () => {
    const user = userEvent.setup();
    render(
      <EntityLink type="bill" id="hr-2" panel="economy">
        A Bill
      </EntityLink>,
    );
    await user.click(screen.getByTestId('entity-link-bill-hr-2'));
    expect(useUIStore.getState().activePanel).toBe('economy');
  });

  it('invokes onBeforeNavigate before switching panels', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <EntityLink
        type="npc"
        id="sen-1"
        onBeforeNavigate={() => calls.push('before')}
      >
        Senator
      </EntityLink>,
    );
    await user.click(screen.getByTestId('entity-link-npc-sen-1'));
    expect(calls).toEqual(['before']);
    expect(useUIStore.getState().activePanel).toBe('congress');
  });
});
