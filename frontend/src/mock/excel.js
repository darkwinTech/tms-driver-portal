// // Client-side Excel template generation + parsing, using the 'xlsx' package
// // directly in the browser since there is no server to do this for us.
// // Column set mirrors the current Create Driver form: Group/Customer, Driver
// // Class, Operating Hours are NOT part of the requester-facing template (see
// // src/utils/constants.js hiddenFromRequester).
// import * as XLSX from 'xlsx';
// import { validateDriverRow } from '../utils/validators.js';

// const COLUMNS = [
//   { header: 'First Name', key: 'firstName' },
//   { header: 'Last Name', key: 'lastName' },
//   { header: 'Email Address', key: 'email' },
//   { header: 'Mobile Number', key: 'phone' },
//   { header: 'Driver License Number (CR)', key: 'licenseNumber' },
//   { header: 'Driver License Expiration Date (CR)', key: 'licenseExpiry' },
//   { header: 'Driver/Car Insurance (CR)', key: 'hasInsurance' },
//   { header: 'Driver City (CR)', key: 'city' },
//   { header: 'PO Number', key: 'poNumber' },
//   { header: 'PO Expiry Date (YYYY-MM-DD)', key: 'poExpiry' },
// ];

// export function buildTemplateBlob() {
//   const headerRow = COLUMNS.map((c) => c.header);
//   const instructionRow = [
//     'Replace with First Name',
//     'Replace with Last Name',
//     'Replace with Email Address',
//     'Replace with Mobile Number',
//     'Replace with Driver License Number',
//     'Replace with License Expiration Date (YYYY-MM-DD)',
//     'Replace with Yes or No',
//     'Replace with Driver City',
//     'Replace with PO Number',
//     'Replace with Expiry Date (YYYY-MM-DD)',
//   ];

//   const worksheet = XLSX.utils.aoa_to_sheet([headerRow, instructionRow]);
//   worksheet['!cols'] = COLUMNS.map(() => ({ wch: 24 }));

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

//   const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
//   return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
// }

// export function parseDriverExcelFile(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onerror = () => reject(reader.error);
//     reader.onload = () => {
//       try {
//         const workbook = XLSX.read(reader.result, { type: 'array' });
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

//         const headerToKey = COLUMNS.reduce((acc, c) => {
//           acc[c.header] = c.key;
//           return acc;
//         }, {});

//         const drivers = [];
//         const errors = [];

//         rawRows.forEach((raw, idx) => {
//           // sheet_to_json uses the header row as keys and doesn't include it
//           // in rawRows, so idx 0 is the instruction row - skip it.
//           if (idx === 0) return;

//           const row = {};
//           Object.entries(raw).forEach(([header, value]) => {
//             const key = headerToKey[header.trim()];
//             if (key) {
//               row[key] = typeof value === 'string' ? value.trim() : value;
//             }
//           });

//           const hasAnyValue = Object.values(row).some((v) => v !== '' && v !== undefined && v !== null);
//           if (!hasAnyValue) return;

//           row.role = 'Privileged User';

//           const rowErrors = validateDriverRow(row, { requireCreateFields: true });
//           // idx=1 is the first real data row - report it as "Row 1" to match
//           // the driver grid's own 1-indexed rows.
//           if (rowErrors.length) {
//             errors.push({ row: idx, errors: rowErrors });
//           }

//           drivers.push(row);
//         });

//         resolve({ drivers, errors });
//       } catch (err) {
//         reject(err);
//       }
//     };
//     reader.readAsArrayBuffer(file);
//   });
// }

// export function buildDriversExportBlob(drivers) {
//   const rows = drivers.map((d) => ({
//     Username: d.username,
//     'First Name': d.firstName,
//     'Last Name': d.lastName,
//     'Email Address': d.email,
//     'Mobile Number': d.phone,
//     Role: d.role,
//     'Driver License Number (CR)': d.licenseNumber,
//     'Driver License Expiration Date (CR)': d.licenseExpiry,
//     'Driver/Car Insurance (CR)': d.hasInsurance,
//     'Driver City (CR)': d.city,
//     'PO Number': d.poNumber,
//     'PO Expiry Date': d.poExpiry,
//   }));
//   const worksheet = XLSX.utils.json_to_sheet(rows);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');
//   const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
//   return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
// }

// export function buildRequestsReportBlob(requests) {
//   const rows = requests.map((r) => ({
//     'Request Number': r.requestNumber,
//     Requester: r.requester?.fullName,
//     'Requester Email': r.requester?.email,
//     Type: r.requestType?.name,
//     Status: r.status?.name,
//     'Driver Count': r.drivers?.length || 0,
//     'Submitted Date': r.submittedDate ? r.submittedDate.slice(0, 10) : '',
//     'Completed Date': r.completedDate ? r.completedDate.slice(0, 10) : '',
//   }));
//   const worksheet = XLSX.utils.json_to_sheet(rows);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
//   const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
//   return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
// }

  // Client-side Excel template generation + parsing.

