import React from 'react';
import { Provider } from 'react-redux';
import { wrapper } from '../statemanagement/store';
import '../styles/index.css';

// Use wrapper.useWrappedStore() for next-redux-wrapper v8 to properly get the store.
function MyApp({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest);
  return (
    <Provider store={store}>
      <Component {...props.pageProps} />
    </Provider>
  );
}

export default MyApp;
