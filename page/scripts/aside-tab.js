
    (function() {
        const overlay = document.querySelector('.overlay-blur');
        const aside = document.querySelector('aside');
        const toggleBtn = document.getElementById('open-aside-article');
        const closeBtn = document.getElementById('fechar-aside-btn');

        function openAside() {
            overlay.classList.add('active');
            aside.classList.add('active');
        }

        function closeAside() {
            overlay.classList.remove('active');
            aside.classList.remove('active');
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (!overlay.classList.contains('active')) {
                    openAside();
                } else {
                    closeAside();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeAside();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function() {
                closeAside();
            });
        }
    })();