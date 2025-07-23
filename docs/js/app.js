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
        return;
    }
    
    const [groupId, artifactId] = selectedValue.split(':');
    const bom = bomData.boms.find(b => b.groupId === groupId && b.artifactId === artifactId);
    
    if (bom) {
        populateVersionSelects(bom);
        versionFromSelect.disabled = false;
        versionToSelect.disabled = false;
    }
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
    });
});

// Handle compare button click
compareBtn.addEventListener('click', () => {
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
});

// Display comparison results
function displayResults(result) {
    resultsDiv.innerHTML = '';
    
    const hasChanges = result.added.length > 0 || result.removed.length > 0 || result.updated.length > 0;
    
    if (!hasChanges) {
        resultsDiv.innerHTML = '<div class="empty-state">変更はありません</div>';
        return;
    }
    
    // Added artifacts
    if (result.added.length > 0) {
        const section = createResultSection('added', '追加', result.added.length);
        const list = document.createElement('div');
        list.className = 'artifact-list';
        
        result.added.forEach(artifact => {
            const item = document.createElement('div');
            item.className = 'artifact-item';
            item.textContent = `${artifact.groupId}:${artifact.artifactId}:${artifact.version}`;
            item.dataset.searchText = item.textContent.toLowerCase();
            list.appendChild(item);
        });
        
        section.appendChild(list);
        resultsDiv.appendChild(section);
    }
    
    // Removed artifacts
    if (result.removed.length > 0) {
        const section = createResultSection('removed', '削除', result.removed.length);
        const list = document.createElement('div');
        list.className = 'artifact-list';
        
        result.removed.forEach(artifact => {
            const item = document.createElement('div');
            item.className = 'artifact-item';
            item.textContent = `${artifact.groupId}:${artifact.artifactId}:${artifact.version}`;
            item.dataset.searchText = item.textContent.toLowerCase();
            list.appendChild(item);
        });
        
        section.appendChild(list);
        resultsDiv.appendChild(section);
    }
    
    // Updated artifacts
    if (result.updated.length > 0) {
        const section = createResultSection('updated', '更新', result.updated.length);
        const list = document.createElement('div');
        list.className = 'artifact-list';
        
        result.updated.forEach(update => {
            const item = document.createElement('div');
            item.className = 'artifact-item';
            item.innerHTML = `${update.groupId}:${update.artifactId}: <span class="version-change">${update.fromVersion} → ${update.toVersion}</span>`;
            item.dataset.searchText = `${update.groupId}:${update.artifactId}`.toLowerCase();
            list.appendChild(item);
        });
        
        section.appendChild(list);
        resultsDiv.appendChild(section);
    }
}

// Create result section
function createResultSection(className, title, count) {
    const section = document.createElement('div');
    section.className = `result-section ${className}`;
    
    const header = document.createElement('h3');
    header.textContent = `${title} (${count})`;
    section.appendChild(header);
    
    return section;
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);