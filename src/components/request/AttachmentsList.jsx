import { useRef, useState } from 'react';
import { uploadAttachment, downloadAttachment, previewAttachment } from '../../api/requests.js';

export default function AttachmentsList({ requestId, attachments = [], onUploaded, readOnly = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAttachment(requestId, file);
      onUploaded(res.data);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDownload(attachment) {
    setDownloadingId(attachment.id);
    try {
      await downloadAttachment(requestId, attachment.id, attachment.fileName);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <ul className="space-y-2 mb-3">
        {attachments.length === 0 && <li className="text-sm text-gray-400">No attachments.</li>}
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
            <span className="truncate">
              📎 {a.docType ? `Driver ${a.driverIndex + 1} — ${a.docType}: ` : ''}
              {a.fileName}
            </span>
            <span className="shrink-0 ml-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => previewAttachment(requestId, a.id)}
                className="text-primary-600 hover:underline text-xs"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownload(a)}
                disabled={downloadingId === a.id}
                className="text-primary-600 hover:underline text-xs disabled:opacity-50"
              >
                {downloadingId === a.id ? 'Downloading…' : 'Download'}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {!readOnly && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            {uploading ? 'Uploading...' : '📎 Add attachment'}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
        </>
      )}
    </div>
  );
}
