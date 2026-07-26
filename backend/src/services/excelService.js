import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { validateDriverRow } from '../utils/validators.js';
import { KSA_CITIES } from '../utils/constants.js';

export const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Column order mirrors DRIVER_FIELDS' createOnly fields (username/role are
// system-assigned, Group/Customer/Driver Class/Operating Hours are
// Operations-only - none of those belong in the requester-facing template).
const COLUMNS = [
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Email Address', key: 'email' },
  { header: 'Mobile Number', key: 'phone' },
  { header: 'Driver License/ID/IQAMA Number (CR)', key: 'licenseNumber' },
  { header: 'Driver License Expiration Date (CR)', key: 'licenseExpiry' },
  { header: 'Driver ID/IQAMA Expiration Date (CR)', key: 'IDExpiry' },
  { header: 'Driver/Car Insurance (CR)', key: 'hasInsurance' },
  { header: 'Driver City (CR)', key: 'city' },
  { header: 'PO Number', key: 'poNumber' },
  { header: 'PO Expiry Date (YYYY-MM-DD)', key: 'poExpiry' },
];

const DATE_COLUMN_KEYS = new Set(['licenseExpiry', 'IDExpiry', 'poExpiry']);

const COLUMN_HINTS = {
  firstName: 'Enter the driver first name (2-50 letters). This field is required.',
  lastName: 'Enter the driver last name (2-50 letters). This field is required.',
  email: 'Enter a valid email address, for example: name@example.com',
  phone: 'Enter the mobile number using digits only, for example: 0552112332',
  licenseNumber: 'Enter the driver License/ID/IQAMA number using digits only (5-20 digits). This field is required.',
  licenseExpiry: 'Enter a valid current or future date in YYYY-MM-DD format.',
  IDExpiry: 'Enter a valid current or future date in YYYY-MM-DD format.',
  hasInsurance: 'Select Yes or No from the dropdown list.',
  city: 'Select a city from the dropdown list.',
  poNumber: 'Enter the PO number using digits only (3-30 digits). This field is required.',
  poExpiry: 'Enter a valid current or future PO expiry date in YYYY-MM-DD format.',
};