//

// Template generation uses ExcelJS because it supports Excel data validation

// with input prompts and error messages directly inside the Excel file.

//

// Parsing/export still uses xlsx because the existing project already uses it

// for reading uploaded files and exporting simple reports.

 

import * as XLSX from 'xlsx';

import ExcelJS from 'exceljs';

import { validateDriverRow } from '../utils/validators.js';

 

const EXCEL_MIME_TYPE =

  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

 

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

 

const COLUMN_HINTS = {

  firstName: 'Enter the driver first name. This field is required.',

  lastName: 'Enter the driver last name. This field is required.',

  email: 'Enter a valid email address, for example: name@example.com',

  phone: 'Enter the mobile number using digits only, for example: 0552112332',

  licenseNumber: 'Enter the driver license number. This field is required.',

  licenseExpiry: 'Enter a valid current or future date in YYYY-MM-DD format.',

  hasInsurance: 'Select Yes or No from the dropdown list.',

  city: 'Enter the driver city. This field is required.',

  poNumber: 'Enter the PO number. This field is required.',

  poExpiry: 'Enter a valid current or future PO expiry date in YYYY-MM-DD format.',

};

 

function normalizeText(value) {

  if (value === undefined || value === null) return '';

  return String(value).trim();

}

 

function excelSerialDateToISO(serial) {

  if (!serial || Number.isNaN(Number(serial))) return '';

 

  // Excel serial date conversion.

  // Excel incorrectly treats 1900 as a leap year, so 25569 is the offset to Unix epoch.

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

 

  // If already YYYY-MM-DD, keep it.

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {

    return text;

  }

 

  // Try to parse common date strings.

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {

    return parsed.toISOString().slice(0, 10);

  }

 

  return text;

}

 

function applyRequiredTextValidation(cell, message) {

  cell.dataValidation = {

    type: 'custom',

    allowBlank: false,

    formulae: [`LEN(TRIM(${cell.address}&""))>0`],

    showInputMessage: true,

    promptTitle: 'Required Field',

    prompt: message,

    showErrorMessage: true,

    errorStyle: 'stop',

    errorTitle: 'Required Field',

    error: 'This field is required. Please enter a value.',

  };

}

 

function applyEmailValidation(cell, rowNumber) {

  cell.dataValidation = {

    type: 'custom',

    allowBlank: false,

    formulae: [

      `AND(LEN(TRIM(C${rowNumber}&""))>0,ISNUMBER(SEARCH("@",C${rowNumber})),ISNUMBER(SEARCH(".",C${rowNumber})))`,

    ],

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

    formulae: [

      `AND(LEN(TRIM(D${rowNumber}&""))>=9,LEN(TRIM(D${rowNumber}&""))<=15,ISNUMBER(--(D${rowNumber}&"")))`,

    ],

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

    formulae: [

      `AND(ISNUMBER(${columnLetter}${rowNumber}),${columnLetter}${rowNumber}>=TODAY())`,

    ],

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

 

export async function buildTemplateBlob() {

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet('Drivers');

 

  worksheet.columns = COLUMNS.map((column) => ({

    header: column.header,

    key: column.key,

    width: 30,

  }));

 

  // Header styling

  const headerRow = worksheet.getRow(1);

  headerRow.height = 34;

  headerRow.font = {

    bold: true,

    color: { argb: 'FFFFFFFF' },

  };

  headerRow.fill = {

    type: 'pattern',

    pattern: 'solid',

    fgColor: { argb: 'FF1F4E78' },

  };

  headerRow.alignment = {

    vertical: 'middle',

    horizontal: 'center',

    wrapText: true,

  };

 

  headerRow.eachCell((cell, colNumber) => {

    const column = COLUMNS[colNumber - 1];

 

    cell.border = {

      bottom: { style: 'thin', color: { argb: 'FFD9E2F3' } },

    };

 

    // Header notes act as non-intrusive hints.

    // The requester does not need to remove or replace any pre-filled text.

    if (column && COLUMN_HINTS[column.key]) {

      cell.note = COLUMN_HINTS[column.key];

    }

  });

 

  // Freeze only the header row.

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

 

  // Add validations to empty input rows.

  // Rows 2 to 501 allow up to 500 drivers in one template.

  for (let rowNumber = 2; rowNumber <= 501; rowNumber += 1) {

    const firstNameCell = worksheet.getCell(`A${rowNumber}`);

    const lastNameCell = worksheet.getCell(`B${rowNumber}`);

    const emailCell = worksheet.getCell(`C${rowNumber}`);

    const phoneCell = worksheet.getCell(`D${rowNumber}`);

    const licenseNumberCell = worksheet.getCell(`E${rowNumber}`);

    const licenseExpiryCell = worksheet.getCell(`F${rowNumber}`);

    const insuranceCell = worksheet.getCell(`G${rowNumber}`);

    const cityCell = worksheet.getCell(`H${rowNumber}`);

    const poNumberCell = worksheet.getCell(`I${rowNumber}`);

    const poExpiryCell = worksheet.getCell(`J${rowNumber}`);

 

    applyRequiredTextValidation(firstNameCell, COLUMN_HINTS.firstName);

    applyRequiredTextValidation(lastNameCell, COLUMN_HINTS.lastName);

    applyEmailValidation(emailCell, rowNumber);

    applyPhoneValidation(phoneCell, rowNumber);

    applyRequiredTextValidation(licenseNumberCell, COLUMN_HINTS.licenseNumber);

 

    applyDateValidation(

      licenseExpiryCell,

      rowNumber,

      'F',

      COLUMN_HINTS.licenseExpiry,

      'Invalid License Expiry Date'

    );

 

    applyYesNoValidation(insuranceCell);

 

    applyRequiredTextValidation(cityCell, COLUMN_HINTS.city);

    applyRequiredTextValidation(poNumberCell, COLUMN_HINTS.poNumber);

 

    applyDateValidation(

      poExpiryCell,

      rowNumber,

      'J',

      COLUMN_HINTS.poExpiry,

      'Invalid PO Expiry Date'

    );

 

    // Keep user input cells visually clean and empty.

    worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell) => {

      cell.alignment = {

        vertical: 'middle',

        horizontal: 'left',

        wrapText: true,

      };

    });

  }

 

  // Format date columns.

  worksheet.getColumn('F').numFmt = 'yyyy-mm-dd';

  worksheet.getColumn('J').numFmt = 'yyyy-mm-dd';

 

  // Keep phone column as text so leading zero is preserved.

  worksheet.getColumn('D').numFmt = '@';

 

  // Add autofilter to header row.

  worksheet.autoFilter = {

    from: { row: 1, column: 1 },

    to: { row: 1, column: COLUMNS.length },

  };

 

  const arrayBuffer = await workbook.xlsx.writeBuffer();

 

  return new Blob([arrayBuffer], {

    type: EXCEL_MIME_TYPE,

  });

}

 

