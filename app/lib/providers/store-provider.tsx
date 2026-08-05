import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { useIsClient } from '~/hooks/use-is-client';
import { store, persistor } from '~/store';

type Props = {
  children: React.ReactNode;
};

export function StoreProvider({ children }: Readonly<Props>) {
  const client = useIsClient();
  if (!client) {
    return <Provider store={store}>{children}</Provider>;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
