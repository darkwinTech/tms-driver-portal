import { useRef, useState } from 'react';
import { uploadAttachment, attachmentDownloadUrl } from '../../api/requests.js';

export default function AttachmentsList({ requestId, attachments = [], onUploaded, readOnly = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  return (
    <div>
      <ul className="space-y-2 mb-3">
        {attachments.length === 0 && <li className="text-sm text-gray-400">No attachments.</li>}
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
            <span className="truncate">📎 {a.fileName}</span>
            <a
              href={attachmentDownloadUrl(requestId, a.id)}
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:underline text-xs shrink-0 ml-2"
            >
              Download
            </a>
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
