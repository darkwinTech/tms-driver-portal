import { useRef, useState } from 'react';
import { downloadExcelTemplate, parseExcelUpload } from '../../api/requests.js';
import Alert from '../common/Alert.jsx';

/**
 * Handles the "Download Template -> Fill -> Upload -> Validate -> Fix -> Re-upload" flow.
 * On successful validation, calls onParsed(drivers) to hand the rows back to the parent.
 */
export default function ExcelUploadPanel({ onParsed }) {
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [rowCount, setRowCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  async function handleDownloadTemplate() {
    const res = await downloadExcelTemplate();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver-upload-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setErrors([]);
    try {
      const res = await parseExcelUpload(file);
      setRowCount(res.data.totalRows);
      if (res.data.valid) {
        onParsed(res.data.drivers);
      } else {
        setErrors(res.data.errors);
        onParsed([]);
      }
    } catch (err) {
      setErrors([{ row: '-', errors: [err.response?.data?.message || 'Failed to parse file'] }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-gray-50">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
        >
          Download Template
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm px-3 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700"
        >
          Upload Filled Template
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleFileChange} />
        {fileName && <span className="text-sm text-gray-500">{fileName}</span>}
        {loading && <span className="text-sm text-gray-500">Validating...</span>}
      </div>

      {rowCount !== null && errors.length === 0 && !loading && (
        <Alert type="success">✓ {rowCount} driver row(s) validated successfully.</Alert>
      )}

      {errors.length > 0 && (
        <div className="mt-4">
          <Alert type="error">Validation failed. Fix the highlighted rows and re-upload.</Alert>
          <div className="max-h-48 overflow-y-auto border border-red-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-red-50 text-red-700">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Errors</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, idx) => (
                  <tr key={idx} className="border-t border-red-100">
                    <td className="px-3 py-2">{e.row}</td>
                    <td className="px-3 py-2">{e.errors.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
