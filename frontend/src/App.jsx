import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { SimulationProvider } from './context/SimulationContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import SimulationBanner from './components/common/SimulationBanner';

import OverviewPage from './pages/OverviewPage';
import AssetMapPage from './pages/AssetMapPage';
import AssetFleetPage from './pages/AssetFleetPage';
import AssetDetailPage from './pages/AssetDetailPage';
import PerformancePage from './pages/PerformancePage';
import PredictiveMaintenancePage from './pages/PredictiveMaintenancePage';
import WeatherForecastPage from './pages/WeatherForecastPage';
import GridOptimizationPage from './pages/GridOptimizationPage';
import AICommandPage from './pages/AICommandPage';
import AlertsPage from './pages/AlertsPage';
import SimulationPage from './pages/SimulationPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import MarketArbitragePage from './pages/MarketArbitragePage';
import ResilienceSimulatorPage from './pages/ResilienceSimulatorPage';
import DataIngestPage from './pages/DataIngestPage';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAssetCode, setSelectedAssetCode] = useState('WT-021');
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  const handleInspectAsset = (assetCode) => {
    setSelectedAssetCode(assetCode || 'WT-021');
    setActiveTab('detail');
  };

  const handleNavigateToAI = (assetCode) => {
    if (assetCode) {
      setAiInitialQuery(`Explain failure probability and recommended maintenance action for ${assetCode}`);
    } else {
      setAiInitialQuery('');
    }
    setActiveTab('ai');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage 
            onNavigate={(tab) => setActiveTab(tab)} 
            onInspectAsset={handleInspectAsset} 
          />
        );
      case 'map':
        return (
          <AssetMapPage 
            onInspectAsset={handleInspectAsset} 
            onNavigateToFleet={() => setActiveTab('fleet')} 
          />
        );
      case 'fleet':
        return (
          <AssetFleetPage 
            onInspectAsset={handleInspectAsset} 
          />
        );
      case 'detail':
        return (
          <AssetDetailPage 
            assetCode={selectedAssetCode}
            onBack={() => setActiveTab('fleet')}
            onNavigateToAI={handleNavigateToAI}
          />
        );
      case 'digital-twin':
        return <DigitalTwinPage />;
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'data-ingest':
        return <DataIngestPage />;
      case 'market':
        return <MarketArbitragePage />;
      case 'resilience':
        return <ResilienceSimulatorPage />;
      case 'performance':
        return (
          <PerformancePage 
            onInspectAsset={handleInspectAsset} 
          />
        );
      case 'maintenance':
        return (
          <PredictiveMaintenancePage 
            onInspectAsset={handleInspectAsset} 
          />
        );
      case 'forecast':
        return <WeatherForecastPage />;
      case 'grid':
        return <GridOptimizationPage />;
      case 'ai':
        return <AICommandPage initialQuery={aiInitialQuery} />;
      case 'alerts':
        return <AlertsPage onInspectAsset={handleInspectAsset} />;
      case 'simulation':
        return <SimulationPage onInspectAsset={handleInspectAsset} />;
      default:
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} onInspectAsset={handleInspectAsset} />;
    }
  };

  return (
    <TelemetryProvider>
      <SimulationProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
          
          {/* Top Navbar */}
          <Navbar activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab)} />

          {/* Sticky Demo Simulator Control Bar */}
          <SimulationBanner onInspectAsset={handleInspectAsset} />

          {/* Main Layout Area */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

            {/* Main Page Workspace */}
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
              {renderActiveTab()}
            </main>

          </div>

        </div>
      </SimulationProvider>
    </TelemetryProvider>
  );
}

export default App;
