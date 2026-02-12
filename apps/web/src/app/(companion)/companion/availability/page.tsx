'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/lib/api-client';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isRecurring: boolean;
  specificDate: string | null;
  isBlocked: boolean;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add slot form
  const [newDay, setNewDay] = useState('MONDAY');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');

  // Block date form
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');

  useEffect(() => {
    apiClient
      .get<AvailabilitySlot[]>('/availability/me')
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setIsLoading(false));
  }, []);

  const recurringSlots = slots.filter((s) => s.isRecurring && !s.isBlocked);
  const blockedSlots = slots.filter((s) => s.isBlocked);

  const handleAddSlot = () => {
    const existing = recurringSlots.filter(
      (s) => s.dayOfWeek !== newDay || s.startTime !== newStart || s.endTime !== newEnd,
    );
    const allSlots = [
      ...existing.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: s.timezone,
      })),
      {
        dayOfWeek: newDay,
        startTime: newStart,
        endTime: newEnd,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    ];
    saveAvailability(allSlots);
  };

  const handleRemoveSlot = (slotToRemove: AvailabilitySlot) => {
    const remaining = recurringSlots
      .filter((s) => s.id !== slotToRemove.id)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: s.timezone,
      }));
    saveAvailability(remaining);
  };

  const saveAvailability = async (
    slotsData: { dayOfWeek: string; startTime: string; endTime: string; timezone: string }[],
  ) => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await apiClient.put<AvailabilitySlot[]>('/availability/me', {
        slots: slotsData,
      });
      setSlots(updated);
      setSuccessMsg('Availability updated');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockDate = async () => {
    if (!blockDate) return;
    setIsSaving(true);
    setError('');
    try {
      await apiClient.post('/availability/me/block', {
        date: blockDate,
        startTime: blockStart,
        endTime: blockEnd,
      });
      const updated = await apiClient.get<AvailabilitySlot[]>('/availability/me');
      setSlots(updated);
      setBlockDate('');
      setSuccessMsg('Date blocked');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to block date');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/availability/me/block/${blockId}`);
      setSlots(slots.filter((s) => s.id !== blockId));
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">Availability</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{successMsg}</div>
      )}

      {/* Weekly Schedule */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Weekly Schedule</h2>
        <p className="mb-4 text-sm text-gray-500">
          Set your recurring availability for each day of the week.
        </p>

        {/* Existing slots grouped by day */}
        <div className="mb-4 space-y-2">
          {DAYS.map((day) => {
            const daySlots = recurringSlots.filter((s) => s.dayOfWeek === day);
            if (daySlots.length === 0) return null;
            return (
              <div key={day} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-1">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <button
                          onClick={() => handleRemoveSlot(slot)}
                          disabled={isSaving}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {recurringSlots.length === 0 && (
            <p className="text-sm text-gray-400">No availability set. Add time slots below.</p>
          )}
        </div>

        {/* Add slot form */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Day</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Start</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">End</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleAddSlot}
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add Slot
          </button>
        </div>
      </div>

      {/* Blocked Dates */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Blocked Dates</h2>
        <p className="mb-4 text-sm text-gray-500">
          Block specific dates when you are unavailable.
        </p>

        {blockedSlots.length > 0 && (
          <div className="mb-4 space-y-2">
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {slot.specificDate
                      ? new Date(slot.specificDate).toLocaleDateString()
                      : DAY_LABELS[slot.dayOfWeek]}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveBlock(slot.id)}
                  disabled={isSaving}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Start</label>
            <input
              type="time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">End</label>
            <input
              type="time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleBlockDate}
            disabled={isSaving || !blockDate}
            className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Block Date
          </button>
        </div>
      </div>
    </div>
  );
}
