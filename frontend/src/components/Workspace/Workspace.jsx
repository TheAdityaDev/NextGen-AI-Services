/**
 * AgentWorkspace Component
 * Main workspace interface for support agents
 */

import React from 'react';
import './Workspace.scss';

const Workspace = () => {
  return (
    <div className="agent-workspace">
      <div className="agent-workspace__header">
        <h1>Support Agent Workspace</h1>
        <p>Welcome to your NextGen AI Services support workspace</p>
      </div>
      
      <div className="agent-workspace__content">
        <div className="agent-workspace__card">
          <h2>Active Tickets</h2>
          <p>No active tickets at the moment</p>
        </div>
        
        <div className="agent-workspace__card">
          <h2>Recent Activity</h2>
          <p>No recent activity</p>
        </div>
        
        <div className="agent-workspace__card">
          <h2>Knowledge Base</h2>
          <p>Access your company's knowledge base</p>
        </div>
      </div>
    </div>
  );
};

export default Workspace;