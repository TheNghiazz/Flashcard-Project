// Flashcard Application - Main JavaScript File

class FlashcardApp {
    constructor() {
        this.flashcards = [];
        this.currentCardIndex = 0;
        this.studyCards = [];
        this.isFlipped = false;
        this.cardRowCounter = 0;
        this.currentLanguage = 'en'; // Default to English
        this.currentFolder = null; // Track currently selected folder
        this.currentUser = null; // Track current logged in user
        
        this.init();
    }

    init() {
        this.checkUserSession();
        this.loadFromStorage();
        this.loadLanguageFromStorage();
        this.loadSidebarState();
        
        // Cache frequently used DOM elements for better performance
        this.cacheElements();
        
        this.setupEventListeners();
        this.addCardRow(); // Add initial row
        this.updateUI();
        this.updateCategoryFilters();
        this.updateLanguage();
        this.clearDefaultFolders(); // Clear default folders if they exist
        this.updateFolderDisplay(); // Load folders on init
        
        // Add manual clear function to window for debugging
        window.clearAllFlashcardData = () => {
            localStorage.removeItem('flashcard-cards');
            localStorage.removeItem('flashcard-folders');
            localStorage.removeItem('flashcard-language');
            localStorage.removeItem('flashcard-sidebar-collapsed');
            console.log('Đã xóa toàn bộ dữ liệu flashcard');
            location.reload();
        };
    }
    
    cacheElements() {
        // Cache frequently accessed elements to reduce DOM queries
        this.elements = {
            studyTab: document.getElementById('study-tab'),
            manageTab: document.getElementById('manage-tab'),
            addTab: document.getElementById('add-tab'),
            categoryFilter: document.getElementById('category-filter'),
            manageCategoryFilter: document.getElementById('manage-category-filter'),
            cardsList: document.getElementById('cards-list'),
            flashcardStudy: document.getElementById('flashcard-study'),
            noCardsMessage: document.getElementById('no-cards-message'),
            cardCounter: document.getElementById('card-counter')
        };
    }

    // Data Management
    loadFromStorage() {
        const key = this.getUserStorageKey('flashcards');
        const stored = localStorage.getItem(key);
        if (stored) {
            this.flashcards = JSON.parse(stored);
        }
    }

    saveToStorage() {
        const key = this.getUserStorageKey('flashcards');
        localStorage.setItem(key, JSON.stringify(this.flashcards));
    }

    loadLanguageFromStorage() {
        const key = this.getUserStorageKey('language');
        const storedLang = localStorage.getItem(key);
        if (storedLang) {
            this.currentLanguage = storedLang;
        }
    }

    saveLanguageToStorage() {
        const key = this.getUserStorageKey('language');
        localStorage.setItem(key, this.currentLanguage);
    }

