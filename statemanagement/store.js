import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { fromJS } from 'immutable';
import { createWrapper } from 'next-redux-wrapper';
import reducers from './reducers';

// Create the Redux store. Next-Redux-Wrapper v8 passes a context object as the first argument.
// We don't rely on the legacy { isServer } signature anymore. Immutable hydration is handled here.
const makeStore = () => {
  const middlewares = [thunkMiddleware];
  const middlewareEnhancer = applyMiddleware(...middlewares);
  const enhancers = [middlewareEnhancer];
  const composedEnhancers = composeWithDevTools(...enhancers);

  // Root initial state is created empty; reducers should define defaults.
  const store = createStore(reducers, {}, composedEnhancers);
  return store;
};

// Optional helper to convert a plain object state (from SSR) to Immutable on the client.
// This can be used after wrapper hydration if needed.
export const hydrateImmutableState = (initialPlainState) => {
  if (!initialPlainState || typeof initialPlainState !== 'object') return initialPlainState;
  const converted = {};
  Object.keys(initialPlainState).forEach((key) => {
    converted[key] = fromJS(initialPlainState[key]);
  });
  return converted;
};

export const wrapper = createWrapper(makeStore, { debug: false });
