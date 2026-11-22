'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Shell } from '@/components/shell';

function GoToLibrary() {
  const router = useRouter();
  useEffect(() => router.replace('/libreria'), [router]);
  return null;
}

/** home: login se non si è entrati, altrimenti la libreria */
export default function Home() {
  return <Shell>{() => <GoToLibrary />}</Shell>;
}
