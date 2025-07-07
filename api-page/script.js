document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");

    try {
        const settings = await fetch('/src/settings.json').then(res => res.json());

        // Set basic content
        document.getElementById('page').textContent = settings.name || "Finix UI API's";
        document.getElementById('name').textContent = settings.name || "Finix UI API's";
        document.getElementById('description').textContent = settings.description || "Simple and fast API for full-featured WhatsApp Bot integration.";
        document.getElementById('wm').textContent = `Docs - ${settings.name || "Finix UI API's"}`;

        // Set base URL
        if (settings.links && settings.links.length > 0) {
            const baseUrlLink = document.getElementById('baseUrlLink');
            baseUrlLink.href = settings.links[0].url;
            baseUrlLink.textContent = settings.links[0].url;
        }

        // Create navigation tabs
        const navTabs = document.getElementById('navTabs');
        const apiContent = document.getElementById('apiContent');
        
        let activeCategory = null;

        settings.categories.forEach((category, index) => {
            // Create tab
            const tab = document.createElement('button');
            tab.className = `nav-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = category.name;
            tab.dataset.category = category.name;
            navTabs.appendChild(tab);

            // Create category section
            const categorySection = document.createElement('div');
            categorySection.className = `category-section ${index === 0 ? 'active' : ''}`;
            categorySection.dataset.category = category.name;

            // Sort items alphabetically
            const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name));
            
            sortedItems.forEach(item => {
                const apiItem = document.createElement('div');
                apiItem.className = 'api-item';
                apiItem.innerHTML = `
                    <div class="api-info">
                        <div class="api-name">${item.name}</div>
                        <div class="api-desc">${item.desc}</div>
                    </div>
                    <button class="play-button get-api-btn" 
                            data-api-path="${item.path}" 
                            data-api-name="${item.name}" 
                            data-api-desc="${item.desc}">
                    </button>
                `;
                categorySection.appendChild(apiItem);
            });

            apiContent.appendChild(categorySection);

            if (index === 0) {
                activeCategory = category.name;
            }
        });

        // Tab switching functionality
        navTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-tab')) {
                // Remove active class from all tabs and sections
                document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.category-section').forEach(section => section.classList.remove('active'));

                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Show corresponding section
                const categoryName = e.target.dataset.category;
                const targetSection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
                
                activeCategory = categoryName;
            }
        });

        // API button click handler
        document.addEventListener('click', event => {
            if (!event.target.classList.contains('get-api-btn')) return;

            const { apiPath, apiName, apiDesc } = event.target.dataset;
            const modal = new bootstrap.Modal(document.getElementById('apiResponseModal'));
            const modalRefs = {
                label: document.getElementById('apiResponseModalLabel'),
                desc: document.getElementById('apiResponseModalDesc'),
                content: document.getElementById('apiResponseContent'),
                endpoint: document.getElementById('apiEndpoint'),
                spinner: document.getElementById('apiResponseLoading'),
                queryInputContainer: document.getElementById('apiQueryInputContainer'),
                submitBtn: document.getElementById('submitQueryBtn')
            };

            modalRefs.label.textContent = apiName;
            modalRefs.desc.textContent = apiDesc;
            modalRefs.content.textContent = '';
            modalRefs.endpoint.textContent = '';
            modalRefs.spinner.classList.add('d-none');
            modalRefs.content.classList.add('d-none');
            modalRefs.endpoint.style.display = 'none';

            modalRefs.queryInputContainer.innerHTML = '';
            modalRefs.submitBtn.style.display = 'none';

            let baseApiUrl = `${window.location.origin}${apiPath}`;
            let params = new URLSearchParams(apiPath.split('?')[1]);
            let hasParams = params.toString().length > 0;

            if (hasParams) {
                const paramContainer = document.createElement('div');
                paramContainer.className = 'param-container';

                const paramsArray = Array.from(params.keys());
                
                paramsArray.forEach((param, index) => {
                    const paramGroup = document.createElement('div');
                    paramGroup.className = index < paramsArray.length - 1 ? 'mb-2' : '';

                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.className = 'form-control';
                    inputField.placeholder = `input ${param}...`;
                    inputField.dataset.param = param;
                    inputField.required = true;
                    inputField.addEventListener('input', validateInputs);

                    paramGroup.appendChild(inputField);
                    paramContainer.appendChild(paramGroup);
                });
                
                const currentItem = settings.categories
                    .flatMap(category => category.items)
                    .find(item => item.path === apiPath);

                if (currentItem && currentItem.innerDesc) {
                    const innerDescDiv = document.createElement('div');
                    innerDescDiv.className = 'text-muted mt-2';
                    innerDescDiv.style.fontSize = '13px';
                    innerDescDiv.innerHTML = currentItem.innerDesc.replace(/\n/g, '<br>');
                    paramContainer.appendChild(innerDescDiv);
                }

                modalRefs.queryInputContainer.appendChild(paramContainer);
                modalRefs.submitBtn.style.display = 'block';

                modalRefs.submitBtn.onclick = async () => {
                    const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                    const newParams = new URLSearchParams();
                    let isValid = true;

                    inputs.forEach(input => {
                        if (!input.value.trim()) {
                            isValid = false;
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                            newParams.append(input.dataset.param, input.value.trim());
                        }
                    });

                    if (!isValid) {
                        modalRefs.content.textContent = 'Please fill in all required fields.';
                        modalRefs.content.classList.remove('d-none');
                        return;
                    }

                    const apiUrlWithParams = `${window.location.origin}${apiPath.split('?')[0]}?${newParams.toString()}`;
                    
                    modalRefs.queryInputContainer.innerHTML = '';
                    modalRefs.submitBtn.style.display = 'none';
                    handleApiRequest(apiUrlWithParams, modalRefs, apiName);
                };
            } else {
                handleApiRequest(baseApiUrl, modalRefs, apiName);
            }

            modal.show();
        });

        function validateInputs() {
            const submitBtn = document.getElementById('submitQueryBtn');
            const inputs = document.querySelectorAll('.param-container input');
            const isValid = Array.from(inputs).every(input => input.value.trim() !== '');
            submitBtn.disabled = !isValid;
        }

        async function handleApiRequest(apiUrl, modalRefs, apiName) {
            modalRefs.spinner.classList.remove('d-none');
            modalRefs.content.classList.add('d-none');

            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.startsWith('image/')) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = apiName;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '5px';

                    modalRefs.content.innerHTML = '';
                    modalRefs.content.appendChild(img);
                } else {
                    const data = await response.json();
                    modalRefs.content.textContent = JSON.stringify(data, null, 2);
                }

                modalRefs.endpoint.textContent = apiUrl;
                modalRefs.endpoint.style.display = 'block';
            } catch (error) {
                modalRefs.content.textContent = `Error: ${error.message}`;
            } finally {
                modalRefs.spinner.classList.add('d-none');
                modalRefs.content.classList.remove('d-none');
            }
        }

        // Search functionality (hidden for now to match reference design)
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const currentSection = document.querySelector('.category-section.active');
            if (currentSection) {
                const apiItems = currentSection.querySelectorAll('.api-item');
                apiItems.forEach(item => {
                    const name = item.querySelector('.api-name').textContent.toLowerCase();
                    const desc = item.querySelector('.api-desc').textContent.toLowerCase();
                    item.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
                });
            }
        });

    } catch (error) {
        console.error('Error loading settings:', error);
    } finally {
        setTimeout(() => {
            loadingScreen.style.display = "none";
            body.classList.remove("no-scroll");
        }, 1500);
    }
});

