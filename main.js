/* ==========================================================================
   Filato File System - Main Application Logic
   ========================================================================== */

/* ==========================================================================
   Configuration & Constants
   ========================================================================== */

const CONFIG = {
    LOADING_DURATION: 2500,
    LOADING_HIDE_DELAY: 3000,
    USAGE_UPDATE_INTERVAL: 2000,
    CHART_DATA_POINTS: 5,
    MAX_LOG_ENTRIES: 50
};

const SELECTORS = {

    // Loading

    LOADING: '.loading',
    
    // Resource Usage

    CPU_BAR: '#CPU-internal-bar',
    MEMORY_BAR: '#memory-internal-bar',
    DISK_BAR: '#disk-internal-bar',
    CPU_PERCENTAGE: '#CPU-percentage',
    MEMORY_PERCENTAGE: '#memory-percentage',
    DISK_PERCENTAGE: '#disk-percentage',
    
    // Home Screen

    CURRENT_PAGE: '#currentPage',
    DATA_BOX: '.data-box',
    
    // Modals & Overlays

    OVERLAY: '.overlay',
    MESSAGE: '.message',
    VALUE_INPUT: '#valueInput',
    ENTER_BUTTON: '#enterButton',
    CLOSE_MESSAGE_BUTTON: '#closeMessageButton',
    
    // Preview System

    PREVIEW_OVERLAY: '#previewOverlay',
    PREVIEW: '.preview',
    CLOSE_PREVIEW_BUTTON: '#closePreviewButton',
    PREVIEW_INPUT: '#previewInput',
    SAVE_BUTTON: '#saveButton',
    
    // Action Buttons

    ADD_FILE_BUTTON: '#addFileButton',
    ADD_FOLDER_BUTTON: '#addFolderButton',
    DELETE_BUTTON: '#deleteButton',
    DELETE_FOLDER_BUTTON: '#deleteFolderButton',
    
    // Log System

    LOG_DATA: '#logData',
    
    // Tree View

    TREE: '.tree'
};

/* ==========================================================================
   Application State Management
   ========================================================================== */

const APP_STATE = {
    currentAction: null,
    currentPreviewTag: null,
    files: [],
    folders: [],
    usedNames: [],
    currentPath: ['Desktop']
};

/* ==========================================================================
   Resource Monitoring System
   ========================================================================== */

class ResourceMonitor {
    constructor() {
        this.cpu = {
            tag: document.querySelector(SELECTORS.CPU_BAR),
            data: new Array(CONFIG.CHART_DATA_POINTS).fill(0),
            percentage: document.querySelector(SELECTORS.CPU_PERCENTAGE)
        };
        
        this.memory = {
            tag: document.querySelector(SELECTORS.MEMORY_BAR),
            data: new Array(CONFIG.CHART_DATA_POINTS).fill(0),
            percentage: document.querySelector(SELECTORS.MEMORY_PERCENTAGE)
        };
        
        this.disk = {
            tag: document.querySelector(SELECTORS.DISK_BAR),
            data: new Array(CONFIG.CHART_DATA_POINTS).fill(0),
            percentage: document.querySelector(SELECTORS.DISK_PERCENTAGE)
        };
        
        this.chart = null;
        this.initChart();
    }
    
      //Initialize the ApexCharts instance for resource monitoring

    initChart() {
        const options = {
            chart: { type: 'line' },
            series: [
                { name: 'CPU', data: this.cpu.data },
                { name: 'Memory', data: this.memory.data },
                { name: 'Disk', data: this.disk.data }
            ],
            xaxis: { categories: [0, 2, 4, 8, 10] }
        };
        
        this.chart = new ApexCharts(document.querySelector('.chart-block'), options);
        this.chart.render();
    }
    
      //Update resource percentages and chart data

    updateResource(resource) {
        const value = Math.floor(Math.random() * (101 - 10)) + 10;
        
        // Update progress bar

        resource.tag.style.width = `${value}%`;
        resource.percentage.textContent = `${value}%`;
        
        // Update data array (FIFO)

        resource.data.pop();
        resource.data.unshift(value);
        
        this.updateChart();
    }
    
      //Update the chart with current resource data

    updateChart() {
        this.chart.updateSeries([
            { name: 'CPU', data: this.cpu.data },
            { name: 'Memory', data: this.memory.data },
            { name: 'Disk', data: this.disk.data }
        ], false);
    }
    
      //Start continuous resource monitoring

    startMonitoring() {
        setInterval(() => {
            this.updateResource(this.cpu);
            this.updateResource(this.memory);
            this.updateResource(this.disk);
        }, CONFIG.USAGE_UPDATE_INTERVAL);
    }
}

/* ==========================================================================
   File System Management
   ========================================================================== */

class FileSystemManager {
    constructor() {
        this.loadFromStorage();
    }
    
     //Load files and folders from localStorage

    loadFromStorage() {
        APP_STATE.files = JSON.parse(localStorage.getItem('filato-files')) || [];
        APP_STATE.folders = JSON.parse(localStorage.getItem('filato-folders')) || [];
        APP_STATE.usedNames = [
            ...APP_STATE.files.map(file => file.name),
            ...APP_STATE.folders.map(folder => folder.name)
        ];
    }
    
