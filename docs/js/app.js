// Global variables
let bomData = null;
const comparator = new BomComparator();

// DOM elements
const bomSelect = document.getElementById('bom-select');
const versionFromSelect = document.getElementById('version-from');
const versionToSelect = document.getElementById('version-to');
const compareBtn = document.getElementById('compare-btn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const filterSection = document.querySelector('.filter-section');
const filterInput = document.getElementById('filter-input');
const lastUpdatedSpan = document.getElementById('last-updated');

// Initialize the application
async function init() {
    try {
        showLoading(true);
        
        // Load BOM data
        const response = await fetch('data/boms.json');
        if (!response.ok) {
            throw new Error('Failed to load BOM data');
        }
        
        bomData = await response.json();
        comparator.data = bomData;
        
        // Update UI
        populateBomSelect();
        updateLastUpdated();
        
        // Restore state from URL parameters
        restoreFromUrl();
        
        showLoading(false);
    } catch (error) {
        showError(`エラー: ${error.message}`);
        showLoading(false);
    }
}

// Populate BOM select dropdown
function populateBomSelect() {
    bomData.boms.forEach(bom => {
        const option = document.createElement('option');
        option.value = `${bom.groupId}:${bom.artifactId}`;
        option.textContent = `${bom.groupId}:${bom.artifactId}`;
        bomSelect.appendChild(option);
    });
}

// Update last updated timestamp
function updateLastUpdated() {
    if (bomData && bomData.generated) {
        const date = new Date(bomData.generated);
        lastUpdatedSpan.textContent = date.toLocaleString('ja-JP');
    }
}

// Handle BOM selection
bomSelect.addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    
    if (!selectedValue) {
        versionFromSelect.disabled = true;
        versionToSelect.disabled = true;
        compareBtn.disabled = true;
        clearVersionSelects();
        updateUrl();
        return;
    }
    
    const [groupId, artifactId] = selectedValue.split(':');
    const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);
    
    if (bom) {
        populateVersionSelects(bom);
        versionFromSelect.disabled = false;
        versionToSelect.disabled = false;
    }
    
    updateUrl();
});

// Populate version select dropdowns
function populateVersionSelects(bom) {
    clearVersionSelects();
    
    bom.versions.forEach(version => {
        const optionFrom = document.createElement('option');
        optionFrom.value = version.version;
        optionFrom.textContent = version.version;
        versionFromSelect.appendChild(optionFrom);
        
        const optionTo = document.createElement('option');
        optionTo.value = version.version;
        optionTo.textContent = version.version;
        versionToSelect.appendChild(optionTo);
    });
    
    // Select default versions if available
    if (bom.versions.length >= 2) {
        versionFromSelect.value = bom.versions[bom.versions.length - 2].version;
        versionToSelect.value = bom.versions[bom.versions.length - 1].version;
        // Update compare button state after setting default values
        updateCompareButtonState();
    }
}

// Update compare button state
function updateCompareButtonState() {
    compareBtn.disabled = !versionFromSelect.value || !versionToSelect.value || 
                       versionFromSelect.value === versionToSelect.value;
}

// Clear version select dropdowns
function clearVersionSelects() {
    versionFromSelect.innerHTML = '<option value="">-- バージョンを選択 --</option>';
    versionToSelect.innerHTML = '<option value="">-- バージョンを選択 --</option>';
}

// Enable/disable compare button based on selections
[versionFromSelect, versionToSelect].forEach(select => {
    select.addEventListener('change', () => {
        updateCompareButtonState();
        updateUrl();
    });
});

// Execute comparison
function executeComparison() {
    const selectedBom = bomSelect.value;
    const fromVersion = versionFromSelect.value;
    const toVersion = versionToSelect.value;
    
    if (!selectedBom || !fromVersion || !toVersion) {
        return;
    }
    
    const [groupId, artifactId] = selectedBom.split(':');
    const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);
    
    if (!bom) {
        showError('BOMが見つかりません');
        return;
    }
    
    try {
        const result = comparator.compare(bom, fromVersion, toVersion);
        displayResults(result);
        filterSection.style.display = 'block';
        filterInput.value = '';
    } catch (error) {
        showError(`比較エラー: ${error.message}`);
    }
}

// Handle compare button click
compareBtn.addEventListener('click', executeComparison);

