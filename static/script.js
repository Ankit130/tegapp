let currentQuery = '';
let currentPage = 1;
let totalPages = 1;
let sortBy = 'callDate';
let sortOrder = 'desc';

// Function to search interviews
function searchInterviews() {
    const query = document.getElementById('searchInput').value;
    if (query === currentQuery) return;
    currentQuery = query;
    currentPage = 1; // Reset to first page on new search
    fetchInterviews(query);
}

// Fetch interviews with search, pagination, and sorting
function fetchInterviews(query = '') {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<p class="loading">Searching...</p>';
    
    // Build the URL with pagination and sorting params
    const url = query
        ? `/api/search?query=${encodeURIComponent(query)}&page=${currentPage}&sort_by=${sortBy}&sort_order=${sortOrder}`
        : `/api/interviews?page=${currentPage}&sort_by=${sortBy}&sort_order=${sortOrder}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayResults(data.interviews);
            updatePagination(data.total, data.per_page);
        })
        .catch(error => {
            console.error('Error:', error);
            resultsContainer.innerHTML = '<p class="error">An error occurred while searching. Please try again.</p>';
        });
}

// Function to display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No results found.</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <h3>${result.title}</h3>
            <p class="company">${result['Company Name']} (${result['Company Ticker'] || 'N/A'})</p>
            <p class="date">Call Date: ${new Date(result.callDate).toLocaleDateString()}</p>
            <p class="summary">${truncateSummary(result.summary, 150)}</p>
        `;
        resultItem.onclick = () => displayPDF(result['pdf link']);
        resultsContainer.appendChild(resultItem);
    });
}

// Function to truncate long summaries
function truncateSummary(summary, maxLength) {
    return summary.length <= maxLength ? summary : summary.substr(0, maxLength) + '...';
}

function displayPDF(url) {
    const pdfContainer = document.getElementById('pdfContainer');
    pdfContainer.innerHTML = '';  // Clear previous content
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    
    console.log("Starting to load PDF from URL:", url);

    var loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then(function(pdf) {
        const totalPages = pdf.numPages;
        console.log("PDF loaded successfully. Total pages:", totalPages);
        
        // Render pages sequentially
        let currentPage1 = 1;
        function renderNextPage() {
            if (currentPage1 <= totalPages) {
                console.log("Rendering page", currentPage1);
                renderPage(pdf, currentPage1).then(() => {
                    currentPage1++;
                    renderNextPage();
                });
            } else {
                console.log("All pages rendered");
                const pdfPlaceholder = document.getElementById('pdfPlaceholder');
                pdfPlaceholder.style.display = 'none';
            }
        }
        
        renderNextPage();
    }).catch(function(error) {
        console.error("Error loading PDF:", error);
    });
}

function renderPage(pdf, pageNum) {
    return new Promise((resolve, reject) => {
        pdf.getPage(pageNum).then(function(page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            
            const pdfContainer = document.getElementById('pdfContainer');
            pdfContainer.appendChild(canvas);

            page.render(renderContext).promise.then(() => {
                console.log("Page", pageNum, "rendered successfully");
                resolve();
            }).catch((error) => {
                console.error("Error rendering page", pageNum, ":", error);
                reject(error);
            });
        }).catch((error) => {
            console.error("Error getting page", pageNum, ":", error);
            reject(error);
        });
    });
}

// Update pagination based on API response
function updatePagination(total, perPage) {
    totalPages = Math.ceil(total / perPage);
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Change page when next or previous buttons are clicked
function changePage(delta) {
    currentPage += delta;
    fetchInterviews(currentQuery);
}

// Change sorting when the sort field is updated
function updateSort() {
    sortBy = document.getElementById('sortBy').value;
    fetchInterviews(currentQuery);
}

// Toggle the sort order (asc or desc)
function toggleSortOrder() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    const sortOrderButton = document.getElementById('sortOrder');
    sortOrderButton.innerHTML = sortOrder === 'asc'
        ? '<i class="fas fa-sort-amount-up"></i>'
        : '<i class="fas fa-sort-amount-down"></i>';
    fetchInterviews(currentQuery);
}

// Debounce function to limit how often searchInterviews is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add event listener to search input with debounce
document.getElementById('searchInput').addEventListener('input', debounce(searchInterviews, 300));

// Initialize page and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    searchInput.focus();

    // Pagination buttons
    //document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    //document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Sorting
    document.getElementById('sortBy').addEventListener('change', updateSort);
    document.getElementById('sortOrder').addEventListener('click', toggleSortOrder);
});

