import { useRef, useState } from 'react';
import Button, { IconButton } from '@/ui/Button';
import Icon from '@/ui/icons';
import { notify } from '@/ui/toast';
import { createImage, createPhotoArea, createShape, createText } from '@/model/schema';
import { splitExtension } from '@/model/names';
import { useDoc, useEditor } from '@/store/editorStore';
import { useEditorContext } from './EditorContext';
import IconPicker from './IconPicker';
import { IMAGE_ACCEPT, imageUploadMessage, importImage } from './imageImport';


const STATUS = {
  saved: { label: 'נשמר', className: 'text-ink-400' },
  dirty: { label: 'שומר…', className: 'text-ink-400' },
  saving: { label: 'שומר…', className: 'text-ink-400' },
  offline: { label: 'לא נשמר · אין חיבור', className: 'text-warn-500' },
  error: { label: 'לא נשמר · מנסה שוב', className: 'text-danger-500' },
  conflict: { label: 'לא נשמר · נשמר במקום אחר', className: 'text-danger-500' },
};

export default function Toolbar({ status, onClose }) {
  const doc = useDoc();
  const ctx = useEditorContext();
  const canUndo = useEditor((s) => (s.history?.past.length ?? 0) > 0);
  const canRedo = useEditor((s) => (s.history?.future.length ?? 0) > 0);
  const zoom = useEditor((s) => s.zoom);
  const showSample = useEditor((s) => s.showSample);
  const { undo, redo, addElement, setZoom, setShowSample } = useEditor.getState();
  const hasPhotoArea = doc.elements.some((e) => e.type === 'photo');
  const hasSample = Boolean(doc.preview?.photo);
  const fileRef = useRef(null);
  const [iconsOpen, setIconsOpen] = useState(false);
  const saveState = STATUS[status] ?? STATUS.saved;

  async function onImagePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { path, img } = await importImage(ctx, file);
      addElement(createImage(doc.size, path, img.naturalWidth, img.naturalHeight, splitExtension(file.name).stem));
    } catch (err) {
      console.error('[toolbar] image import failed:', err);
      notify(imageUploadMessage(err));
    }
  }

  return (
    <header className="h-12 shrink-0 flex items-center gap-1 border-b border-ink-700 bg-ink-900 px-2">
      <Button variant="ghost" onClick={onClose} className="px-2">
        <Icon name="back" />
        תבניות
      </Button>
      <div className="min-w-0 flex items-baseline gap-2 ps-1">
        <h1 className="truncate text-sm font-semibold max-w-56">{doc.name}</h1>
        <span className={`text-xs whitespace-nowrap ${saveState.className}`} role="status">
          {saveState.label}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          disabled={hasPhotoArea}
          title={hasPhotoArea ? 'בתבנית כבר יש אזור תמונה' : 'החלון שאליו נכנסת התמונה מהאירוע'}
          onClick={() => addElement(createPhotoArea(doc.size), 1)}
        >
          <Icon name="camera" />
          אזור תמונה
        </Button>
        <Button variant="ghost" onClick={() => addElement(createText(doc.size, doc.event.font))}>
          <Icon name="text" />
          טקסט
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current.click()}>
          <Icon name="image" />
          תמונה
        </Button>
        <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onImagePicked} />
        <Button variant="ghost" onClick={() => setIconsOpen(true)}>
          <Icon name="heart" />
          אייקונים
        </Button>
        {iconsOpen && <IconPicker onClose={() => setIconsOpen(false)} />}
        <IconButton label="מלבן" onClick={() => addElement(createShape(doc.size, 'rect'))}>
          <Icon name="rect" />
        </IconButton>
        <IconButton label="אליפסה" onClick={() => addElement(createShape(doc.size, 'ellipse'))}>
          <Icon name="ellipse" />
        </IconButton>
        <IconButton label="קו" onClick={() => addElement(createShape(doc.size, 'line'))}>
          <Icon name="line" />
        </IconButton>
      </div>

      {hasSample && (
        <IconButton label={showSample ? 'הסתרת התמונה לדוגמה' : 'הצגת התמונה לדוגמה'} active={showSample} onClick={() => setShowSample(!showSample)}>
          <Icon name="eye" />
        </IconButton>
      )}
      <IconButton label="ביטול (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
        <Icon name="undo" />
      </IconButton>
      <IconButton label="חזרה (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
        <Icon name="redo" />
      </IconButton>
      <span className="w-px h-6 bg-ink-700 mx-1" />
      <IconButton label="הקטנה" onClick={() => setZoom(zoom / 1.25)}>
        <Icon name="minus" />
      </IconButton>
      <span className="w-12 text-center text-xs text-ink-200 tabular-nums" dir="ltr">
        {Math.round(zoom * 100)}%
      </span>
      <IconButton label="הגדלה" onClick={() => setZoom(zoom * 1.25)}>
        <Icon name="plus" />
      </IconButton>
      <IconButton label="התאמה למסך" onClick={() => setZoom(1)}>
        <Icon name="fit" />
      </IconButton>
    </header>
  );
}
