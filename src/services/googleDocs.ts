/**
 * Google Docs & Drive Service
 * Interacts with Google Docs API v1 & Google Drive API v3
 */

export interface GoogleDocItem {
  id: string;
  name: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
}

/**
 * Creates a new Google Doc and inserts structured text
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialContent: string
): Promise<{ id: string; title: string; webViewLink: string }> {
  // Step 1: Create Document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: title.trim() || 'Trading Journal Note' })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Doc (${createRes.status})`);
  }

  const newDoc = await createRes.json();
  const documentId = newDoc.documentId;

  // Step 2: Insert initial content if provided
  if (initialContent && initialContent.trim().length > 0) {
    try {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: initialContent.trim() + '\n\n— Generated via SZTrade Learn Platform (A Project by SAMZEN)'
              }
            }
          ]
        })
      });
    } catch (e) {
      console.warn('[Google Docs] Error appending body text:', e);
    }
  }

  return {
    id: documentId,
    title: newDoc.title || title,
    webViewLink: `https://docs.google.com/document/d/${documentId}/edit`
  };
}

/**
 * List the user's Google Docs from Google Drive
 */
export async function listGoogleDocs(accessToken: string): Promise<GoogleDocItem[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.document' and trashed = false");
  const fields = encodeURIComponent('files(id, name, modifiedTime, createdTime, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Docs (${res.status})`);
  }

  const data = await res.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    modifiedTime: file.modifiedTime,
    createdTime: file.createdTime,
    webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`
  }));
}

/**
 * Reads text content from a Google Doc
 */
export async function getGoogleDocContent(accessToken: string, documentId: string): Promise<{ title: string; text: string }> {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to read document (${res.status})`);
  }

  const doc = await res.json();
  let fullText = '';

  if (doc.body && doc.body.content) {
    for (const elem of doc.body.content) {
      if (elem.paragraph && elem.paragraph.elements) {
        for (const pe of elem.paragraph.elements) {
          if (pe.textRun && pe.textRun.content) {
            fullText += pe.textRun.content;
          }
        }
      }
    }
  }

  return {
    title: doc.title || 'Untitled Document',
    text: fullText.trim()
  };
}

/**
 * Deletes a Google Doc file with explicit confirmation
 */
export async function deleteGoogleDoc(accessToken: string, fileId: string, fileName?: string): Promise<boolean> {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete "${fileName || 'this Google Doc'}" from your Google Drive? This cannot be undone.`
  );
  if (!confirmed) {
    return false;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete file (${res.status})`);
  }

  return true;
}
