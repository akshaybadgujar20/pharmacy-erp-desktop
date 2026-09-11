import { GridSelectionState } from './grid-selection.state';

interface DemoRow {
  id: string;
  name: string;
}

describe('GridSelectionState', () => {
  const getId = (row: DemoRow) => row.id;

  it('supports single and multiple selection', () => {
    const state = new GridSelectionState<DemoRow>(getId, true);
    const row1 = { id: '1', name: 'A' };
    const row2 = { id: '2', name: 'B' };
    state.select(row1);
    state.select(row2);
    expect(state.getSelectedIds()).toEqual(['1', '2']);
    expect(state.isSelected(row1)).toBe(true);
    state.deselect(row1);
    expect(state.getSelectedIds()).toEqual(['2']);
  });

  it('preserves selection across pages when preserveSelection is true', () => {
    const state = new GridSelectionState<DemoRow>(getId, true);
    const page1 = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    const page2 = [{ id: '3', name: 'C' }];
    state.select(page1[1]);
    state.reconcileData(page2);
    state.select(page2[0]);
    expect(state.getSelectedIds()).toEqual(['2', '3']);
    state.reconcileData(page1);
    expect(state.isSelected(page1[1])).toBe(true);
  });

  it('reconciles data refresh by stable id', () => {
    const state = new GridSelectionState<DemoRow>(getId, true);
    const original = { id: '10', name: 'Old' };
    state.select(original);
    const refreshed = { id: '10', name: 'New' };
    state.reconcileData([refreshed]);
    expect(state.getSelectedRows()).toEqual([refreshed]);
  });

  it('clears non-visible selection when preserveSelection is false', () => {
    const state = new GridSelectionState<DemoRow>(getId, false);
    state.select({ id: '1', name: 'A' });
    state.reconcileData([{ id: '2', name: 'B' }]);
    expect(state.getSelectedIds()).toEqual([]);
  });

  it('handles dynamic record additions and removals', () => {
    const state = new GridSelectionState<DemoRow>(getId, true);
    const rows = [{ id: '1', name: 'A' }];
    state.select(rows[0]);
    const expanded = [...rows, { id: '2', name: 'B' }];
    state.reconcileData(expanded);
    expect(state.getSelectedIds()).toEqual(['1']);
    state.setAll(expanded, false);
    expect(state.getSelectedIds()).toEqual([]);
  });
});
