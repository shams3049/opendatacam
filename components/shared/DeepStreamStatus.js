import React, { Component } from 'react';
import axios from 'axios';

class DeepStreamStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.checkStatus();
    // Refresh status every 10 seconds
    this.interval = setInterval(() => this.checkStatus(), 10000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  checkStatus() {
    axios.get('/deepstream/status')
      .then((response) => {
        this.setState({
          status: response.data,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        this.setState({
          status: null,
          loading: false,
          error: error.message,
        });
      });
  }

  render() {
    const { status, loading, error } = this.state;

    if (loading) {
      return (
        <div className="deepstream-status mb-4">
          <h4 className="text-xl font-bold">DeepStream</h4>
          <p className="text-xs">Checking status...</p>
        </div>
      );
    }

    if (error) {
      return null; // Don't show if DeepStream is not configured
    }

    if (!status) {
      return null;
    }

    const statusColor = status.connected ? 'text-green-500' : 'text-yellow-500';
    const statusText = status.connected ? 'Connected' : 'Disconnected';

    return (
      <div className="deepstream-status mb-4 pb-4 border-b border-gray-200">
        <h4 className="text-xl font-bold">DeepStream SDK</h4>
        <div className="flex items-center mt-2">
          <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-yellow-500'} mr-2`} />
          <p className={`text-sm font-semibold ${statusColor}`}>{statusText}</p>
        </div>
        <p className="text-xs mt-1">Mode: {status.mode}</p>
      </div>
    );
  }
}

export default DeepStreamStatus;
