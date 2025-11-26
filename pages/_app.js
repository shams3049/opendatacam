import React from 'react';
import { Provider } from 'react-redux';
import { wrapper } from '../statemanagement/store';
import '../styles/index.css';

// Keep a minimal custom _app, rely on wrapper.withRedux for injecting store + isServer for pages.
function MyApp({ Component, pageProps, store }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

// Export wrapped version (v8 still supports withRedux for pages using getInitialProps).
export default wrapper.withRedux(MyApp);