function normalizeText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function excelSerialDateToISO(serial) {
  if (!serial || Number.isNaN(Number(serial))) return '';
  const utcDays = Math.floor(Number(serial) - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeDateValue(value) {
  if (value === undefined || value === null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    return excelSerialDateToISO(value);
  }
  const text = String(value).trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

function applyRequiredTextValidation(cell, message, { minLength, maxLength } = {}) {
  const address = cell.address;
  const lengthChecks = [];
  if (minLength) lengthChecks.push(`LEN(TRIM(${address}&""))>=${minLength}`);
  if (maxLength) lengthChecks.push(`LEN(TRIM(${address}&""))<=${maxLength}`);
  const formula = lengthChecks.length ? `AND(${lengthChecks.join(',')})` : `LEN(TRIM(${address}&""))>0`;

  cell.dataValidation = {
    type: 'custom',
    allowBlank: false,
    formulae: [formula],
    showInputMessage: true,
    promptTitle: 'Required Field',
    prompt: message,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Required Field',
    error: minLength || maxLength
      ? `This field is required and must be ${minLength || 1}-${maxLength || 'any'} characters long.`
      : 'This field is required. Please enter a value.',
  };
}

function applyNumericTextValidation(cell, message, { minLength, maxLength } = {}) {
  const address = cell.address;
  const lengthChecks = [`ISNUMBER(--(${address}&""))`];
  if (minLength) lengthChecks.push(`LEN(TRIM(${address}&""))>=${minLength}`);
  if (maxLength) lengthChecks.push(`LEN(TRIM(${address}&""))<=${maxLength}`);

  cell.numFmt = '@';
  cell.dataValidation = {
    type: 'custom',
    allowBlank: false,
    formulae: [`AND(${lengthChecks.join(',')})`],
    showInputMessage: true,
    promptTitle: 'Required Field',
    prompt: message,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Invalid Value',
    error: `This field is required and must contain only digits (${minLength || 1}-${maxLength || 'any'} digits).`,
  };
}

function applyEmailValidation(cell, rowNumber) {
  cell.dataValidation = {
    type: 'custom',
    allowBlank: false,
    formulae: [`AND(LEN(TRIM(C${rowNumber}&""))>0,ISNUMBER(SEARCH("@",C${rowNumber})),ISNUMBER(SEARCH(".",C${rowNumber})))`],
    showInputMessage: true,
    promptTitle: 'Email Address',
    prompt: COLUMN_HINTS.email,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Invalid Email',
    error: 'Please enter a valid email address, for example: name@example.com',
  };
}

function applyPhoneValidation(cell, rowNumber) {
  cell.numFmt = '@';
  cell.dataValidation = {
    type: 'custom',
    allowBlank: false,
    formulae: [`AND(LEN(TRIM(D${rowNumber}&""))>=9,LEN(TRIM(D${rowNumber}&""))<=15,ISNUMBER(--(D${rowNumber}&"")))`],
    showInputMessage: true,
    promptTitle: 'Mobile Number',
    prompt: COLUMN_HINTS.phone,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Invalid Mobile Number',
    error: 'Please enter a valid mobile number using digits only.',
  };
}

function applyDateValidation(cell, rowNumber, columnLetter, prompt, errorTitle) {
  cell.numFmt = 'yyyy-mm-dd';
  cell.dataValidation = {
    type: 'custom',
    allowBlank: false,
    formulae: [`AND(ISNUMBER(${columnLetter}${rowNumber}),${columnLetter}${rowNumber}>=TODAY())`],
    showInputMessage: true,
    promptTitle: 'Date Format',
    prompt,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle,
    error: 'Please enter a valid current or future date in YYYY-MM-DD format.',
  };
}

function applyYesNoValidation(cell) {
  cell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: ['"Yes,No"'],
    showInputMessage: true,
    promptTitle: 'Insurance',
    prompt: COLUMN_HINTS.hasInsurance,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Invalid Value',
    error: 'Please select Yes or No.',
  };
}

function applyCityValidation(cell, citySheetName, cityCount) {
  cell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`${citySheetName}!$A$1:$A$${cityCount}`],
    showInputMessage: true,
    promptTitle: 'Driver City',
    prompt: COLUMN_HINTS.city,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Invalid City',
    error: 'Please select a city from the dropdown list.',
  };
}