export function parseDriverExcelFile(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

 

    reader.onerror = () => reject(reader.error);

 

    reader.onload = () => {

      try {

        const workbook = XLSX.read(reader.result, {

          type: 'array',

          cellDates: true,

        });

 

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

 

        const rawRows = XLSX.utils.sheet_to_json(sheet, {

          defval: '',

          raw: false,

        });

 

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

 

            if (key === 'licenseExpiry' || key === 'poExpiry') {

              row[key] = normalizeDateValue(value);

            } else {

              row[key] = normalizeText(value);

            }

          });

 

          const hasAnyValue = Object.values(row).some(

            (value) => value !== '' && value !== undefined && value !== null

          );

 

          // Ignore fully empty rows.

          if (!hasAnyValue) return;

 

          row.role = 'Privileged User';

 

          const rowErrors = validateDriverRow(row, {

            requireCreateFields: true,

          });

 

          // idx 0 means first actual data row from Excel.

          // Report it as Row 1 to match the driver grid numbering.

          if (rowErrors.length) {

            errors.push({

              row: idx + 1,

              errors: rowErrors,

            });

          }

 

          drivers.push(row);

        });

 

        resolve({

          drivers,

          errors,

        });

      } catch (err) {

        reject(err);

      }

    };

 

    reader.readAsArrayBuffer(file);

  });

}

 

export function buildDriversExportBlob(drivers) {

  const rows = drivers.map((driver) => ({

    Username: driver.username,

    'First Name': driver.firstName,

    'Last Name': driver.lastName,

    'Email Address': driver.email,

    'Mobile Number': driver.phone,

    Role: driver.role,

    'Driver License Number (CR)': driver.licenseNumber,

    'Driver License Expiration Date (CR)': driver.licenseExpiry,

    'Driver/Car Insurance (CR)': driver.hasInsurance,

    'Driver City (CR)': driver.city,

    'PO Number': driver.poNumber,

    'PO Expiry Date': driver.poExpiry,

  }));

 

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

 

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

 

  const arrayBuffer = XLSX.write(workbook, {

    type: 'array',

    bookType: 'xlsx',

  });

 

  return new Blob([arrayBuffer], {

    type: EXCEL_MIME_TYPE,

  });

}

 

export function buildRequestsReportBlob(requests) {

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

 

  const arrayBuffer = XLSX.write(workbook, {

    type: 'array',

    bookType: 'xlsx',

  });

 

  return new Blob([arrayBuffer], {

    type: EXCEL_MIME_TYPE,

  });

}
