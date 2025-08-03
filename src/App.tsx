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

  const executeComparison = useCallback(async () => {
    if (!bomData || !selectedBom || !selectedFromVersion || !selectedToVersion) {
      return;
    }

    const [groupId, artifactId] = selectedBom.split(':');
    const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);

    if (!bom) {
      setError('BOM not found');
      return;
    }

    try {
      // Load version data on demand if not already loaded
      const fromVersionData = bom.versions.find(v => v.version === selectedFromVersion);
      const toVersionData = bom.versions.find(v => v.version === selectedToVersion);
      
      if (!fromVersionData || !toVersionData) {
        setError('Version not found');
        return;
      }
      
      // Load artifacts if not already loaded
      if (fromVersionData.artifacts.length === 0 && bom.directory) {
        const response = await fetch(`./data/${bom.directory}/${selectedFromVersion}.json`);
        if (response.ok) {
          const data = await response.json();
          fromVersionData.artifacts = data.artifacts;
        }
      }
      
      if (toVersionData.artifacts.length === 0 && bom.directory) {
        const response = await fetch(`./data/${bom.directory}/${selectedToVersion}.json`);
        if (response.ok) {
          const data = await response.json();
          toVersionData.artifacts = data.artifacts;
        }
      }
      
      const result = comparator.compare(bom, selectedFromVersion, selectedToVersion);
      setComparisonResult(result);
      setFilter('');
      setError(null);
    } catch (err) {
      setError(`Comparison error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      // First load the manifest to get the list of available BOMs
      const manifestResponse = await fetch('./data/manifest.json');
      if (!manifestResponse.ok) {
        throw new Error('Failed to load BOM manifest');
      }
      const manifest = await manifestResponse.json();
      
      // Load all BOM metadata files in parallel
      const bomPromises = manifest.boms.map(async (bomEntry: any) => {
        const response = await fetch(`./data/${bomEntry.directory}/metadata.json`);
        if (!response.ok) {
          console.error(`Failed to load BOM metadata for ${bomEntry.directory}`);
          return null;
        }
        const metadata = await response.json();
        return {
          ...metadata,
          directory: bomEntry.directory,
          versions: metadata.versions.map((version: string) => ({
            version,
            artifacts: [] // Will be loaded on demand
          }))
        };
      });
      
      const bomDataList = await Promise.all(bomPromises);
      
      // Filter out any failed loads and convert to BomData format
      const bomData: BomData = {
        boms: bomDataList.filter(bom => bom !== null)
      };
      
      setBomData(bomData);
      setError(null);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
              bomName={selectedBom}
            />
          </>
        )}

        <Loading visible={loading} />
      </main>

      <Footer />
    </div>
  );
}

export default App;