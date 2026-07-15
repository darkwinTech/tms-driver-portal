// Client-side Excel template generation + parsing, using the 'xlsx' package
// directly in the browser since there is no server to do this for us.
// Column set mirrors the current Create Driver form: Group/Customer, Driver
// Class, Operating Hours are NOT part of the requester-facing template (see
// src/utils/constants.js hiddenFromRequester).
import * as XLSX from 'xlsx';
import { validateDriverRow } from '../utils/validators.js';

const COLUMNS = [
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Email Address', key: 'email' },
  { header: 'Mobile Number', key: 'phone' },
  { header: 'Driver License Number (CR)', key: 'licenseNumber' },
  { header: 'Driver License Expiration Date (CR)', key: 'licenseExpiry' },
  { header: 'Driver/Car Insurance (CR)', key: 'hasInsurance' },
  { header: 'Driver City (CR)', key: 'city' },
  { header: 'PO Number', key: 'poNumber' },
  { header: 'PO Expiry Date (YYYY-MM-DD)', key: 'poExpiry' },
];

export function buildTemplateBlob() {
  const headerRow = COLUMNS.map((c) => c.header);
  const instructionRow = [
    'Replace with First Name',
    'Replace with Last Name',
    'Replace with Email Address',
    'Replace with Mobile Number',
    'Replace with Driver License Number',
    'Replace with License Expiration Date (YYYY-MM-DD)',
    'Replace with Yes or No',
    'Replace with Driver City',
    'Replace with PO Number',
    'Replace with Expiry Date (YYYY-MM-DD)',
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, instructionRow]);
  worksheet['!cols'] = COLUMNS.map(() => ({ wch: 24 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function parseDriverExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const headerToKey = COLUMNS.reduce((acc, c) => {
          acc[c.header] = c.key;
          return acc;
        }, {});

        const drivers = [];
        const errors = [];

        rawRows.forEach((raw, idx) => {
          // sheet_to_json uses the header row as keys and doesn't include it
          // in rawRows, so idx 0 is the instruction row - skip it.
          if (idx === 0) return;

          const row = {};
          Object.entries(raw).forEach(([header, value]) => {
            const key = headerToKey[header.trim()];
            if (key) {
              row[key] = typeof value === 'string' ? value.trim() : value;
            }
          });

          const hasAnyValue = Object.values(row).some((v) => v !== '' && v !== undefined && v !== null);
          if (!hasAnyValue) return;

          row.role = 'Privileged User';

          const rowErrors = validateDriverRow(row, { requireCreateFields: true });
          // idx=1 is the first real data row - report it as "Row 1" to match
          // the driver grid's own 1-indexed rows.
          if (rowErrors.length) {
            errors.push({ row: idx, errors: rowErrors });
          }

          drivers.push(row);
        });

        resolve({ drivers, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function buildDriversExportBlob(drivers) {
  const rows = drivers.map((d) => ({
    Username: d.username,
    'First Name': d.firstName,
    'Last Name': d.lastName,
    'Email Address': d.email,
    'Mobile Number': d.phone,
    Role: d.role,
    'Group / Customer': d.customerGroup,
    'Driver Class': d.driverClass,
    'Operating Hours': d.operatingHours,
    'Driver License Number (CR)': d.licenseNumber,
    'Driver License Expiration Date (CR)': d.licenseExpiry,
    'Driver/Car Insurance (CR)': d.hasInsurance,
    'Driver City (CR)': d.city,
    'PO Number': d.poNumber,
    'PO Expiry Date': d.poExpiry,
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');
  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function buildRequestsReportBlob(requests) {
  const rows = requests.map((r) => ({
    'Request Number': r.requestNumber,
    Requester: r.requester?.fullName,
    'Requester Email': r.requester?.email,
    Type: r.requestType?.name,
    Status: r.status?.name,
    'Driver Count': r.drivers?.length || 0,
    'Submitted Date': r.submittedDate ? r.submittedDate.slice(0, 10) : '',
    'Completed Date': r.completedDate ? r.completedDate.slice(0, 10) : '',
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
