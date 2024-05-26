document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const startBar = document.getElementById('start-bar');
    const popup = document.getElementById('popup');
    const popupOkButton = document.getElementById('popup-ok');
    let maximizedSection = null;
    const sectionStates = {}; // Object to store initial HTML of each section
    let cmdPromptName = ''; // Variable to store command prompt name

    // Fetch content.json and update sections
    fetch('content.json')
        .then(response => response.json())
        .then(data => {
            // Populate the header with the personal information
            document.getElementById('name').textContent = `${data.firstName} ${data.lastName}`;
            document.getElementById('email').textContent = data.email;
            document.getElementById('email').href = `mailto:${data.email}`;
            document.getElementById('phone').textContent = data.phone;
            document.getElementById('linkedin').textContent = 'LinkedIn';
            document.getElementById('linkedin').href = data.linkedin;
            document.getElementById('github').textContent = 'GitHub';
            document.getElementById('github').href = data.github;
            
            cmdPromptName = `${data.firstName.toLowerCase()}${data.lastName.charAt(0).toUpperCase()}`;

            // Populate the sections with their respective content
            document.querySelectorAll('section').forEach(section => {
                const sectionClass = section.getAttribute('data-section');
                runCmdAnimation(sectionClass, data);
                setActiveButton(sectionClass, true); // Set the active button
            });
        })
        .catch(error => console.error('Error fetching content.json:', error));

    // Store the initial state of each section
    document.querySelectorAll('section').forEach(section => {
        const sectionClass = section.getAttribute('data-section');
        sectionStates[sectionClass] = section.outerHTML;
    });

    // Event listener for main content to handle minimize, maximize, and close buttons
    mainContent.addEventListener('click', (event) => {
        const target = event.target;
        const section = target.closest('section');

        if (target.classList.contains('minimize')) {
            toggleMinimize(section);
        } else if (target.classList.contains('maximize')) {
            toggleMaximize(section);
        } else if (target.classList.contains('close')) {
            closeSection(section);
        }
    });

    // Event listener for start bar buttons to reopen closed sections
    startBar.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('start-button')) {
            const sectionClass = target.getAttribute('data-target');
            const section = mainContent.querySelector(`section[data-section="${sectionClass}"]`);

            if (section) {
                // Section is already open, show popup message
                showPopup("This program is already running");
            } else {
                // Section is not open, recreate it from the stored state at the correct position
                if (sectionStates[sectionClass]) {
                    const placeholder = document.getElementById(`placeholder-${sectionClass}`);
                    if (placeholder) {
                        placeholder.insertAdjacentHTML('afterend', sectionStates[sectionClass]);
                        reinitializeSection(sectionClass);
                    }
                    if (sectionClass === 'skills' || sectionClass === 'projects') {
                        maintainSkillsProjectsLayout(); // Ensure initial layout is correct
                    }
                }
            }
            setActiveButton(sectionClass, true); // Set the active button
        }
    });

    // Event listener for popup OK button to hide the popup
    popupOkButton.addEventListener('click', () => {
        popup.classList.remove('visible');
        popup.style.display = 'none'; // Hide the popup

        // Hide overlay
        const overlay = document.getElementById('overlay');
        overlay.style.display = 'none';
    });

    // Function to run CMD prompt-like animation
    function runCmdAnimation(sectionClass, data) {
        const section = mainContent.querySelector(`section[data-section="${sectionClass}"]`);
        if (!section) return;

        const cmdPrompt = section.querySelector('.cmd-prompt');
        const content = section.querySelector('.content');
        cmdPrompt.innerHTML = ''; // Clear existing command prompt content

        const staticText = `C:/${cmdPromptName}/scripts> `;
        const dynamicText = 'run ' + sectionClass + '.exe';

        const staticSpan = document.createElement('span');
        staticSpan.textContent = staticText;
        cmdPrompt.appendChild(staticSpan);

        const dynamicSpan = document.createElement('span');
        dynamicSpan.classList.add('typing');
        cmdPrompt.appendChild(dynamicSpan);

        // Typing effect for the dynamic text
        typeText(dynamicSpan, dynamicText, () => {
            dynamicSpan.classList.remove('typing');
            cmdPrompt.innerHTML = `${staticText}${dynamicText}<br>`;

            // Add a delay before populating content
            setTimeout(() => {
                populateSectionWithData(sectionClass, data, content);
            }, 500); // Adjust delay as needed for typing effect
        });
    }

    // Function to populate section with data from JSON
    function populateSectionWithData(sectionClass, data, content) {
        let contentText = '';

        if (sectionClass === 'summary') {
            contentText = data.summary || 'Brief summary of your professional background and career goals.';
        } else if (sectionClass === 'experience') {
            const experienceContent = data.experience || [];
            experienceContent.forEach((job, index) => {
                if (index > 0) {
                    contentText += '<div class="dividing-line"></div>';
                }
                contentText += `
                    <div class="job">
                        <h3>${job.jobTitle}</h3>
                        <p class="company">${job.company} | ${job.dates}</p>
                        <p class="job-description">${job.description}</p>
                    </div>
                `;
            });
        } else if (sectionClass === 'education') {
            const educationContent = data.education || [];
            educationContent.forEach((school, index) => {
                if (index > 0) {
                    contentText += '<div class="dividing-line"></div>';
                }
                contentText += `
                    <div class="school">
                        <h3>${school.degree}</h3>
                        <p class="institution">${school.institution} | ${school.year}</p>
                        <p class="description">${school.description}</p>
                    </div>
                `;
            });
        } else if (sectionClass === 'skills') {
            const skillsContent = data.skills || [];
            contentText = '<ul>';
            skillsContent.forEach(skill => {
                contentText += `<li>${skill}</li>`;
            });
            contentText += '</ul>';
        } else if (sectionClass === 'projects') {
            const projectsContent = data.projects || [];
            projectsContent.forEach((project, index) => {
                if (index > 0) {
                    contentText += '<div class="dividing-line"></div>';
                }
                contentText += `
                    <div class="project">
                        <h3>${project.name}</h3>
                        <p class="description">${project.description}</p>
                        <a href="${project.link}">Link to Project</a>
                    </div>
                `;
            });
        }

        // Type out the content visibly
        typeTextContent(content, contentText);
    }

    // Function to reinitialize a section when reopened
    function reinitializeSection(sectionClass) {
        const section = mainContent.querySelector(`section[data-section="${sectionClass}"]`);
        if (section) {
            fetch('content.json')
                .then(response => response.json())
                .then(data => {
                    runCmdAnimation(sectionClass, data); // This should trigger the typing and content injection
                })
                .catch(error => console.error('Error fetching content.json:', error));
        }
    }

    // Function to simulate typing text for command line and resume content
    function typeText(container, text, callback) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                container.innerHTML = text.substring(0, i + 1);
                i++;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 50); // Adjust typing speed for command line (faster)
    }

    // Function to simulate typing text for resume content
    function typeTextContent(container, text) {
        container.classList.remove('hidden-content'); // Ensure the content is visible
        container.textContent = ''; // Clear the container content
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                container.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(interval);
                container.innerHTML = text; // Format content as HTML after typing completes
            }
        }, 10); // Adjust typing speed for content (faster)
    }

    // Function to toggle minimize state of a section
    function toggleMinimize(section) {
        const content = section.querySelector('.content');
        const sectionClass = section.getAttribute('data-section');
        if (content.classList.contains('hidden-content')) {
            content.classList.remove('hidden-content');
            section.classList.remove('minimized');
        } else {
            content.classList.add('hidden-content');
            section.classList.add('minimized');
            section.classList.remove('maximized'); // Ensure maximized state is removed
        }
    }

    // Function to toggle maximize state of a section
    function toggleMaximize(section) {
        if (section === maximizedSection) {
            // Un-maximize the current section and reset all sections to their default state
            document.querySelectorAll('section').forEach(sec => {
                sec.classList.remove('hidden-content', 'maximized', 'minimized');
                sec.querySelector('.content').classList.remove('hidden-content');
            });
            maximizedSection = null;
        } else {
            // Maximize the clicked section and minimize all other sections
            document.querySelectorAll('section').forEach(sec => {
                if (sec !== section) {
                    sec.classList.add('minimized');
                    sec.querySelector('.content').classList.add('hidden-content');
                } else {
                    sec.classList.remove('minimized');
                    sec.classList.add('maximized');
                    sec.querySelector('.content').classList.remove('hidden-content');
                }
            });
            maximizedSection = section;
        }
    }

    // Function to close a section
    function closeSection(section) {
        const sectionClass = section.getAttribute('data-section');
        section.remove();
        setActiveButton(sectionClass, false); // Remove the active state
    }

    // Function to show popup message
    function showPopup(message) {
        popup.innerHTML = message + '<br>'; // Replace textContent with innerHTML to include button
        popup.appendChild(popupOkButton); // Ensure OK button is in the popup
        popup.classList.add('visible');
        popup.style.display = 'block'; // Ensure the popup is displayed

        // Show overlay
        const overlay = document.getElementById('overlay');
        overlay.style.display = 'block';
    }

    // Function to set active button state
    function setActiveButton(sectionClass, isActive) {
        const button = startBar.querySelector(`button[data-target="${sectionClass}"]`);
        if (button) {
            button.classList.toggle('active', isActive);
        }
    }

    // Function to maintain the layout of skills and projects sections
    function maintainSkillsProjectsLayout() {
        const skillsProjectsContainer = document.getElementById('skills-projects');
        if (skillsProjectsContainer) {
            const skillsSection = skillsProjectsContainer.querySelector('section[data-section="skills"]');
            const projectsSection = skillsProjectsContainer.querySelector('section[data-section="projects"]');
            if (skillsSection && projectsSection) {
                skillsProjectsContainer.innerHTML = '';
                skillsProjectsContainer.appendChild(skillsSection);
                skillsProjectsContainer.appendChild(projectsSection);
            }
        }
    }
});
