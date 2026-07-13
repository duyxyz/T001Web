'use client';

import * as React from 'react';
import {
  createDOMRenderer,
  FluentProvider,
  RendererProvider,
  SSRProvider,
  teamsLightTheme,
  renderToStyleElements
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer());

  useServerInsertedHTML(() => {
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={teamsLightTheme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