      //Save current state to localStorage

    saveToStorage() {
        localStorage.setItem('filato-files', JSON.stringify(APP_STATE.files));
        localStorage.setItem('filato-folders', JSON.stringify(APP_STATE.folders));
    }
    
     //Check if a name is already used

    isNameTaken(name) {
        return APP_STATE.usedNames.includes(name);
    }
    
      //Create a new file

    createFile(name) {
        if (this.isNameTaken(name + '.txt')) {
            this.log(`${name}.txt already exists!`, 'error');
            return false;
        }
        
        const fileName = name + '.txt';
        const file = {
            current: APP_STATE.currentPath.join('/'),
            name: fileName,
            content: ''
        };
        
        APP_STATE.files.push(file);
        APP_STATE.usedNames.push(fileName);
        this.saveToStorage();
        
        this.renderFile(file);
        this.log(`${fileName} created successfully`, 'success');
        return true;
    }
    
      //Create a new folder

    createFolder(name) {
        if (this.isNameTaken(name)) {
            this.log(`${name} already exists!`, 'error');
            return false;
        }
        
        const folder = {
            current: APP_STATE.currentPath.join('/'),
            name: name,
            content: []
        };
        
        APP_STATE.folders.push(folder);
        APP_STATE.usedNames.push(name);
        this.saveToStorage();
        
        this.renderFolder(folder);
        this.log(`${name} created successfully`, 'success');
        return true;
    }
    
      // Delete a file

    deleteFile(name) {
        const fileName = name + '.txt';
        const index = APP_STATE.usedNames.indexOf(fileName);
        
        if (index === -1) {
            this.log(`File ${fileName} not found!`, 'error');
            return false;
        }
        
        APP_STATE.usedNames[index] = '';
        APP_STATE.files = APP_STATE.files.filter(file => file.name !== fileName);
        this.saveToStorage();
        
        document.querySelector(`[name="${fileName}"]`)?.remove();
        this.log(`${fileName} deleted successfully`, 'success');
        return true;
    }
    
      // Delete a folder

    deleteFolder(name) {
        const index = APP_STATE.usedNames.indexOf(name);
        
        if (index === -1) {
            this.log(`Folder ${name} not found!`, 'error');
            return false;
        }
        
        APP_STATE.usedNames[index] = '';
        APP_STATE.folders = APP_STATE.folders.filter(folder => folder.name !== name);
        this.saveToStorage();
        
        document.querySelector(`[name="${name}"]`)?.remove();
        this.log(`${name} deleted successfully`, 'success');
        return true;
    }
    
    //Render a file element in the data box
    
    renderFile(file) {
        const fileButton = document.createElement('button');
        fileButton.className = 'file';
        fileButton.setAttribute('name', file.name);
        fileButton.setAttribute('content', file.content);
        fileButton.innerHTML = `<i class="bi bi-file-earmark"></i><p>${file.name}</p>`;
        fileButton.addEventListener('click', (event) => this.showPreview(event));
        
        document.querySelector(SELECTORS.DATA_BOX).appendChild(fileButton);
    }

    //Render a folder element in the data box
    
    renderFolder(folder) {
        const folderButton = document.createElement('button');
        folderButton.className = 'folder';
        folderButton.setAttribute('name', folder.name);
        folderButton.setAttribute('content', folder.content);
        folderButton.innerHTML = `<i class="bi bi-folder-fill"></i><p>${folder.name}</p>`;
        folderButton.addEventListener('click', () => this.navigateToFolder(folder.name));
        
        document.querySelector(SELECTORS.DATA_BOX).appendChild(folderButton);
    }

    //Navigate to a folder (placeholder for future implementation)
    
    navigateToFolder(folderName) {
        this.log(`Navigation to ${folderName} clicked`, 'info');
        // TODO: Implement folder navigation
    }
    
      //Log messages to the log system
    
      log(message, type = 'info') {
        const colors = {
            success: '#07ff0087',
            error: '#ff000087',
            info: '#ddd'
        };
        
        const date = new Date();
        const logEntry = document.createElement('p');
        logEntry.style.backgroundColor = colors[type] || colors.info;
        logEntry.textContent = `${message} | Date: ${date.toUTCString()}`;
        
        const logContainer = document.querySelector(SELECTORS.LOG_DATA);
        logContainer.prepend(logEntry);
        
        // Limit log entries
        if (logContainer.children.length > CONFIG.MAX_LOG_ENTRIES) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }
}

/* ==========================================================================
   Modal & UI Management
   ========================================================================== */

