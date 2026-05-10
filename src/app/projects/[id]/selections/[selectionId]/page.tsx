'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import VisualApprovalCard from '@/components/selections/VisualApprovalCard';
import CuratedOptionCard from '@/components/selections/CuratedOptionCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import RoomAssignmentSelector, { Room } from '@/components/ui/RoomAssignmentSelector';
import Link from 'next/link';

export default function SelectionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; selectionId: string }> 
}) {
  const { id, selectionId } = use(params);
  const { user, profile } = useAuth();
  const { showError, showSuccess, showWarning } = useNotification();
  const router = useRouter();
  const [selection, setSelection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [builderOrgId, setBuilderOrgId] = useState('');
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [changeOrderReason, setChangeOrderReason] = useState('');
  const [changeOrderAmount, setChangeOrderAmount] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showCustomOption, setShowCustomOption] = useState(false);
  const [customOption, setCustomOption] = useState({
    name: '',
    brand: '',
    linkUrl: '',
    price: 0,
    notes: '',
    imageFile: null as File | null,
    imagePreview: null as string | null,
  });

  // Computed values for options
  const hasOptions = options.length > 0;
  const sortedOptions = [...options].sort((a, b) => {
    const tierOrder = { good: 1, better: 2, best: 3 };
    const aTier = tierOrder[a.tier as keyof typeof tierOrder] || 0;
    const bTier = tierOrder[b.tier as keyof typeof tierOrder] || 0;
    return aTier - bTier;
  });

  // Computed value for latest change order
  const latestChangeOrder = changeOrders.length > 0 ? changeOrders[0] : null;

  // Computed value for user role
  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';

  // Helper function to check if selection is lighting-related
  const isLightingSelection = (sel: any) => {
    if (!sel) return false;
    const categoryName = (sel.categoryName || sel.category || '').toLowerCase();
    return categoryName.includes('light') || categoryName.includes('fixture');
  };

  // Computed value for current selection being lighting
  const isLighting = isLightingSelection(selection);

  useEffect(() => {
    fetchSelection();
  }, [selectionId]);

  useEffect(() => {
    fetchProjectOrg();
  }, [id]);

  useEffect(() => {
    if (!selection) return;
    fetchOptions(selection);
  }, [builderOrgId]);

  const fetchSelection = async () => {
    try {
      const response = await fetch(`/api/items/${selectionId}?projectId=${id}`);
      const data = await response.json();
      setSelection(data.item);
      if (isLightingSelection(data.item)) {
        await fetchRooms();
      }
      if (data.item) {
        await fetchOptions(data.item);
        await fetchChangeOrders(data.item.id);
      }
    } catch (error) {
      console.error('Error fetching selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectOrg = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      const project = data.project || data;
      setBuilderOrgId(project.builderOrgId || project.builderId || '');
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await fetch(`/api/rooms?projectId=${id}`);
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleAssignRoom = async (roomId: string) => {
    if (!selection) return;

    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/items/${selectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          roomId,
          roomName: room.name,
        }),
      });

      if (response.ok) {
        setSelection({ ...selection, roomId, roomName: room.name });
        await fetchRooms();
      } else {
        showError('Failed to assign room');
      }
    } catch (error) {
      console.error('Error assigning room:', error);
      showError('Failed to assign room');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchOptions = async (currentSelection: any) => {
    if (!currentSelection) return;

    try {
      setOptionsLoading(true);
      setOptionsError('');

      const orgId = builderOrgId || currentSelection.builderOrgId || '';
      if (!orgId) {
        setOptions([]);
        return;
      }

      const params = new URLSearchParams({ builderOrgId: orgId });
      if (currentSelection.categoryId) {
        params.set('categoryId', currentSelection.categoryId);
      }

      const response = await fetch(`/api/options?${params.toString()}`);
      const data = await response.json();
      let fetchedOptions = data.options || [];

      if (!currentSelection.categoryId && currentSelection.categoryName) {
        const normalizedName = normalizeKey(currentSelection.categoryName);
        fetchedOptions = fetchedOptions.filter((option: any) => {
          const optionCategoryName = normalizeKey(option.categoryName || option.category || '');
          const optionCategoryId = normalizeKey(option.categoryId || '');
          return optionCategoryName === normalizedName || optionCategoryId === normalizedName;
        });
      }

      setOptions(fetchedOptions);
    } catch (error) {
      console.error('Error fetching options:', error);
      setOptionsError('Failed to load curated options');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleSelectOption = async (option: any) => {
    if (!selection || selection.locked) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/items/${selectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          name: option.title || option.name || selection.name,
          imageUrl: option.imageUrl || selection.imageUrl,
          linkUrl: option.linkUrl || selection.linkUrl,
          actualCost: option.price ?? selection.actualCost,
          selectedOptionId: option.id,
          selectedOptionTier: option.tier || null,
          customOption: false,
          status: selection.status === 'approved' ? selection.status : 'awaitingClientApproval',
        }),
      });

      if (response.ok) {
        setSelection({
          ...selection,
          name: option.title || option.name || selection.name,
          imageUrl: option.imageUrl || selection.imageUrl,
          linkUrl: option.linkUrl || selection.linkUrl,
          actualCost: option.price ?? selection.actualCost,
          selectedOptionId: option.id,
          selectedOptionTier: option.tier || null,
          customOption: false,
          status: selection.status === 'approved' ? selection.status : 'awaiting_approval',
        });
      } else {
        showError('Failed to select option');
      }
    } catch (error) {
      console.error('Error selecting option:', error);
      showError('Failed to select option');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchChangeOrders = async (currentSelectionId: string) => {
    try {
      const response = await fetch(`/api/change-orders?selectionId=${currentSelectionId}`);
      const data = await response.json();
      setChangeOrders(data.changeOrders || []);
    } catch (error) {
      console.error('Error fetching change orders:', error);
    }
  };

  const handleCreateChangeOrder = async () => {
    if (!changeOrderReason.trim()) {
      showWarning('Please provide a reason for the change order');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          selectionId,
          createdBy: user?.uid,
          reason: changeOrderReason,
          proposedActualCost: changeOrderAmount ? Number(changeOrderAmount) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create change order');
      }

      setChangeOrderReason('');
      setChangeOrderAmount('');
      await fetchChangeOrders(selectionId);
    } catch (error: any) {
      showError(error.message || 'Failed to create change order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateChangeOrder = async (changeOrderId: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/change-orders/${changeOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update change order');
      }

      await fetchChangeOrders(selectionId);
      await fetchSelection();
    } catch (error: any) {
      showError(error.message || 'Failed to update change order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCustomOption = async () => {
    if (!customOption.name || !customOption.price) {
      showWarning('Please provide at least a name and price');
      return;
    }

    try {
      setActionLoading(true);
      let imageUrl = '';

      // Upload image if provided
      if (customOption.imageFile) {
        const { uploadFile } = await import('@/lib/api/upload');
        const timestamp = Date.now();
        const fileName = `${timestamp}_${customOption.imageFile.name}`;
        const path = `selections/${fileName}`;
        imageUrl = await uploadFile(customOption.imageFile, path);
      }

      const response = await fetch(`/api/items/${selectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          name: customOption.name,
          brand: customOption.brand,
          linkUrl: customOption.linkUrl,
          actualCost: customOption.price,
          notes: customOption.notes,
          imageUrl: imageUrl || selection.imageUrl,
          status: 'awaitingClientApproval',
          customOption: true,
        }),
      });

      if (response.ok) {
        showSuccess('Custom option submitted for approval!');
        router.push(`/projects/${id}/selections`);
      } else {
        showError('Failed to submit custom option');
      }
    } catch (error) {
      console.error('Error submitting custom option:', error);
      showError('Failed to submit custom option');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/items/${selectionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, userId: user.uid }),
      });

      if (response.ok) {
        showSuccess('Selection approved successfully!');
        router.push(`/projects/${id}/selections`);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to approve selection');
      }
    } catch (error) {
      showError('Failed to approve selection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChange = async () => {
    if (!user || !changeRequest.trim()) {
      showWarning('Please provide a reason for the change request');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          itemId: selectionId,
          requestedBy: user.uid,
          reason: changeRequest,
        }),
      });

      if (response.ok) {
        showSuccess('Change request submitted successfully!');
        router.push(`/projects/${id}/selections`);
      } else {
        showError('Failed to submit change request');
      }
    } catch (error) {
      showError('Failed to submit change request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading selection...</p>
      </div>
    );
  }

  if (!selection) {
      const isLighting = isLightingSelection(selection);
      const hasOptions = options.length > 0;
      const sortedOptions = sortOptionsByTier(options);
      const latestChangeOrder = changeOrders[0];
      const isBuilder = profile?.role === 'builder' || profile?.role === 'designer';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Selection not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link 
          href={`/projects/${id}/selections`} 
          className="text-brass-700 hover:text-brass-800 mb-6 inline-block"
        >
          ← Back to Selections
        </Link>

        <VisualApprovalCard
          imageUrl={selection.imageUrl || '/placeholder-image.jpg'}
          category={selection.categoryName || 'Uncategorized'}
          brand={selection.brand}
          itemName={selection.name}
          allowance={selection.allowance || 0}
          actualCost={selection.actualCost || selection.allowance || 0}
          notes={selection.notes}
          productLink={selection.productLink}
          dueDate={selection.dueDate}
          status={selection.status}
          onApprove={handleApprove}
          onRequestChange={() => setShowChangeForm(true)}
          showActions={
            !selection.locked && 
            (selection.status === 'awaitingClientApproval' || 
             selection.status === 'awaiting_approval' ||
             selection.status === 'notStarted' ||
             selection.status === 'NotStarted')
          }
        />

        {/* Curated Options */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Curated Options</h3>
              <p className="text-sm text-neutral-600">
                Choose your preferred option. This does not approve the selection.
              </p>
            </div>
            {selection.locked && (
              <span className="text-xs uppercase tracking-wide text-neutral-500">Locked</span>
            )}
          </div>

          {optionsLoading && (
            <div className="text-sm text-neutral-600">Loading options...</div>
          )}
          {!optionsLoading && optionsError && (
            <div className="text-sm text-red-600">{optionsError}</div>
          )}
          {!optionsLoading && !optionsError && !hasOptions && (
            <div className="text-sm text-neutral-600">No curated options available for this category.</div>
          )}

          {!optionsLoading && !optionsError && hasOptions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedOptions.map((option) => (
                <CuratedOptionCard
                  key={option.id}
                  imageUrl={option.imageUrl || '/placeholder-image.jpg'}
                  name={option.title || option.name || 'Untitled Option'}
                  price={option.price || 0}
                  tier={option.tier || 'good'}
                  upgradeDifference={(option.price || 0) - (selection.allowance || 0)}
                  selected={selection.selectedOptionId === option.id}
                  onSelect={() => handleSelectOption(option)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Change Orders */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Change Orders</h3>
          {latestChangeOrder ? (
            <div className="space-y-3">
              <div className="text-sm text-neutral-600">
                Status: <span className="font-medium text-neutral-900">{latestChangeOrder.status}</span>
              </div>
              <div className="text-sm text-neutral-600">Reason: {latestChangeOrder.reason}</div>
              {latestChangeOrder.proposedActualCost !== null && (
                <div className="text-sm text-neutral-600">
                  Proposed Cost: ${Number(latestChangeOrder.proposedActualCost).toLocaleString()}
                </div>
              )}
              {!isBuilder && latestChangeOrder.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleUpdateChangeOrder(latestChangeOrder.id, 'approved')}
                    disabled={actionLoading}
                  >
                    Approve Change Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateChangeOrder(latestChangeOrder.id, 'rejected')}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-neutral-600">No change orders yet.</div>
          )}

          {isBuilder && selection.locked && (
            <div className="mt-4 space-y-3">
              <Input
                label="Reason"
                value={changeOrderReason}
                onChange={(e) => setChangeOrderReason(e.target.value)}
                placeholder="Why is a change order needed?"
              />
              <Input
                label="Proposed New Cost"
                type="number"
                value={changeOrderAmount}
                onChange={(e) => setChangeOrderAmount(e.target.value)}
                placeholder="Optional"
              />
              <Button onClick={handleCreateChangeOrder} disabled={actionLoading}>
                Create Change Order
              </Button>
            </div>
          )}
        </Card>

        {/* Builder Room Assignment */}
        {profile && (profile.role === 'builder' || profile.role === 'designer' || profile.role === 'admin') && isLighting && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Room Assignment
            </h3>
            {roomsLoading ? (
              <div className="text-sm text-neutral-600">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="text-sm text-neutral-600">No rooms configured for this project.</div>
            ) : (
              <RoomAssignmentSelector
                rooms={rooms}
                selectedRoomId={selection.roomId}
                onSelect={handleAssignRoom}
                disabled={actionLoading}
              />
            )}
          </Card>
        )}

        {/* Add Custom Option Button */}
        {!showCustomOption && !selection.locked && (
          <div className="mb-6">
            <Button
              onClick={() => setShowCustomOption(true)}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Don't like these options? Add your own
            </Button>
          </div>
        )}

        {/* Custom Option Form */}
        {showCustomOption && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Add Your Own Option
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Name *
                </label>
                <Input
                  type="text"
                  value={customOption.name}
                  onChange={(e) => setCustomOption({ ...customOption, name: e.target.value })}
                  placeholder="e.g., Custom Kitchen Faucet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Brand
                </label>
                <Input
                  type="text"
                  value={customOption.brand}
                  onChange={(e) => setCustomOption({ ...customOption, brand: e.target.value })}
                  placeholder="e.g., Kohler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={customOption.price || ''}
                    onChange={(e) => setCustomOption({ ...customOption, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Link
                </label>
                <Input
                  type="url"
                  value={customOption.linkUrl}
                  onChange={(e) => setCustomOption({ ...customOption, linkUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sample Image (Optional)
                </label>
                {customOption.imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={customOption.imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-button border border-neutral-300"
                    />
                    <button
                      onClick={() => setCustomOption({ ...customOption, imageFile: null, imagePreview: null })}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCustomOption({ 
                            ...customOption, 
                            imageFile: file, 
                            imagePreview: reader.result as string 
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-button file:border-0 file:text-sm file:font-medium file:bg-brass-50 file:text-brass-700 hover:file:bg-brass-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={customOption.notes}
                  onChange={(e) => setCustomOption({ ...customOption, notes: e.target.value })}
                  placeholder="Any additional details..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCustomOption} disabled={actionLoading} className="flex-1">
                  {actionLoading ? 'Uploading...' : 'Submit for Approval'}
                </Button>
                <Button
                  onClick={() => setShowCustomOption(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Change Request Form */}
        {showChangeForm && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Request Change
            </h3>
            <textarea
              className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400 mb-4"
              rows={4}
              placeholder="Please explain what changes you'd like to see..."
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleRequestChange}
                disabled={actionLoading || !changeRequest.trim()}
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangeForm(false);
                  setChangeRequest('');
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Additional Details */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Additional Information
          </h3>
          <div className="space-y-3">
            {selection.linkUrl && (
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-1">Product Link</div>
                <a 
                  href={selection.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brass-700 hover:text-brass-800 underline"
                >
                  View Product Details
                </a>
              </div>
            )}
            
            {selection.roomName && (
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-1">Room Assignment</div>
                <div className="text-neutral-900">{selection.roomName}</div>
              </div>
            )}

            {selection.approvedAt && (
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-1">Approved On</div>
                <div className="text-neutral-900">
                  {new Date(selection.approvedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}

            {selection.locked && (
              <div className="bg-brass-50 border border-brass-200 rounded-button p-3">
                <div className="flex items-center text-brass-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">This selection is locked. Contact builder for changes.</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

const isLightingSelection = (selection: any) => {
  const categoryId = String(selection?.categoryId || '').toLowerCase();
  const categoryName = String(selection?.categoryName || '').toLowerCase();
  return categoryId === 'lighting' || categoryName.includes('lighting');
};

const normalizeKey = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const sortOptionsByTier = (items: any[]) => {
  const order = { good: 1, better: 2, best: 3 } as Record<string, number>;
  return [...items].sort((a, b) => {
    const aTier = String(a.tier || 'good').toLowerCase();
    const bTier = String(b.tier || 'good').toLowerCase();
    return (order[aTier] || 99) - (order[bTier] || 99);
  });
};