export async function buildTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Drivers');

  const listsSheet = workbook.addWorksheet('Lists');
  KSA_CITIES.forEach((city, idx) => {
    listsSheet.getCell(`A${idx + 1}`).value = city;
  });
  listsSheet.state = 'hidden';

  worksheet.columns = COLUMNS.map((column) => ({ header: column.header, key: column.key, width: 30 }));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 34;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  headerRow.eachCell((cell, colNumber) => {
    const column = COLUMNS[colNumber - 1];
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9E2F3' } } };
    if (column && COLUMN_HINTS[column.key]) {
      cell.note = COLUMN_HINTS[column.key];
    }
  });

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (let rowNumber = 2; rowNumber <= 501; rowNumber += 1) {
    const firstNameCell = worksheet.getCell(`A${rowNumber}`);
    const lastNameCell = worksheet.getCell(`B${rowNumber}`);
    const emailCell = worksheet.getCell(`C${rowNumber}`);
    const phoneCell = worksheet.getCell(`D${rowNumber}`);
    const licenseNumberCell = worksheet.getCell(`E${rowNumber}`);
    const licenseExpiryCell = worksheet.getCell(`F${rowNumber}`);
    const idExpiryCell = worksheet.getCell(`G${rowNumber}`);
    const insuranceCell = worksheet.getCell(`H${rowNumber}`);
    const cityCell = worksheet.getCell(`I${rowNumber}`);
    const poNumberCell = worksheet.getCell(`J${rowNumber}`);
    const poExpiryCell = worksheet.getCell(`K${rowNumber}`);

    applyRequiredTextValidation(firstNameCell, COLUMN_HINTS.firstName, { minLength: 2, maxLength: 50 });
    applyRequiredTextValidation(lastNameCell, COLUMN_HINTS.lastName, { minLength: 2, maxLength: 50 });
    applyEmailValidation(emailCell, rowNumber);
    applyPhoneValidation(phoneCell, rowNumber);
    applyNumericTextValidation(licenseNumberCell, COLUMN_HINTS.licenseNumber, { minLength: 5, maxLength: 20 });

    applyDateValidation(licenseExpiryCell, rowNumber, 'F', COLUMN_HINTS.licenseExpiry, 'Invalid License Expiry Date');
    applyDateValidation(idExpiryCell, rowNumber, 'G', COLUMN_HINTS.IDExpiry, 'Invalid ID/IQAMA Expiry Date');

    applyYesNoValidation(insuranceCell);
    applyCityValidation(cityCell, 'Lists', KSA_CITIES.length);

    applyNumericTextValidation(poNumberCell, COLUMN_HINTS.poNumber, { minLength: 3, maxLength: 30 });
    applyDateValidation(poExpiryCell, rowNumber, 'K', COLUMN_HINTS.poExpiry, 'Invalid PO Expiry Date');

    worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
  }

  worksheet.getColumn('F').numFmt = 'yyyy-mm-dd';
  worksheet.getColumn('G').numFmt = 'yyyy-mm-dd';
  worksheet.getColumn('K').numFmt = 'yyyy-mm-dd';
  worksheet.getColumn('D').numFmt = '@';

  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  return workbook.xlsx.writeBuffer();
}

export function parseDriverExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  const headerToKey = COLUMNS.reduce((acc, column) => {
    acc[column.header] = column.key;
    return acc;
  }, {});

  const drivers = [];
  const errors = [];

  rawRows.forEach((raw, idx) => {
    const row = {};

    Object.entries(raw).forEach(([header, value]) => {
      const key = headerToKey[String(header).trim()];
      if (!key) return;
      row[key] = DATE_COLUMN_KEYS.has(key) ? normalizeDateValue(value) : normalizeText(value);
    });

    const hasAnyValue = Object.values(row).some((value) => value !== '' && value !== undefined && value !== null);
    if (!hasAnyValue) return;

    row.role = 'Privileged User';

    const rowErrors = validateDriverRow(row, { requireCreateFields: true });
    if (rowErrors.length) {
      errors.push({ row: idx + 1, errors: rowErrors });
    }

    drivers.push(row);
  });

  return { drivers, errors };
}

export function buildDriversExportBuffer(drivers) {
  const rows = drivers.map((driver) => ({
    Username: driver.username,
    'First Name': driver.firstName,
    'Last Name': driver.lastName,
    'Email Address': driver.email,
    'Mobile Number': driver.phone,
    Role: driver.role,
    'Driver License/ID/IQAMA Number (CR)': driver.licenseNumber,
    'Driver License Expiration Date (CR)': driver.licenseExpiry,
    'Driver ID/IQAMA Expiration Date (CR)': driver.IDExpiry,
    'Driver/Car Insurance (CR)': driver.hasInsurance,
    'Driver City (CR)': driver.city,
    'PO Number': driver.poNumber,
    'PO Expiry Date': driver.poExpiry,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function buildRequestsReportBuffer(requests) {
  const rows = requests.map((request) => ({
    'Request Number': request.requestNumber,
    Requester: request.requester?.fullName,
    'Requester Email': request.requester?.email,
    Type: request.requestType?.name,
    Status: request.status?.name,
    'Driver Count': request.drivers?.length || 0,
    'Submitted Date': request.submittedDate ? request.submittedDate.slice(0, 10) : '',
    'Completed Date': request.completedDate ? request.completedDate.slice(0, 10) : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