class UIManager {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.bindEvents();
    }
    
      // Bind event listeners to UI elements
    
      bindEvents() {
        // Action buttons
        document.querySelector(SELECTORS.ADD_FILE_BUTTON).addEventListener('click', (e) => this.showInputModal(e));
        document.querySelector(SELECTORS.ADD_FOLDER_BUTTON).addEventListener('click', (e) => this.showInputModal(e));
        document.querySelector(SELECTORS.DELETE_BUTTON).addEventListener('click', (e) => this.showInputModal(e));
        document.querySelector(SELECTORS.DELETE_FOLDER_BUTTON).addEventListener('click', (e) => this.showInputModal(e));
        
        // Modal controls
        document.querySelector(SELECTORS.CLOSE_MESSAGE_BUTTON).addEventListener('click', () => this.hideInputModal());
        document.querySelector(SELECTORS.OVERLAY).addEventListener('click', () => this.hideInputModal());
        document.querySelector(SELECTORS.ENTER_BUTTON).addEventListener('click', () => this.handleInput());
        
        // Preview controls
        document.querySelector(SELECTORS.CLOSE_PREVIEW_BUTTON).addEventListener('click', () => this.hidePreview());
        document.querySelector(SELECTORS.PREVIEW_OVERLAY).addEventListener('click', () => this.hidePreview());
        document.querySelector(SELECTORS.SAVE_BUTTON).addEventListener('click', () => this.savePreview());
    }
    
      // Show input modal for various actions
      
    showInputModal(event) {
        APP_STATE.currentAction = event.target.getAttribute('button-type');
        
        document.querySelector(SELECTORS.OVERLAY).style.display = 'block';
        document.querySelector(SELECTORS.MESSAGE).style.display = 'flex';
        document.querySelector(SELECTORS.VALUE_INPUT).focus();
    }
    
    // Hide input modal

    hideInputModal() {
        document.querySelector(SELECTORS.OVERLAY).style.display = 'none';
        document.querySelector(SELECTORS.MESSAGE).style.display = 'none';
        document.querySelector(SELECTORS.VALUE_INPUT).value = '';
        APP_STATE.currentAction = null;
    }
    
     // Handle input submission from modal

    handleInput() {
        const input = document.querySelector(SELECTORS.VALUE_INPUT);
        const value = input.value.trim();
        
        if (!value) return;
        
        switch (APP_STATE.currentAction) {
            case 'addFile':
                this.fileSystem.createFile(value);
                break;
            case 'addFolder':
                this.fileSystem.createFolder(value);
                break;
            case 'delete':
                this.fileSystem.deleteFile(value);
                break;
            case 'deleteFolder':
                this.fileSystem.deleteFolder(value);
                break;
        }
        
        this.hideInputModal();
    }
    
     // Show file preview

    showPreview(event) {
        APP_STATE.currentPreviewTag = event.target.closest('.file');
        
        document.querySelector(SELECTORS.PREVIEW_OVERLAY).style.display = 'block';
        document.querySelector(SELECTORS.PREVIEW).style.display = 'flex';
        
        const content = APP_STATE.currentPreviewTag?.getAttribute('content') || '';
        document.querySelector(SELECTORS.PREVIEW_INPUT).value = content;
    }
    
     // Hide file preview

    hidePreview() {
        document.querySelector(SELECTORS.PREVIEW_OVERLAY).style.display = 'none';
        document.querySelector(SELECTORS.PREVIEW).style.display = 'none';
        APP_STATE.currentPreviewTag = null;
    }
    
      //Save changes made in the preview modal

    savePreview() {
        if (!APP_STATE.currentPreviewTag) return;
        
        const content = document.querySelector(SELECTORS.PREVIEW_INPUT).value;
        APP_STATE.currentPreviewTag.setAttribute('content', content);
        
        // Update file content in storage
        const fileName = APP_STATE.currentPreviewTag.getAttribute('name');
        const file = APP_STATE.files.find(f => f.name === fileName);
        if (file) {
            file.content = content;
            this.fileSystem.saveToStorage();
        }
        
        this.hidePreview();
        this.fileSystem.log(`${fileName} saved successfully`, 'success');
    }
}

/* ==========================================================================
   Application Initialization
   ========================================================================== */

class FilatoApp {
    constructor() {
        this.resourceMonitor = new ResourceMonitor();
        this.fileSystem = new FileSystemManager();
        this.uiManager = new UIManager(this.fileSystem);
        this.init();
    }
    
    
     //Initialize the application
     
    init() {
        this.setupLoadingScreen();
        this.renderExistingFiles();
    }
    
    
    //Setup loading screen transition
     
    setupLoadingScreen() {
        const loadingTag = document.querySelector(SELECTORS.LOADING);
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingTag.style.opacity = '0';
                this.resourceMonitor.startMonitoring();
            }, CONFIG.LOADING_DURATION);
            
            setTimeout(() => {
                loadingTag.style.display = 'none';
            }, CONFIG.LOADING_HIDE_DELAY);
        });
    }
    
    
     //Render existing files and folders from storage
     

    renderExistingFiles() {
        APP_STATE.files.forEach(file => this.fileSystem.renderFile(file));
        APP_STATE.folders.forEach(folder => this.fileSystem.renderFolder(folder));
    }
}

/* ==========================================================================
   Debugging & Development Utilities
   ========================================================================== */

// Log all click events for debugging (can be removed in production)

window.addEventListener("click", event => {
    console.log("Click event target:", event.target);
});

/* ==========================================================================
   Application Startup
   ========================================================================== */

// Initialize the application when DOM is ready

document.addEventListener('DOMContentLoaded', () => {
    new FilatoApp();
});
