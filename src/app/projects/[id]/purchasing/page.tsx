'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProjectTabs from '@/components/projects/ProjectTabs';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import type { BudgetRow, BudgetSummary, CostType, DrawInvoice } from '@/lib/budget/types';

interface BudgetWorkspaceState {
  project: Record<string, unknown> & { id: string; name?: string; address?: string };
  client: Record<string, unknown> & { id: string } | null;
  builderOrg: Record<string, unknown> & { id: string } | null;
  budget: BudgetSummary;
  rows: BudgetRow[];
  draws: DrawInvoice[];
}

interface BudgetRowFormState {
  categoryCode: string;
  categoryName: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: string;
  unitCost: string;
  markup: string;
  costType: CostType;
}

interface GroupedRows {
  categoryCode: string;
  categoryName: string;
  totalAmount: number;
  lineItems: BudgetRow[];
}

const initialRowForm: BudgetRowFormState = {
  categoryCode: '',
  categoryName: '',
  itemCode: '',
  itemName: '',
  description: '',
  quantity: '1',
  unitCost: '',
  markup: '0',
  costType: 'labor',
};

const costTypeLabels: Record<CostType, string> = {
  labor: 'Labor',
  material: 'Material',
  laborMaterial: 'Labor & Material',
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function groupRows(rows: BudgetRow[]): GroupedRows[] {
  const grouped = new Map<string, GroupedRows>();

  rows.forEach((row) => {
    const key = `${row.categoryCode}__${row.categoryName}`;
    const existing = grouped.get(key) || {
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      totalAmount: 0,
      lineItems: [],
    };

    existing.totalAmount += row.totalAmount;
    existing.lineItems.push(row);
    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
}

function getPreviousDrawTotals(draws: DrawInvoice[]) {
  return draws.reduce<Record<string, number>>((totals, draw) => {
    draw.lineItems.forEach((lineItem) => {
      totals[lineItem.budgetRowId] = (totals[lineItem.budgetRowId] || 0) + lineItem.currentDrawAmount;
    });
    return totals;
  }, {});
}

function getNextDrawNumber(draws: DrawInvoice[]) {
  return draws.reduce((max, draw) => Math.max(max, draw.drawNumber), 0) + 1;
}

function buildDrawTotals(rows: BudgetRow[], draws: DrawInvoice[], currentAmounts: Record<string, string>) {
  const previousTotals = getPreviousDrawTotals(draws);
  const warnings: string[] = [];
  const summaries = rows.map((row) => {
    const previousDrawn = previousTotals[row.id] || 0;
    const currentDrawAmount = Number(currentAmounts[row.id] || 0);
    const safeCurrentDrawAmount = Number.isFinite(currentDrawAmount) ? currentDrawAmount : 0;
    const availableForCurrentDraw = row.totalAmount - previousDrawn;
    const remainingAmount = row.totalAmount - previousDrawn - safeCurrentDrawAmount;
    const isOverLimit = safeCurrentDrawAmount > availableForCurrentDraw;

    if (safeCurrentDrawAmount < 0) {
      warnings.push(`${row.itemCode}: draw amount cannot be negative.`);
    }

    if (isOverLimit) {
      warnings.push(`${row.itemCode}: draw amount exceeds the remaining available balance (${formatCurrency(availableForCurrentDraw)}).`);
    }

    return {
      row,
      previousDrawn,
      availableForCurrentDraw,
      currentDrawAmount: safeCurrentDrawAmount,
      remainingAmount,
      isOverLimit,
    };
  });

  const totalAmount = summaries.reduce((sum, entry) => sum + (entry.currentDrawAmount > 0 ? entry.currentDrawAmount : 0), 0);

  return { summaries, totalAmount, warnings };
}

export default function BudgetWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { showError, showSuccess } = useNotification();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<BudgetWorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [generatingDraw, setGeneratingDraw] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowForm, setRowForm] = useState<BudgetRowFormState>(initialRowForm);
  const [drawDate, setDrawDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [drawAmounts, setDrawAmounts] = useState<Record<string, string>>({});

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const isFinalApproved = workspace?.budget.status === 'finalApprovedBudget';
  const budgetRows = workspace?.rows || [];
  const draws = workspace?.draws || [];
  const groupedRows = useMemo(() => groupRows(budgetRows), [budgetRows]);
  const previousTotals = useMemo(() => getPreviousDrawTotals(draws), [draws]);
  const totalBudget = useMemo(() => budgetRows.reduce((sum, row) => sum + row.totalAmount, 0), [budgetRows]);
  const totalDrawn = useMemo(() => draws.reduce((sum, draw) => sum + draw.totalAmount, 0), [draws]);
  const remainingOverall = Math.max(totalBudget - totalDrawn, 0);
  const nextDrawNumber = getNextDrawNumber(draws);
  const currentDrawCalculation = useMemo(() => buildDrawTotals(budgetRows, draws, drawAmounts), [budgetRows, draws, drawAmounts]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchWorkspace();
  }, [user, id]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<BudgetWorkspaceState>(`/budget?projectId=${id}`);
      setWorkspace(data);
      setEditingRowId(null);
      setRowForm(initialRowForm);
      setDrawAmounts({});
      setDrawDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      console.error('Failed to load budget workspace:', error);
      showError('Failed to load budget workspace');
    } finally {
      setLoading(false);
    }
  };

  const startEditRow = (row: BudgetRow) => {
    setEditingRowId(row.id);
    setRowForm({
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      quantity: String(row.quantity),
      unitCost: String(row.unitCost),
      markup: String(row.markup),
      costType: row.costType,
    });
  };

  const clearRowForm = () => {
    setEditingRowId(null);
    setRowForm(initialRowForm);
  };

  const handleSaveRow = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!workspace) return;

    if (!rowForm.categoryCode.trim() || !rowForm.categoryName.trim() || !rowForm.itemCode.trim() || !rowForm.itemName.trim()) {
      showError('Category code, category name, item code, and item name are required');
      return;
    }

    const quantity = Number(rowForm.quantity);
    const unitCost = Number(rowForm.unitCost);
    const markup = Number(rowForm.markup);

    if (!Number.isFinite(quantity) || !Number.isFinite(unitCost) || !Number.isFinite(markup) || quantity < 0 || unitCost < 0 || markup < 0) {
      showError('Quantity, unit cost, and markup must be valid non-negative numbers');
      return;
    }

    try {
      setSavingRowId(editingRowId || 'new');

      const payload = {
        categoryCode: rowForm.categoryCode.trim(),
        categoryName: rowForm.categoryName.trim(),
        itemCode: rowForm.itemCode.trim(),
        itemName: rowForm.itemName.trim(),
        description: rowForm.description.trim(),
        quantity,
        unitCost,
        markup,
        costType: rowForm.costType,
      };

      if (editingRowId) {
        await apiClient.patch(`/budget/rows/${editingRowId}?projectId=${id}`, payload);
        showSuccess('Budget line item updated');
      } else {
        await apiClient.post('/budget/rows', { projectId: id, ...payload });
        showSuccess('Budget line item added');
      }

      await fetchWorkspace();
    } catch (error) {
      console.error('Failed to save budget line item:', error);
      showError(error instanceof Error ? error.message : 'Failed to save budget line item');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Delete this budget line item?')) return;

    try {
      setSavingRowId(rowId);
      await apiClient.delete(`/budget/rows/${rowId}?projectId=${id}`);
      if (editingRowId === rowId) {
        clearRowForm();
      }
      await fetchWorkspace();
      showSuccess('Budget line item deleted');
    } catch (error) {
      console.error('Failed to delete budget line item:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete budget line item');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleFinalizeBudget = async () => {
    try {
      setFinalizing(true);
      await apiClient.post('/budget/finalize', { projectId: id, finalizedBy: user?.uid || '' });
      showSuccess('Budget finalized');
      await fetchWorkspace();
    } catch (error) {
      console.error('Failed to finalize budget:', error);
      showError(error instanceof Error ? error.message : 'Failed to finalize budget');
    } finally {
      setFinalizing(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!workspace) return;

    if (currentDrawCalculation.warnings.length > 0) {
      showError('Resolve validation errors before generating the invoice');
      return;
    }

    if (currentDrawCalculation.totalAmount <= 0) {
      showError('Enter at least one draw amount greater than 0');
      return;
    }

    try {
      setGeneratingDraw(true);
      await apiClient.post('/budget/draws', {
        projectId: id,
        amounts: drawAmounts,
        createdBy: user?.uid || '',
        date: drawDate,
      });
      showSuccess('Invoice PDF generated and saved');
      await fetchWorkspace();
    } catch (error) {
      console.error('Failed to generate draw invoice:', error);
      showError(error instanceof Error ? error.message : 'Failed to generate invoice PDF');
    } finally {
      setGeneratingDraw(false);
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading budget workspace..." />;
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Budget workspace not found</div>
      </div>
    );
  }

  const Header = isBuilder ? BuilderHeader : ClientHeader;

  return (
    <div className="min-h-screen bg-gradient-to-b from-taupe-50 via-white to-taupe-100">
      <Header
        title="Budget & Draws"
        subtitle={workspace.project.name || workspace.project.address || 'Project budget workspace'}
        showBackButton
        actions={isBuilder && !isFinalApproved ? (
          <Button onClick={handleFinalizeBudget} disabled={finalizing || budgetRows.length === 0} size="sm">
            {finalizing ? 'Finalizing...' : 'Finalize Budget'}
          </Button>
        ) : undefined}
      />
      <ProjectTabs projectId={id} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isFinalApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isFinalApproved ? 'Final Approved Budget' : 'Draft Budget'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">{groupedRows.length} Categor{groupedRows.length === 1 ? 'y' : 'ies'}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">{draws.length} Draw{draws.length === 1 ? '' : 's'}</span>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Project Budget Summary</h2>
              <p className="text-neutral-600 max-w-2xl">This budget mirrors the grouped estimate format: each category has a code, name, and total, with detailed line items beneath it.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-full lg:min-w-[520px]">
              <div className="rounded-card border border-neutral-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-neutral-500">Budget Total</div><div className="text-xl font-semibold text-neutral-900 mt-1">{formatCurrency(totalBudget)}</div></div>
              <div className="rounded-card border border-neutral-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-neutral-500">Total Drawn</div><div className="text-xl font-semibold text-neutral-900 mt-1">{formatCurrency(totalDrawn)}</div></div>
              <div className="rounded-card border border-neutral-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-neutral-500">Remaining</div><div className="text-xl font-semibold text-neutral-900 mt-1">{formatCurrency(remainingOverall)}</div></div>
              <div className="rounded-card border border-neutral-200 bg-white p-4"><div className="text-xs uppercase tracking-wide text-neutral-500">Next Draw</div><div className="text-xl font-semibold text-neutral-900 mt-1">Draw {nextDrawNumber}</div></div>
            </div>
          </div>
        </Card>

        {isBuilder && !isFinalApproved && (
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div><h3 className="text-lg font-semibold text-neutral-900">Budget Builder</h3><p className="text-sm text-neutral-600">Add grouped categories and line items while the budget is in draft status.</p></div>
              {editingRowId && <Button type="button" variant="outline" size="sm" onClick={clearRowForm}>Cancel Edit</Button>}
            </div>

            <form onSubmit={handleSaveRow} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input label="Category Code" value={rowForm.categoryCode} onChange={(e) => setRowForm((prev) => ({ ...prev, categoryCode: e.target.value }))} placeholder="1100" />
              <Input label="Category Name" value={rowForm.categoryName} onChange={(e) => setRowForm((prev) => ({ ...prev, categoryName: e.target.value }))} placeholder="Site Prep" />
              <Input label="Item Code" value={rowForm.itemCode} onChange={(e) => setRowForm((prev) => ({ ...prev, itemCode: e.target.value }))} placeholder="1150" />
              <Input label="Item Name" value={rowForm.itemName} onChange={(e) => setRowForm((prev) => ({ ...prev, itemName: e.target.value }))} placeholder="Site Demolition + Earthwork" />
              <Input label="Description / Notes" value={rowForm.description} onChange={(e) => setRowForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Clearing for home site..." />
              <div><label className="block text-sm font-medium text-neutral-700 mb-2">Cost Type</label><select value={rowForm.costType} onChange={(e) => setRowForm((prev) => ({ ...prev, costType: e.target.value as CostType }))} className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"><option value="labor">Labor</option><option value="material">Material</option><option value="laborMaterial">Labor & Material</option></select></div>
              <Input label="Quantity" type="number" min="0" step="1" value={rowForm.quantity} onChange={(e) => setRowForm((prev) => ({ ...prev, quantity: e.target.value }))} />
              <Input label="Unit Cost" type="number" min="0" step="0.01" value={rowForm.unitCost} onChange={(e) => setRowForm((prev) => ({ ...prev, unitCost: e.target.value }))} />
              <Input label="Markup" type="number" min="0" step="0.01" value={rowForm.markup} onChange={(e) => setRowForm((prev) => ({ ...prev, markup: e.target.value }))} />
              <div className="flex items-end"><Button type="submit" disabled={savingRowId !== null} className="w-full">{savingRowId ? 'Saving...' : editingRowId ? 'Update Item' : 'Add Item'}</Button></div>
            </form>

            <div className="space-y-6">
              {groupedRows.map((group) => (
                <div key={`${group.categoryCode}-${group.categoryName}`} className="rounded-card border border-neutral-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-4 bg-taupe-50 px-4 py-3 border-b border-neutral-200">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{group.categoryCode} {group.categoryName}</div>
                      <div className="text-xs text-neutral-500">Category code and category name</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wide text-neutral-500">Category Total</div>
                      <div className="font-semibold text-neutral-900">{formatCurrency(group.totalAmount)}</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-neutral-600 bg-white">
                          <th className="py-3 px-4">Item Code</th>
                          <th className="py-3 px-4">Item Name</th>
                          <th className="py-3 px-4">Description / Notes</th>
                          <th className="py-3 px-4">Qty</th>
                          <th className="py-3 px-4">Unit Cost</th>
                          <th className="py-3 px-4">Markup</th>
                          <th className="py-3 px-4">Total</th>
                          <th className="py-3 px-4">Cost Type</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.lineItems.map((row) => (
                          <tr key={row.id} className="border-b border-neutral-100 align-top">
                            <td className="py-3 px-4 font-medium text-neutral-900">{row.itemCode}</td>
                            <td className="py-3 px-4 text-neutral-900">{row.itemName}</td>
                            <td className="py-3 px-4 text-neutral-600 max-w-[320px] whitespace-pre-wrap">{row.description || '—'}</td>
                            <td className="py-3 px-4 text-neutral-700">{row.quantity}</td>
                            <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.unitCost)}</td>
                            <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.markup)}</td>
                            <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.totalAmount)}</td>
                            <td className="py-3 px-4 text-neutral-700">{costTypeLabels[row.costType]}</td>
                            <td className="py-3 px-4"><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => startEditRow(row)}>Edit</Button><Button type="button" variant="secondary" size="sm" onClick={() => handleDeleteRow(row.id)}>Delete</Button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {groupedRows.length === 0 && <div className="rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">No budget line items yet. Add the first category group above.</div>}
            </div>
          </Card>
        )}

        {(isFinalApproved || !isBuilder) && (
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div><h3 className="text-lg font-semibold text-neutral-900">Finalized Budget</h3><p className="text-sm text-neutral-600">Read-only grouped budget with category totals and line items.</p></div>
              {isFinalApproved && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Client Visible</span>}
            </div>

            {isFinalApproved ? (
              <div className="space-y-6">
                {groupedRows.map((group) => (
                  <div key={`final-${group.categoryCode}-${group.categoryName}`} className="rounded-card border border-neutral-200 overflow-hidden">
                    <div className="flex items-center justify-between gap-4 bg-taupe-50 px-4 py-3 border-b border-neutral-200">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{group.categoryCode} {group.categoryName}</div>
                        <div className="text-xs text-neutral-500">Category code and category name</div>
                      </div>
                      <div className="text-right"><div className="text-xs uppercase tracking-wide text-neutral-500">Category Total</div><div className="font-semibold text-neutral-900">{formatCurrency(group.totalAmount)}</div></div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-left text-neutral-600 bg-white">
                            <th className="py-3 px-4">Item Code</th>
                            <th className="py-3 px-4">Item Name</th>
                            <th className="py-3 px-4">Description / Notes</th>
                            <th className="py-3 px-4">Qty</th>
                            <th className="py-3 px-4">Unit Cost</th>
                            <th className="py-3 px-4">Markup</th>
                            <th className="py-3 px-4">Total</th>
                            <th className="py-3 px-4">Cost Type</th>
                            <th className="py-3 px-4">Previously Drawn</th>
                            <th className="py-3 px-4">Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.lineItems.map((row) => {
                            const previousDrawn = previousTotals[row.id] || 0;
                            const remaining = Math.max(row.totalAmount - previousDrawn, 0);

                            return (
                              <tr key={`final-${row.id}`} className="border-b border-neutral-100 align-top">
                                <td className="py-3 px-4 font-medium text-neutral-900">{row.itemCode}</td>
                                <td className="py-3 px-4 text-neutral-900">{row.itemName}</td>
                                <td className="py-3 px-4 text-neutral-600 max-w-[320px] whitespace-pre-wrap">{row.description || '—'}</td>
                                <td className="py-3 px-4 text-neutral-700">{row.quantity}</td>
                                <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.unitCost)}</td>
                                <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.markup)}</td>
                                <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.totalAmount)}</td>
                                <td className="py-3 px-4 text-neutral-700">{costTypeLabels[row.costType]}</td>
                                <td className="py-3 px-4 text-neutral-700">{formatCurrency(previousDrawn)}</td>
                                <td className="py-3 px-4 text-neutral-700">{formatCurrency(remaining)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {groupedRows.length === 0 && <div className="rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">No finalized budget line items are available.</div>}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">The builder has not finalized the budget yet. This section will become visible once the final approved budget is published.</div>
            )}
          </Card>
        )}

        {isBuilder && isFinalApproved && (
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div><h3 className="text-lg font-semibold text-neutral-900">Draw Invoicing</h3><p className="text-sm text-neutral-600">Enter a draw amount per finalized budget line item. Only rows above zero are included in the PDF.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-700">
                <div className="rounded-card border border-neutral-200 bg-white px-4 py-3"><div className="text-xs uppercase tracking-wide text-neutral-500">Draft Draw</div><div className="font-semibold text-neutral-900">Draw {nextDrawNumber}</div></div>
                <div className="rounded-card border border-neutral-200 bg-white px-4 py-3"><div className="text-xs uppercase tracking-wide text-neutral-500">Current Draw Total</div><div className="font-semibold text-neutral-900">{formatCurrency(currentDrawCalculation.totalAmount)}</div></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input label="Invoice Date" type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
              <div className="md:col-span-2 rounded-card border border-neutral-200 bg-taupe-50 px-4 py-3 flex items-center justify-between gap-4">
                <div><div className="text-xs uppercase tracking-wide text-neutral-500">Invoice Number</div><div className="font-semibold text-neutral-900">INV-{id.slice(0, 4).toUpperCase()}-{String(nextDrawNumber).padStart(3, '0')}</div></div>
                <div className="text-right"><div className="text-xs uppercase tracking-wide text-neutral-500">Remaining Budget</div><div className="font-semibold text-neutral-900">{formatCurrency(remainingOverall)}</div></div>
              </div>
            </div>

            <div className="space-y-6">
              {groupedRows.map((group) => (
                <div key={`draw-${group.categoryCode}-${group.categoryName}`} className="rounded-card border border-neutral-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-4 bg-taupe-50 px-4 py-3 border-b border-neutral-200">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{group.categoryCode} {group.categoryName}</div>
                      <div className="text-xs text-neutral-500">Category code and category name</div>
                    </div>
                    <div className="text-right"><div className="text-xs uppercase tracking-wide text-neutral-500">Category Total</div><div className="font-semibold text-neutral-900">{formatCurrency(group.totalAmount)}</div></div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left text-neutral-600 bg-white">
                          <th className="py-3 px-4">Item Code</th>
                          <th className="py-3 px-4">Item Name</th>
                          <th className="py-3 px-4">Description / Notes</th>
                          <th className="py-3 px-4">Qty</th>
                          <th className="py-3 px-4">Unit Cost</th>
                          <th className="py-3 px-4">Markup</th>
                          <th className="py-3 px-4">Total</th>
                          <th className="py-3 px-4">Cost Type</th>
                          <th className="py-3 px-4">Previously Drawn</th>
                          <th className="py-3 px-4">Draw Amount</th>
                          <th className="py-3 px-4">Remaining After Draw</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.lineItems.map((row) => {
                          const previousDrawn = previousTotals[row.id] || 0;
                          const availableForCurrentDraw = row.totalAmount - previousDrawn;
                          const remaining = row.totalAmount - previousDrawn - Number(drawAmounts[row.id] || 0);
                          const overLimit = Number(drawAmounts[row.id] || 0) > availableForCurrentDraw;

                          return (
                            <tr key={`draw-row-${row.id}`} className="border-b border-neutral-100 align-top">
                              <td className="py-3 px-4 font-medium text-neutral-900">{row.itemCode}</td>
                              <td className="py-3 px-4 text-neutral-900">{row.itemName}</td>
                              <td className="py-3 px-4 text-neutral-600 max-w-[320px] whitespace-pre-wrap">{row.description || '—'}</td>
                              <td className="py-3 px-4 text-neutral-700">{row.quantity}</td>
                              <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.unitCost)}</td>
                              <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.markup)}</td>
                              <td className="py-3 px-4 text-neutral-700">{formatCurrency(row.totalAmount)}</td>
                              <td className="py-3 px-4 text-neutral-700">{costTypeLabels[row.costType]}</td>
                              <td className="py-3 px-4 text-neutral-700">{formatCurrency(previousDrawn)}</td>
                              <td className="py-3 px-4 min-w-[150px]"><Input type="number" min="0" step="0.01" value={drawAmounts[row.id] ?? ''} onChange={(e) => setDrawAmounts((prev) => ({ ...prev, [row.id]: e.target.value }))} placeholder="0.00" error={overLimit ? `Max ${formatCurrency(availableForCurrentDraw)}` : undefined} /></td>
                              <td className="py-3 px-4 text-neutral-700">{formatCurrency(remaining)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {groupedRows.length === 0 && <div className="rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">No finalized budget line items are available for invoicing.</div>}
            </div>

            {currentDrawCalculation.warnings.length > 0 && <div className="mt-5 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1">{currentDrawCalculation.warnings.map((warning) => <div key={warning}>{warning}</div>)}</div>}

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-neutral-600">Only rows with a positive draw amount are added to the invoice PDF.</div>
              <Button type="button" onClick={handleGenerateInvoice} disabled={generatingDraw || currentDrawCalculation.totalAmount <= 0 || currentDrawCalculation.warnings.length > 0}>{generatingDraw ? 'Generating PDF...' : 'Generate Invoice PDF'}</Button>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Generated Draw Invoices</h3>
              <p className="text-sm text-neutral-600">Download stored PDFs for every generated draw invoice.</p>
            </div>
            <div className="text-sm text-neutral-500">{draws.length} saved invoice{draws.length === 1 ? '' : 's'}</div>
          </div>

          {draws.length === 0 ? (
            <div className="rounded-card border border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-600">No draw invoices have been generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-600"><th className="py-3 pr-4">Invoice #</th><th className="py-3 pr-4">Draw</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Download</th></tr>
                </thead>
                <tbody>
                  {draws.slice().reverse().map((draw) => (
                    <tr key={draw.id} className="border-b border-neutral-100"><td className="py-3 pr-4 font-medium text-neutral-900">{draw.invoiceNumber}</td><td className="py-3 pr-4 text-neutral-700">Draw {draw.drawNumber}</td><td className="py-3 pr-4 text-neutral-700">{draw.date}</td><td className="py-3 pr-4 text-neutral-700">{formatCurrency(draw.totalAmount)}</td><td className="py-3 pr-4"><a href={draw.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex"><Button type="button" variant="outline" size="sm">Download PDF</Button></a></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!isBuilder && !isFinalApproved && (
          <Card><div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-amber-900">The budget has not been finalized yet. Final approved budgets and invoice PDFs will appear here once the builder approves them.</div></Card>
        )}
      </main>
    </div>
  );
}