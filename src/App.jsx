import { useCallback, useState } from 'react';
import { useSession } from '@/auth/useSession';
import SignInScreen from '@/auth/SignInScreen';
import FolderGate from '@/screens/library/FolderGate';
import LibraryScreen from '@/screens/library/LibraryScreen';
import EditorScreen from '@/screens/editor/EditorScreen';
import Toasts from '@/ui/Toasts';

export default function App() {
  const session = useSession();
  const [root, setRoot] = useState(null); // FileSystemDirectoryHandle of the template library
  const [openFolder, setOpenFolder] = useState(null); // template folder open in the editor
  const closeEditor = useCallback(() => setOpenFolder(null), []);

  let screen;
  if (session.status === 'loading') screen = <main className="min-h-screen" aria-busy="true" />;
  else if (session.status === 'signedOut') screen = <SignInScreen initialError={session.error} />;
  else if (!root) screen = <FolderGate onReady={setRoot} />;
  else if (openFolder) screen = <EditorScreen key={openFolder} root={root} folder={openFolder} onClose={closeEditor} />;
  else screen = <LibraryScreen root={root} onOpen={setOpenFolder} onChangeRoot={setRoot} />;

  return (
    <>
      {screen}
      <Toasts />
    </>
  );
}