// Display comparison results
function displayResults(result) {
    resultsDiv.innerHTML = '';
    
    // Create a map of all artifacts with their status
    const artifactMap = new Map();
    
    // Process removed artifacts
    result.removed.forEach(artifact => {
        const key = `${artifact.groupId}:${artifact.artifactId}`;
        artifactMap.set(key, {
            groupId: artifact.groupId,
            artifactId: artifact.artifactId,
            status: 'removed',
            fromVersion: artifact.version,
            toVersion: null
        });
    });
    
    // Process added artifacts
    result.added.forEach(artifact => {
        const key = `${artifact.groupId}:${artifact.artifactId}`;
        artifactMap.set(key, {
            groupId: artifact.groupId,
            artifactId: artifact.artifactId,
            status: 'added',
            fromVersion: null,
            toVersion: artifact.version
        });
    });
    
    // Process updated artifacts
    result.updated.forEach(update => {
        const key = `${update.groupId}:${update.artifactId}`;
        artifactMap.set(key, {
            groupId: update.groupId,
            artifactId: update.artifactId,
            status: 'updated',
            fromVersion: update.fromVersion,
            toVersion: update.toVersion
        });
    });
    
    // Sort artifacts alphabetically
    const sortedArtifacts = Array.from(artifactMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));
    
    if (sortedArtifacts.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state">変更はありません</div>';
        return;
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
        <h3>比較結果: ${result.fromVersion} → ${result.toVersion}</h3>
        <div class="result-summary">
            <span class="added-count">追加: ${result.added.length}</span>
            <span class="removed-count">削除: ${result.removed.length}</span>
            <span class="updated-count">更新: ${result.updated.length}</span>
        </div>
    `;
    resultsDiv.appendChild(header);
    
    // Create artifact list
    const list = document.createElement('div');
    list.className = 'artifact-list';
    
    sortedArtifacts.forEach(([key, artifact]) => {
        const item = document.createElement('div');
        item.className = `artifact-item ${artifact.status}`;
        item.dataset.searchText = key.toLowerCase();
        
        // Create content div
        const content = document.createElement('div');
        content.className = 'artifact-content';
        
        // Artifact name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'artifact-name';
        nameSpan.textContent = `${artifact.groupId}:${artifact.artifactId}`;
        content.appendChild(nameSpan);
        
        // Version info
        const versionSpan = document.createElement('span');
        versionSpan.className = 'version-info';
        
        if (artifact.status === 'added') {
            versionSpan.innerHTML = `<span class="version-to">${artifact.toVersion}</span>`;
        } else if (artifact.status === 'removed') {
            versionSpan.innerHTML = `<span class="version-from">${artifact.fromVersion}</span>`;
        } else if (artifact.status === 'updated') {
            versionSpan.innerHTML = `<span class="version-from">${artifact.fromVersion}</span><span class="version-arrow">→</span><span class="version-to">${artifact.toVersion}</span>`;
        }
        
        content.appendChild(versionSpan);
        
        // Status badge
        const badge = document.createElement('span');
        badge.className = `status-badge ${artifact.status}`;
        
        if (artifact.status === 'added') {
            badge.textContent = 'ADD';
        } else if (artifact.status === 'removed') {
            badge.textContent = 'DEL';
        } else if (artifact.status === 'updated') {
            badge.textContent = 'MOD';
        }
        
        item.appendChild(content);
        item.appendChild(badge);
        list.appendChild(item);
    });
    
    resultsDiv.appendChild(list);
}


// Handle filter input
filterInput.addEventListener('input', (e) => {
    const filterText = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.artifact-item');
    
    items.forEach(item => {
        const searchText = item.dataset.searchText;
        if (searchText.includes(filterText)) {
            item.classList.remove('filtered-out');
        } else {
            item.classList.add('filtered-out');
        }
    });
});

// Show loading state
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    resultsDiv.innerHTML = `<div class="error-state">${message}</div>`;
}

// URL parameter management
function updateUrl() {
    const params = new URLSearchParams();
    
    if (bomSelect.value) {
        params.set('bom', bomSelect.value);
    }
    
    if (versionFromSelect.value) {
        params.set('from', versionFromSelect.value);
    }
    
    if (versionToSelect.value) {
        params.set('to', versionToSelect.value);
    }
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
}

function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const bomParam = params.get('bom');
    const fromParam = params.get('from');
    const toParam = params.get('to');
    
    // Restore BOM selection
    if (bomParam && bomData.boms.some(b => `${b.groupId}:${b.artifactId}` === bomParam)) {
        bomSelect.value = bomParam;
        
        // Trigger BOM selection logic
        const [groupId, artifactId] = bomParam.split(':');
        const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);
        
        if (bom) {
            populateVersionSelects(bom);
            versionFromSelect.disabled = false;
            versionToSelect.disabled = false;
            
            // Restore version selections
            if (fromParam && bom.versions.some(v => v.version === fromParam)) {
                versionFromSelect.value = fromParam;
            }
            
            if (toParam && bom.versions.some(v => v.version === toParam)) {
                versionToSelect.value = toParam;
            }
            
            updateCompareButtonState();
            
            // Auto-execute comparison if all parameters are present
            if (fromParam && toParam && versionFromSelect.value && versionToSelect.value && 
                versionFromSelect.value !== versionToSelect.value) {
                executeComparison();
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);