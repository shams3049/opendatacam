import React from 'react';
import Layout from '../components/shared/Layout';
import MainPage from '../components/MainPage';

import { setURLData, loadConfig, restoreUiSettings } from '../statemanagement/app/AppStateManagement';
import { restoreCountingAreas } from '../statemanagement/app/CounterStateManagement';

class Index extends React.Component {
  static async getInitialProps(params) {
    const {
      store, isServer, req, query,
    } = params;
    if (isServer) {
      await store.dispatch(restoreCountingAreas(req));
      await store.dispatch(restoreUiSettings(req));
      await store.dispatch(setURLData(req));
      await store.dispatch(loadConfig(req));
    }
    // Must return an object per Next.js requirements
    return {};
  }

  render() {
    return (
      <Layout>
        <MainPage />
      </Layout>
    );
  }
}

export default Index;
