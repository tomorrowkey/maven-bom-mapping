import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Results } from './components/Results';
import { Footer } from './components/Footer';
import { Loading } from './components/Loading';
import { BomData, ComparisonResult } from './types';
import { BomComparator } from './utils/comparator';
import './App.css';

const comparator = new BomComparator();

function App() {
  const [bomData, setBomData] = useState<BomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBom, setSelectedBom] = useState('');
  const [selectedFromVersion, setSelectedFromVersion] = useState('');
  const [selectedToVersion, setSelectedToVersion] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [filter, setFilter] = useState('');
  const [hasRestoredFromUrl, setHasRestoredFromUrl] = useState(false);

  // Load BOM data on mount
  useEffect(() => {
    loadBomData();
  }, []);

  // Restore from URL parameters (run only once when bomData is available)
  useEffect(() => {
    if (!bomData || hasRestoredFromUrl) return;

    const params = new URLSearchParams(window.location.search);
    const bomParam = params.get('bom');
    const fromParam = params.get('from');
    const toParam = params.get('to');

    if (bomParam && bomData.boms.some(b => `${b.groupId}:${b.artifactId}` === bomParam)) {
      const bom = bomData.boms.find(b => `${b.groupId}:${b.artifactId}` === bomParam);
      
      if (bom) {
        
        // Set all states in a batch
        setSelectedBom(bomParam);
        
        if (fromParam && bom.versions.some(v => v.version === fromParam)) {
          setSelectedFromVersion(fromParam);
        } else if (bom.versions.length >= 2) {
          setSelectedFromVersion(bom.versions[bom.versions.length - 2].version);
        }
        
        if (toParam && bom.versions.some(v => v.version === toParam)) {
          setSelectedToVersion(toParam);
        } else if (bom.versions.length >= 1) {
          setSelectedToVersion(bom.versions[bom.versions.length - 1].version);
        }
      }
    }
    
    // Mark that we've attempted URL restoration
    setHasRestoredFromUrl(true);
  }, [bomData, hasRestoredFromUrl]);

  const executeComparison = useCallback(() => {
    if (!bomData || !selectedBom || !selectedFromVersion || !selectedToVersion) {
      return;
    }

    const [groupId, artifactId] = selectedBom.split(':');
    const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);

    if (!bom) {
      setError('BOMが見つかりません');
      return;
    }

    try {
      const result = comparator.compare(bom, selectedFromVersion, selectedToVersion);
      setComparisonResult(result);
      setFilter('');
      setError(null);
    } catch (err) {
      setError(`比較エラー: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [bomData, selectedBom, selectedFromVersion, selectedToVersion]);

  // Auto-execute comparison when all fields are filled
  useEffect(() => {
    if (selectedBom && selectedFromVersion && selectedToVersion) {
      executeComparison();
    }
  }, [selectedBom, selectedFromVersion, selectedToVersion, executeComparison]);

  // Update URL when selections change (but only after initial restoration)
  useEffect(() => {
    if (hasRestoredFromUrl) {
      updateUrl();
    }
  }, [selectedBom, selectedFromVersion, selectedToVersion, hasRestoredFromUrl]);

  const loadBomData = async () => {
    try {
      setLoading(true);
      const response = await fetch('./data/boms.json');
      if (!response.ok) {
        throw new Error('Failed to load BOM data');
      }
      const data = await response.json();
      setBomData(data);
      setError(null);
    } catch (err) {
      setError(`エラー: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (selectedBom) params.set('bom', selectedBom);
    if (selectedFromVersion) params.set('from', selectedFromVersion);
    if (selectedToVersion) params.set('to', selectedToVersion);
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
  };

  const handleBomChange = (value: string) => {
    setSelectedBom(value);
    setSelectedFromVersion('');
    setSelectedToVersion('');
    setComparisonResult(null);

    // Set default versions for manual BOM changes
    if (value && bomData) {
      const [groupId, artifactId] = value.split(':');
      const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);
      
      // Set default versions if available
      if (bom && bom.versions.length >= 2) {
        setSelectedFromVersion(bom.versions[bom.versions.length - 2].version);
        setSelectedToVersion(bom.versions[bom.versions.length - 1].version);
      }
    }
  };

  const getLastUpdated = () => {
    if (!bomData) return null;
    return new Date(bomData.generated).toLocaleString('ja-JP');
  };

  return (
    <div className="container">
      <Header />
      
      <main>
        {error && <div className="error-state">{error}</div>}
        
        {bomData && (
          <>
            <Controls
              boms={bomData.boms}
              selectedBom={selectedBom}
              selectedFromVersion={selectedFromVersion}
              selectedToVersion={selectedToVersion}
              onBomChange={handleBomChange}
              onFromVersionChange={setSelectedFromVersion}
              onToVersionChange={setSelectedToVersion}
            />

            <Results 
              result={comparisonResult} 
              filter={filter}
              onFilterChange={setFilter}
            />
          </>
        )}

        <Loading visible={loading} />
      </main>

      <Footer lastUpdated={getLastUpdated()} />
    </div>
  );
}

export default App;