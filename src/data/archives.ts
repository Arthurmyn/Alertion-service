/** Upload fixtures. A null size is not a limit failure: the plan does not state it. */
export interface ArchiveFixture {
  name: string;
  archiveMb: number | null;
  unpackedMb: number | null;
  files: readonly string[];
  label: string | null;
}

export const archives: Record<string, ArchiveFixture> = {
  'nan-v1.zip': {
    name: 'nan-v1.zip',
    archiveMb: 4.2,
    unpackedMb: 12,
    files: ['index.html', 'styles.css'],
    label: 'A',
  },
  'temir-v1.zip': {
    name: 'temir-v1.zip',
    archiveMb: 3.0,
    unpackedMb: 9,
    files: ['index.html', 'styles.css'],
    label: 'A',
  },
  'nan-v2.zip': {
    name: 'nan-v2.zip',
    archiveMb: 5.1,
    unpackedMb: 18,
    files: ['index.html', 'styles.css'],
    label: 'B',
  },
  'nan-v3.zip': {
    name: 'nan-v3.zip',
    archiveMb: 15,
    unpackedMb: 45,
    files: ['index.html', 'styles.css'],
    label: 'C',
  },
  'nan-v4.zip': {
    name: 'nan-v4.zip',
    archiveMb: 15,
    unpackedMb: 45,
    files: ['index.html', 'styles.css'],
    label: 'D',
  },
  'nan-no-index.zip': {
    name: 'nan-no-index.zip',
    archiveMb: null,
    unpackedMb: null,
    files: ['home.html'],
    label: null,
  },
  'nan-unsafe.zip': {
    name: 'nan-unsafe.zip',
    archiveMb: null,
    unpackedMb: null,
    files: ['index.html', '../secret.txt'],
    label: null,
  },
  'nan-28mb.zip': {
    name: 'nan-28mb.zip',
    archiveMb: 28,
    unpackedMb: null,
    files: ['index.html', 'styles.css'],
    label: null,
  },
  'nan-unpack-60.zip': {
    name: 'nan-unpack-60.zip',
    archiveMb: 8,
    unpackedMb: 60,
    files: ['index.html', 'styles.css'],
    label: null,
  },
  'nan-storage.zip': {
    name: 'nan-storage.zip',
    archiveMb: 12,
    unpackedMb: 40,
    files: ['index.html', 'styles.css'],
    label: 'E',
  },
};
