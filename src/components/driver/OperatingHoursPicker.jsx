import { useEffect, useState } from 'react';

const DAYS = [
  { key: 'Sun', label: 'Sun' },
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
];

const DAY_ORDER = DAYS.map((d) => d.key);

const DEFAULT_OPEN_AT = '1:00 PM';
const DEFAULT_CLOSE_AT = '9:00 PM';
const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function buildTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? 'AM' : 'PM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      options.push(`${hour12}:${m === 0 ? '00' : '30'} ${period}`);
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function parseValue(value) {
  const match = typeof value === 'string' && value.match(/^([A-Za-z,]+)\s+(.+)-(.+)$/);
  if (!match) return { openAt: DEFAULT_OPEN_AT, closeAt: DEFAULT_CLOSE_AT, days: DEFAULT_DAYS };
  const [, daysStr, openAt, closeAt] = match;
  return { openAt: openAt.trim(), closeAt: closeAt.trim(), days: daysStr.split(',').filter((d) => DAY_ORDER.includes(d)) };
}

function composeValue({ openAt, closeAt, days }) {
  if (!days.length) return '';
  return `${days.join(',')} ${openAt}-${closeAt}`;
}

/**
 * Picker for a driver's allowed operating window: open/close time selects
 * plus day-of-week checkboxes, composed into the same "Days HH:MM-HH:MM"
 * string the rest of the app already stores for operatingHours.
 */
export default function OperatingHoursPicker({ value, onChange }) {
  const initial = parseValue(value);
  const [openAt, setOpenAt] = useState(initial.openAt);
  const [closeAt, setCloseAt] = useState(initial.closeAt);
  const [days, setDays] = useState(initial.days);

  useEffect(() => {
    onChange(composeValue({ openAt, closeAt, days }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAt, closeAt, days]);

  function toggleDay(day) {
    setDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return DAY_ORDER.filter((k) => next.includes(k));
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Open at</label>
          <select
            value={openAt}
            onChange={(e) => setOpenAt(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Close at</label>
          <select
            value={closeAt}
            onChange={(e) => setCloseAt(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {DAYS.map((d) => (
          <label key={d.key} className="flex items-center gap-1 text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={days.includes(d.key)}
              onChange={() => toggleDay(d.key)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            {d.label}
          </label>
        ))}
      </div>
    </div>
  );
}