    loadSidebarState() {
        const key = this.getUserStorageKey('sidebar-collapsed');
        const isCollapsed = localStorage.getItem(key) === 'true';
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                // Check if we're on mobile
                if (window.innerWidth <= 768) {
                    // Mobile behavior: toggle open/close
                    sidebar.classList.toggle('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle('open');
                    }
                } else {
                    // Desktop behavior: toggle collapsed/expanded
                    sidebar.classList.toggle('collapsed');
                    // Save state to localStorage
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    const key = this.getUserStorageKey('sidebar-collapsed');
                    localStorage.setItem(key, isCollapsed);
                }
            });
        }
        
        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('open');
            });
        }

        // Sidebar navigation
        document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Close sidebar on mobile after selection
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.remove('open');
                    }
                }
            });
        });

        // Tab navigation (legacy support)
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Bulk import button
        document.getElementById('bulk-import-btn').addEventListener('click', () => {
            this.showBulkImportModal();
        });

        // Add card form (single)
        document.getElementById('add-card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMultipleCards();
        });

        // Add row button
        document.getElementById('add-row-btn').addEventListener('click', () => {
            this.addCardRow();
        });

        // Clear all button
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllRows();
        });

        // Language toggle
        document.getElementById('lang-toggle').addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Bulk import form
        document.getElementById('bulk-import-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.bulkImportCards();
        });

        // Add event listener for login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('usernameInput').value;
                this.login(username);
            });
        }

        // Add Enter key support for login
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const username = usernameInput.value;
                    this.login(username);
                }
            });
        }

        // Add event listener for logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Bulk import modal controls
        document.getElementById('bulk-import-cancel').addEventListener('click', () => {
            this.hideBulkImportModal();
        });

        // Study mode controls
        document.getElementById('shuffle-btn').addEventListener('click', () => {
            this.shuffleCards();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterStudyCards(e.target.value);
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousCard();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextCard();
        });

        document.getElementById('flashcard-study').addEventListener('click', () => {
            this.flipCard();
        });

        // Manage mode controls
        document.getElementById('search-cards').addEventListener('input', (e) => {
            this.searchCards(e.target.value);
        });

        document.getElementById('manage-category-filter').addEventListener('change', (e) => {
            this.filterManageCards(e.target.value);
        });

        document.getElementById('delete-all-btn').addEventListener('click', () => {
            this.confirmDeleteAll();
        });

        // Modal controls
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            this.executeModalAction();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('#study-tab').classList.contains('active')) {
                switch(e.key) {
                    case 'ArrowLeft':
                        this.previousCard();
                        break;
                    case 'ArrowRight':
                        this.nextCard();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.flipCard();
                        break;
                }
            }
        });
        
        // Mobile touch gestures for flashcard
        this.setupTouchGestures();
        
        // Create folder functionality
        this.setupFolderCreation();
    }
    
    setupTouchGestures() {
        let startX, startY, distX, distY;
        const flashcard = document.getElementById('flashcard-study');
        
        if (!flashcard) return;
        
        // Touch start
        flashcard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        // Touch end - detect swipe gestures
        flashcard.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            distX = e.changedTouches[0].clientX - startX;
            distY = e.changedTouches[0].clientY - startY;
            
            // Only process horizontal swipes (maintain horizontal preference)
            if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 50) {
                if (distX > 0) {
                    // Swipe right - previous card
                    this.previousCard();
                } else {
                    // Swipe left - next card
                    this.nextCard();
                }
            }
            
            // Reset
            startX = startY = null;
        }, { passive: true });
    }

    // Folder Management
    setupFolderCreation() {
        // Create folder button click
        const createFolderBtn = document.getElementById('new-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                this.showCreateFolderModal();
            });
        }

        // Create folder modal controls
        const createFolderModal = document.getElementById('create-folder-modal');
        const closeFolderModal = document.getElementById('close-folder-modal');
        const cancelFolderBtn = document.getElementById('cancel-folder');
        const createFolderBtn = document.getElementById('create-folder');
        const folderNameInput = document.getElementById('folder-name');

        if (closeFolderModal) {
            closeFolderModal.addEventListener('click', () => {
                this.hideCreateFolderModal();
            });
        }

        if (cancelFolderBtn) {
            cancelFolderBtn.addEventListener('click', () => {
                this.hideCreateFolderModal();
            });
        }

        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                this.createNewFolder();
            });
        }

        if (folderNameInput) {
            folderNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.createNewFolder();
                }
            });
        }

        // Click outside modal to close
        if (createFolderModal) {
            createFolderModal.addEventListener('click', (e) => {
                if (e.target === createFolderModal) {
                    this.hideCreateFolderModal();
                }
            });
        }
    }

    showCreateFolderModal() {
        const modal = document.getElementById('create-folder-modal');
        const folderNameInput = document.getElementById('folder-name');
        
        if (modal) {
            modal.style.display = 'block';
            // Trigger smooth animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Focus on input and clear it
            if (folderNameInput) {
                folderNameInput.value = '';
                folderNameInput.focus();
            }
        }
    }

    hideCreateFolderModal() {
        const modal = document.getElementById('create-folder-modal');
        
        if (modal) {
            modal.classList.remove('show');
            
            // Hide modal after animation completes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    createNewFolder() {
        const folderNameInput = document.getElementById('folder-name');
        const folderName = folderNameInput.value.trim();

        if (!folderName) {
            this.showMessage('Vui lòng nhập tên thư mục!', 'error');
            return;
        }

        // Check if folder name already exists
        const existingFolders = this.getFolders();
        if (existingFolders.includes(folderName)) {
            this.showMessage('Tên thư mục đã tồn tại!', 'error');
            return;
        }

        // Create new folder
        this.addFolder(folderName);
        
        // Hide modal
        this.hideCreateFolderModal();
        
        // Show success message
        this.showMessage(`Đã tạo thư mục "${folderName}" thành công!`, 'success');
    }

    clearDefaultFolders() {
        // Force clear any existing folder data to start fresh
        localStorage.removeItem('flashcard-folders');
        
        // Also clear any cards that might be in default folders
        const storedCards = localStorage.getItem('flashcard-cards');
        if (storedCards) {
            const cards = JSON.parse(storedCards);
            const filteredCards = cards.filter(card => 
                card.folder !== 'TỨ QUÝ PLUS 2' && card.folder !== 'Advanced Vocab'
            );
            localStorage.setItem('flashcard-cards', JSON.stringify(filteredCards));
        }
        
        console.log('Đã xóa hoàn toàn dữ liệu thư mục mặc định');
    }

    getFolders() {
        const stored = localStorage.getItem('flashcard-folders');
        return stored ? JSON.parse(stored) : [];
    }

    saveFolders(folders) {
        localStorage.setItem('flashcard-folders', JSON.stringify(folders));
    }

    addFolder(folderName) {
        const folders = this.getFolders();
        folders.push(folderName);
        this.saveFolders(folders);
        this.updateFolderDisplay();
    }

    updateFolderDisplay() {
        const folders = this.getFolders();
        const folderList = document.getElementById('folder-list');
        
        if (folderList) {
            // Clear existing folders
            folderList.innerHTML = '';
            
            // Add new folder buttons
            folders.forEach((folderName, index) => {
                const folderButton = document.createElement('button');
                folderButton.className = 'nav-item nav-folder';
                folderButton.setAttribute('data-folder', folderName);
                folderButton.setAttribute('data-tooltip', folderName);
                folderButton.innerHTML = `
                    <i class="fas fa-folder"></i>
                    <span>${folderName}</span>
                `;
                
                // Add click event listener for folder selection
                folderButton.addEventListener('click', () => {
                    this.selectFolder(folderName);
                });
                
                folderList.appendChild(folderButton);
            });
        }
    }

    selectFolder(folderName) {
        // Set current folder
        this.currentFolder = folderName;
        
        // Update UI to show selected folder
        document.querySelectorAll('.nav-folder').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedBtn = document.querySelector(`[data-folder="${folderName}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        // Update card display to show only cards from this folder
        this.updateUI();
        
        console.log(`Đã chọn thư mục: ${folderName}`);
    }

    // User Management
    checkUserSession() {
        const savedUser = localStorage.getItem('flashcard-current-user');
        if (savedUser) {
            this.currentUser = savedUser;
            this.showApp();
        } else {
            this.showLoginModal();
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const appContainer = document.querySelector('.app-container');
        
        if (modal) modal.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        
        // Focus on username input after a short delay
        setTimeout(() => {
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showApp() {
        const modal = document.getElementById('loginModal');
        const userInfoBar = document.getElementById('userInfoBar');
        const appContainer = document.querySelector('.app-container');
        
        if (modal) modal.style.display = 'none';
        if (userInfoBar) userInfoBar.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'flex';
        
        // Update user info
        this.updateUserInfo();
    }

    login(username) {
        if (!username || username.trim() === '') {
            alert('Vui lòng nhập tên người dùng!');
            return;
        }
        
        this.currentUser = username.trim();
        localStorage.setItem('flashcard-current-user', this.currentUser);
        this.hideLoginModal();
        this.showApp();
        
        // Load user-specific data
        this.loadFromStorage();
        this.updateUI();
        
        console.log(`Đã đăng nhập với user: ${this.currentUser}`);
    }

    logout() {
        if (confirm('Bạn có chắc muốn đăng xuất? Dữ liệu sẽ được lưu tự động.')) {
            this.currentUser = null;
            localStorage.removeItem('flashcard-current-user');
            
            // Hide user info bar
            const userInfoBar = document.getElementById('userInfoBar');
            if (userInfoBar) userInfoBar.style.display = 'none';
            
            // Clear current data
            this.flashcards = [];
            this.currentFolder = null;
            this.updateUI();
            
            // Show login modal
            this.showLoginModal();
            
            console.log('Đã đăng xuất');
        }
    }

    getUserStorageKey(key) {
        if (!this.currentUser) {
            console.warn('No current user set, using default key');
            return `flashcard-${key}`;
        }
        return `flashcard-${this.currentUser}-${key}`;
    }

    getFolderCount() {
        const folders = new Set();
        this.flashcards.forEach(card => {
            if (card.folder) {
                folders.add(card.folder);
            }
        });
        return folders.size;
    }

    updateUserInfo() {
        const currentUserName = document.getElementById('currentUserName');
        if (currentUserName && this.currentUser) {
            const folderCount = this.getFolderCount();
            const cardCount = this.flashcards.length;
            currentUserName.textContent = `${this.currentUser} (${folderCount} thư mục, ${cardCount} thẻ)`;
        }
    }

    // Tab Management
    switchTab(tabName) {
        // Update UI and content in one go, but optimized
        this.updateTabsUI(tabName);
        this.updateTabContent(tabName);
    }
    
    updateTabsUI(tabName) {
        // Update active tab immediately
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }

        // Update active content immediately
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }
    }
    
    updateTabContent(tabName) {
        // Optimized content updates that are fast enough for single-click
        switch(tabName) {
            case 'study':
                this.updateStudyMode();
                break;
            case 'manage':
                // Use timeout only for manage mode as it's heavier
                if (this._manageUpdateTimeout) {
                    clearTimeout(this._manageUpdateTimeout);
                }
                this._manageUpdateTimeout = setTimeout(() => {
                    this.updateManageMode();
                }, 10); // Very short delay
                break;
            case 'add':
                // Add tab doesn't need updates
                break;
        }
    }

    // Bulk Import Modal Management
    showBulkImportModal() {
        const modal = document.getElementById('bulk-import-modal');
        modal.style.display = 'block';
        
        // Trigger smooth animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Clear form when opening
        document.getElementById('bulk-import-form').reset();
        
        // Add click outside to close functionality
        this.setupModalClickOutside(modal);
    }

    hideBulkImportModal() {
        const modal = document.getElementById('bulk-import-modal');
        
        // Remove show class for smooth exit animation
        modal.classList.remove('show');
        
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Clean up click outside listener
        if (this.modalClickOutsideHandler) {
            document.removeEventListener('click', this.modalClickOutsideHandler);
            this.modalClickOutsideHandler = null;
        }
    }

    setupModalClickOutside(modal) {
        // Remove any existing click outside listener
        if (this.modalClickOutsideHandler) {
            document.removeEventListener('click', this.modalClickOutsideHandler);
        }
        
        // Create new click outside handler
        this.modalClickOutsideHandler = (event) => {
            // Check if click is outside the modal content
            const modalContent = modal.querySelector('.bulk-import-modal-content');
            if (modalContent && !modalContent.contains(event.target) && modal.style.display === 'block') {
                this.hideBulkImportModal();
                // Remove the event listener after closing
                document.removeEventListener('click', this.modalClickOutsideHandler);
                this.modalClickOutsideHandler = null;
            }
        };
        
        // Add the event listener with a small delay to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', this.modalClickOutsideHandler);
        }, 100);
    }

    // Add Card Functionality
    addCard() {
        const frontText = document.getElementById('front-text').value.trim();
        const backText = document.getElementById('back-text').value.trim();
        const category = document.getElementById('category').value.trim() || 'General';

        if (!frontText || !backText) {
            this.showMessage('Please fill in both front and back text.', 'error');
            return;
        }

        const newCard = {
            id: Date.now().toString(),
            front: frontText,
            back: backText,
            category: category,
            createdAt: new Date().toISOString()
        };

        this.flashcards.push(newCard);
        this.saveToStorage();
        
        // Clear form
        document.getElementById('add-card-form').reset();
        
        // Show success message
        this.showMessage('Flashcard added successfully!', 'success');
        
        // Update UI
        this.updateCategoryFilters();
        this.updateManageMode();
    }

    // Multiple Cards Functionality
    addCardRow() {
        this.cardRowCounter++;
        const container = document.getElementById('card-rows-container');
        
        const rowDiv = document.createElement('div');
        rowDiv.className = 'card-row';
        rowDiv.dataset.rowId = this.cardRowCounter;
        
        rowDiv.innerHTML = `
            <div class="card-row-number">${this.cardRowCounter}</div>
            <div class="card-row-inputs">
                <div class="card-input-group">
                    <label>${this.translations[this.currentLanguage]['term-label']}</label>
                    <input type="text" placeholder="${this.translations[this.currentLanguage]['term-placeholder']}" class="card-front-input" required>
                </div>
                <div class="card-input-group">
                    <label>${this.translations[this.currentLanguage]['definition-label']}</label>
                    <input type="text" placeholder="${this.translations[this.currentLanguage]['definition-placeholder']}" class="card-back-input" required>
                </div>
            </div>
            <div class="card-row-actions">
                <button type="button" class="remove-row-btn" onclick="app.removeCardRow(${this.cardRowCounter})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(rowDiv);
        
        // Focus on the first input of the new row
        rowDiv.querySelector('.card-front-input').focus();
        
        // Add animation
        rowDiv.style.opacity = '0';
        rowDiv.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            rowDiv.style.transition = 'all 0.3s ease';
            rowDiv.style.opacity = '1';
            rowDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    removeCardRow(rowId) {
        const row = document.querySelector(`[data-row-id="${rowId}"]`);
        if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                row.remove();
                this.updateRowNumbers();
            }, 300);
        }
    }

    updateRowNumbers() {
        const rows = document.querySelectorAll('.card-row');
        rows.forEach((row, index) => {
            const numberDiv = row.querySelector('.card-row-number');
            numberDiv.textContent = index + 1;
        });
    }

    clearAllRows() {
        const container = document.getElementById('card-rows-container');
        container.innerHTML = '';
        this.cardRowCounter = 0;
        this.addCardRow(); // Add one empty row
    }

    addMultipleCards() {
        const lessonName = document.getElementById('category').value.trim();
        
        if (!lessonName) {
            this.showMessage('Please enter a lesson name before adding flashcards.', 'error');
            document.getElementById('category').focus();
            return;
        }
        
        const rows = document.querySelectorAll('.card-row');
        const newCards = [];
        const errors = [];
        
        rows.forEach((row, index) => {
            const frontInput = row.querySelector('.card-front-input');
            const backInput = row.querySelector('.card-back-input');
            
            const frontText = frontInput.value.trim();
            const backText = backInput.value.trim();
            
            if (frontText && backText) {
                newCards.push({
                    id: (Date.now() + index).toString(),
                    front: frontText,
                    back: backText,
                    category: lessonName,
                    createdAt: new Date().toISOString()
                });
            } else if (frontText || backText) {
                errors.push(`Row ${index + 1}: Both term and definition are required`);
            }
        });
        
        if (newCards.length === 0) {
            this.showMessage('Please fill in at least one complete flashcard.', 'error');
            return;
        }
        
        if (errors.length > 0) {
            this.showMessage(`Some rows were skipped: ${errors.join(', ')}`, 'error');
        }
        
        // Add cards to collection
        this.flashcards.push(...newCards);
        this.saveToStorage();
        
        // Clear all rows and add one empty row
        this.clearAllRows();
        
        // Clear lesson name
        document.getElementById('category').value = '';
        
        // Show success message
        this.showMessage(`Successfully added ${newCards.length} flashcard(s) to lesson "${lessonName}"!`, 'success');
        
        // Update UI
        this.updateCategoryFilters();
        this.updateManageMode();
    }

    // Bulk Import Functionality
    bulkImportCards() {
        const bulkText = document.getElementById('bulk-text').value.trim();
        const lessonName = document.getElementById('bulk-category').value.trim();

        if (!lessonName) {
            this.showMessage('Please enter a lesson name before importing flashcards.', 'error');
            document.getElementById('bulk-category').focus();
            return;
        }

        if (!bulkText) {
            this.showMessage('Please enter flashcard data.', 'error');
            return;
        }

        const lines = bulkText.split('\n').filter(line => line.trim());
        const parsedCards = [];
        const errors = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            let front = '';
            let back = '';
            
            // Try tab separator first (most reliable)
            if (trimmedLine.includes('\t')) {
                const parts = trimmedLine.split('\t');
                if (parts.length >= 2) {
                    front = parts[0].trim();
                    back = parts.slice(1).join('\t').trim(); // Join back all parts after first tab
                }
            }
            // Try pipe separator with flexible spacing
            else if (trimmedLine.includes('|')) {
                const pipeIndex = trimmedLine.indexOf('|');
                front = trimmedLine.substring(0, pipeIndex).trim();
                back = trimmedLine.substring(pipeIndex + 1).trim();
            }
            // Enhanced space parsing - look for English word pattern at the beginning
            else {
                // More sophisticated parsing for space-separated format
                // Try to identify where English ends and Vietnamese begins
                const words = trimmedLine.split(' ');
                
                if (words.length >= 2) {
                    // For simple cases: single English word + Vietnamese meaning
                    if (words.length === 2) {
                        front = words[0].trim();
                        back = words[1].trim();
                    }
                    // For complex cases: try to find the split point
                    else {
                        // Look for common English patterns (letters only, no diacritics)
                        let splitIndex = 1; // Default to first word as front
                        
                        for (let i = 1; i < words.length; i++) {
                            const word = words[i];
                            // If we find Vietnamese characters or common Vietnamese words, split here
                            if (this.isVietnameseWord(word)) {
                                splitIndex = i;
                                break;
                            }
                            // If word contains English punctuation that suggests end of term
                            if (word.includes('...') || word.includes(',') || word.includes('.')) {
                                splitIndex = i + 1;
                                break;
                            }
                        }
                        
                        front = words.slice(0, splitIndex).join(' ').trim();
                        back = words.slice(splitIndex).join(' ').trim();
                    }
                } else {
                    errors.push(`Line ${index + 1}: Invalid format. Use Tab, pipe (|), or proper spacing to separate term and definition`);
                    return;
                }
            }
            
            if (front && back) {
                parsedCards.push({
                    id: (Date.now() + index * 10).toString(), // Avoid ID conflicts
                    front: front,
                    back: back,
                    category: lessonName,
                    createdAt: new Date().toISOString()
                });
            } else {
                errors.push(`Line ${index + 1}: Could not separate term and definition properly`);
            }
        });

        if (errors.length > 0) {
            this.showMessage(`Import completed with errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`, 'error');
        }

        if (parsedCards.length > 0) {
            this.flashcards.push(...parsedCards);
            this.saveToStorage();
            
            // Clear form and close modal
            document.getElementById('bulk-import-form').reset();
            this.hideBulkImportModal();
            
            // Show success message
            this.showMessage(`Successfully imported ${parsedCards.length} flashcard(s) to lesson "${lessonName}"!`, 'success');
            
            // Update UI
            this.updateCategoryFilters();
            this.updateManageMode();
        } else {
            this.showMessage('No valid flashcards found to import.', 'error');
        }
    }

    // Study Mode
    updateStudyMode() {
        // Use cached data if available to speed up switching
        if (!this._studyModeInitialized) {
            this.prepareStudyCards();
            this._studyModeInitialized = true;
        } else {
            // Quick update without full rebuild
            this.refreshStudyDisplay();
        }
    }
    
    refreshStudyDisplay() {
        // Lightweight refresh for tab switching
        this.displayCurrentCard();
        this.updateStudyNavigation();
    }

    prepareStudyCards() {
        const categoryFilter = document.getElementById('category-filter').value;
        
        if (categoryFilter) {
            this.studyCards = this.flashcards.filter(card => card.category === categoryFilter);
        } else {
            this.studyCards = [...this.flashcards];
        }
        
        this.currentCardIndex = 0;
        this.isFlipped = false;
        
        // Update display after preparing cards
        this.displayCurrentCard();
        this.updateStudyNavigation();
    }

    filterStudyCards(category) {
        this.prepareStudyCards();
        this.displayCurrentCard();
        this.updateStudyNavigation();
    }

    displayCurrentCard() {
        const flashcardElement = document.getElementById('flashcard-study');
        const noCardsElement = document.getElementById('no-cards-message');

        if (this.studyCards.length === 0) {
            flashcardElement.style.display = 'none';
            noCardsElement.style.display = 'block';
            return;
        }

        flashcardElement.style.display = 'block';
        noCardsElement.style.display = 'none';

        const currentCard = this.studyCards[this.currentCardIndex];
        
        document.getElementById('card-front-content').textContent = currentCard.front;
        document.getElementById('card-back-content').textContent = currentCard.back;
        
        // Reset flip state
        flashcardElement.classList.remove('flipped');
        this.isFlipped = false;
    }

    flipCard() {
        if (this.studyCards.length === 0) return;
        
        const flashcardElement = document.getElementById('flashcard-study');
        flashcardElement.classList.toggle('flipped');
        this.isFlipped = !this.isFlipped;
    }

    previousCard() {
        if (this.studyCards.length === 0) return;
        
        this.currentCardIndex = (this.currentCardIndex - 1 + this.studyCards.length) % this.studyCards.length;
        this.displayCurrentCard();
        this.updateStudyNavigation();
    }

    nextCard() {
        if (this.studyCards.length === 0) return;
        
        this.currentCardIndex = (this.currentCardIndex + 1) % this.studyCards.length;
        this.displayCurrentCard();
        this.updateStudyNavigation();
    }

    shuffleCards() {
        if (this.studyCards.length === 0) return;
        
        // Fisher-Yates shuffle algorithm
        for (let i = this.studyCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.studyCards[i], this.studyCards[j]] = [this.studyCards[j], this.studyCards[i]];
        }
        
        this.currentCardIndex = 0;
        this.displayCurrentCard();
        this.updateStudyNavigation();
        this.showMessage('Cards shuffled!', 'success');
    }

    updateStudyNavigation() {
        const counter = document.getElementById('card-counter');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (this.studyCards.length === 0) {
            counter.textContent = '0 / 0';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        } else {
            counter.textContent = `${this.currentCardIndex + 1} / ${this.studyCards.length}`;
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    }

    // Manage Mode
    updateManageMode() {
        // Simplified update - just call displayAllCards directly
        this.displayAllCards();
    }

    displayAllCards() {
        const cardsList = this.elements.cardsList;
        const searchTerm = document.getElementById('search-cards').value.toLowerCase();
        const categoryFilter = this.elements.manageCategoryFilter.value;

        let filteredCards = this.flashcards;

        // Apply search filter
        if (searchTerm) {
            filteredCards = filteredCards.filter(card => 
                card.front.toLowerCase().includes(searchTerm) || 
                card.back.toLowerCase().includes(searchTerm) ||
                card.category.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        if (categoryFilter) {
            filteredCards = filteredCards.filter(card => card.category === categoryFilter);
        }

        // Apply horizontal scrolling preference
        cardsList.className = 'cards-list cards-list-horizontal';

        if (filteredCards.length === 0) {
            cardsList.innerHTML = `
                <div class="no-cards">
                    <i class="fas fa-search"></i>
                    <p>No flashcards found matching your criteria.</p>
                </div>
            `;
            return;
        }

        // Build HTML more efficiently
        const cardsHTML = filteredCards.map(card => `
            <div class="card-item">
                <div class="card-content-item">
                    <div class="card-front-item">${this.escapeHtml(card.front)}</div>
                    <div class="card-back-item">${this.escapeHtml(card.back)}</div>
                    <div class="card-category-item">Lesson: ${this.escapeHtml(card.category)}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editCard('${card.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="app.confirmDeleteCard('${card.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        cardsList.innerHTML = cardsHTML;
    }

    searchCards(searchTerm) {
        this.displayAllCards();
    }

    filterManageCards(category) {
        this.displayAllCards();
    }

    editCard(cardId) {
        const card = this.flashcards.find(c => c.id === cardId);
        if (!card) return;

        // Switch to add tab and populate form
        this.switchTab('add');
        document.getElementById('front-text').value = card.front;
        document.getElementById('back-text').value = card.back;
        document.getElementById('category').value = card.category;

        // Delete the old card
        this.deleteCard(cardId);
        
        this.showMessage('Card loaded for editing. Make changes and add again.', 'info');
    }

    confirmDeleteCard(cardId) {
        this.pendingAction = {
            type: 'deleteCard',
            cardId: cardId
        };
        
        this.showModal(
            'Delete Flashcard',
            'Are you sure you want to delete this flashcard? This action cannot be undone.',
            'Delete'
        );
    }

    deleteCard(cardId) {
        this.flashcards = this.flashcards.filter(card => card.id !== cardId);
        this.saveToStorage();
        this.updateUI();
        this.showMessage('Flashcard deleted successfully!', 'success');
    }

    confirmDeleteAll() {
        if (this.flashcards.length === 0) {
            this.showMessage('No flashcards to delete.', 'info');
            return;
        }

        this.pendingAction = {
            type: 'deleteAll'
        };
        
        this.showModal(
            'Delete All Flashcards',
            `Are you sure you want to delete all ${this.flashcards.length} flashcards? This action cannot be undone.`,
            'Delete All'
        );
    }

    deleteAllCards() {
        this.flashcards = [];
        this.studyCards = [];
        this.currentCardIndex = 0;
        this.saveToStorage();
        this.updateUI();
        this.showMessage('All flashcards deleted successfully!', 'success');
    }

    // UI Updates
    updateUI() {
        // Only update category filters once to avoid redundant DOM manipulation
        this.updateCategoryFilters();
        
        // Mark study mode as needing refresh on next access
        this._studyModeInitialized = false;
        
        // Only update manage mode if it's currently active
        if (document.getElementById('manage-tab').classList.contains('active')) {
            this.updateManageMode();
        }
        
        // Update user info if logged in
        if (this.currentUser) {
            this.updateUserInfo();
        }
    }

    updateCategoryFilters() {
        const categories = [...new Set(this.flashcards.map(card => card.category))];
        
        const studyFilter = document.getElementById('category-filter');
        const manageFilter = document.getElementById('manage-category-filter');
        
        [studyFilter, manageFilter].forEach(filter => {
            const currentValue = filter.value;
            filter.innerHTML = '<option value="">All Lessons</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                filter.appendChild(option);
            });
            
            filter.value = currentValue;
        });
    }

    // Modal Management
    showModal(title, message, confirmText = 'Confirm') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-confirm').textContent = confirmText;
        document.getElementById('modal').style.display = 'block';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
        this.pendingAction = null;
    }

    executeModalAction() {
        if (!this.pendingAction) return;

        switch (this.pendingAction.type) {
            case 'deleteCard':
                this.deleteCard(this.pendingAction.cardId);
                break;
            case 'deleteAll':
                this.deleteAllCards();
                break;
        }

        this.hideModal();
    }

    // Utility Functions
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.success-message, .error-message, .info-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `${type}-message`;
        messageElement.textContent = message;
        
        // Insert at the beginning of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageElement, mainContent.firstChild);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to detect Vietnamese words
    isVietnameseWord(word) {
        // Vietnamese diacritics and common Vietnamese words
        const vietnameseDiacritics = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
        const commonVietnameseWords = ['và', 'của', 'có', 'là', 'trong', 'với', 'để', 'được', 'các', 'một', 'về', 'phía', 'nào', 'như', 'khi', 'đã', 'sẽ', 'đi', 'hướng', 'thể', 'người', 'năm', 'ngày', 'giờ', 'lúc', 'bây', 'giây', 'cách', 'nơi', 'chỗ', 'đó', 'đây', 'này', 'kia'];
        
        return vietnameseDiacritics.test(word) || commonVietnameseWords.includes(word.toLowerCase());
    }

    // Language Management
    translations = {
        en: {
            'app-title': 'Flashcard Learning',
            'add-cards-tab': 'Add Cards',
            'study-tab': 'Study',
            'manage-tab': 'Manage Cards',
            'single-card': 'Single Card',
            'bulk-import': 'Bulk Import',
            'add-flashcards-title': 'Add New Flashcards',
            'lesson-name-label': 'Lesson Name (Required):',
            'lesson-name-placeholder': 'Enter lesson name (e.g., English Vocabulary, Math Terms...)',
            'add-row': 'Add Row',
            'save-all-flashcards': 'Save All Flashcards',
            'clear-all': 'Clear All',
            'term-label': 'TERM',
            'definition-label': 'DEFINITION',
            'term-placeholder': 'Enter vocabulary word...',
            'definition-placeholder': 'Enter meaning...',
            'format-instructions': 'Format Instructions',
            'format-description': 'Enter your flashcards using one of these formats:',
            'format-example-text': 'word\tmeaning or word | meaning',
            'format-example-label': 'Example:',
            'format-note': 'Each flashcard should be on a separate line. Use Tab key or pipe (|) to separate term and definition.'
        },
        vi: {
            'app-title': 'Học Flashcard',
            'add-cards-tab': 'Thêm Thẻ',
            'study-tab': 'Học',
            'manage-tab': 'Quản Lý Thẻ',
            'single-card': 'Thẻ Đơn',
            'bulk-import': 'Nhập Hàng Loạt',
            'add-flashcards-title': 'Thêm Flashcard Mới',
            'lesson-name-label': 'Tên Bài Học (Bắt buộc):',
            'lesson-name-placeholder': 'Nhập tên bài học (VD: Từ vựng Tiếng Anh, Thuật ngữ Toán...)',
            'add-row': 'Thêm Hàng',
            'save-all-flashcards': 'Lưu Tất Cả Flashcard',
            'clear-all': 'Xóa Tất Cả',
            'term-label': 'THUẬT NGỮ',
            'definition-label': 'ĐỊNH NGHĨA',
            'term-placeholder': 'Nhập từ vựng...',
            'definition-placeholder': 'Nhập nghĩa...',
            'format-instructions': 'Hướng Dẫn Định Dạng',
            'format-description': 'Nhập flashcard theo một trong các định dạng:',
            'format-example-text': 'từ_vựng\tnghĩa hoặc từ_vựng | nghĩa',
            'format-example-label': 'Ví dụ:',
            'format-note': 'Mỗi flashcard trên một dòng riêng biệt. Dùng phím Tab hoặc dấu gạch đứng (|) để tách từ vựng và nghĩa.'
        }
    };

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
        this.saveLanguageToStorage();
        this.updateLanguage();
    }

    updateLanguage() {
        const langText = document.getElementById('lang-text');
        langText.textContent = this.currentLanguage === 'en' ? 'VI' : 'EN';
        
        // Update all elements with data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (this.translations[this.currentLanguage][key]) {
                element.textContent = this.translations[this.currentLanguage][key];
            }
        });
        
        // Update placeholders
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (element.tagName === 'INPUT' && this.translations[this.currentLanguage][key]) {
                element.placeholder = this.translations[this.currentLanguage][key];
            }
        });
        
        // Update existing card row labels
        this.updateCardRowLabels();
    }

    updateCardRowLabels() {
        document.querySelectorAll('.card-input-group label').forEach((label, index) => {
            if (index % 2 === 0) {
                label.textContent = this.translations[this.currentLanguage]['term-label'];
            } else {
                label.textContent = this.translations[this.currentLanguage]['definition-label'];
            }
        });
        
        document.querySelectorAll('.card-front-input').forEach(input => {
            input.placeholder = this.translations[this.currentLanguage]['term-placeholder'];
        });
        
        document.querySelectorAll('.card-back-input').forEach(input => {
            input.placeholder = this.translations[this.currentLanguage]['definition-placeholder'];
        });
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FlashcardApp();
});

// Additional CSS for message types
const additionalStyles = `
.error-message {
    background: #e53e3e;
    color: white;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 20px;
    animation: slideIn 0.3s ease-out;
}

.info-message {
    background: #3182ce;
    color: white;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 20px;
    animation: slideIn 0.3s ease-out;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);