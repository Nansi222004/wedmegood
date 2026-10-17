import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * An image the API only serves with a login token (customer reference photos). It is fetched with
 * the Authorization header and shown from memory, so there is no link to copy, share or open later.
 * Right-click and drag are disabled. A plain http(s) URL (older public photos) is shown as is.
 *
 * @param {{ src: string, token: string|null, alt?: string, className?: string }} props
 *   src is an API path such as /user/reference-photos/:id
 */
const PrivateImage = ({ src, token, alt = '', className = '' }) => {
  const isPublic = /^https?:\/\//i.test(src || '');
  // Results are kept per src, so switching src (e.g. in a viewer) never shows the previous image
  const [loaded, setLoaded] = useState({ src: null, url: null, failed: false });
  const blobUrl = loaded.src === src ? loaded.url : null;
  const failed = loaded.src === src && loaded.failed;

  useEffect(() => {
    if (!src || isPublic) return undefined;
    let objectUrl = null;
    let alive = true;
    fetch(`${API_BASE_URL}${src}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store' })
      .then(res => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then(blob => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ src, url: objectUrl, failed: false });
      })
      .catch(() => alive && setLoaded({ src, url: null, failed: true }));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, token, isPublic]);

  const shown = isPublic ? src : blobUrl;
  const guard = {
    draggable: false,
    onContextMenu: (e) => e.preventDefault(),
    onDragStart: (e) => e.preventDefault()
  };

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-[9px] text-stone-400 text-center ${className}`} {...guard}>
        Not available
      </div>
    );
  }
  if (!shown) return <div className={`animate-pulse bg-stone-200 ${className}`} />;
  return <img src={shown} alt={alt} className={`select-none ${className}`} {...guard} />;
};

export default PrivateImage;
