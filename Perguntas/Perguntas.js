// Dentro de um function pq é uma boa prática, já que estamos lidando só com 1 tipo de função..
        (function () {
             //Definindo as constantes
            const overlay = document.querySelector('.overlay-blur'); //seleciona o overlay
            const aside = document.querySelector('aside'); //seleciona o aside
            const toggleBtn = document.querySelector('.info-header button'); //seleciona o botão login
            const closeBtn = document.getElementById('fechar-aside-btn'); //seleciona o botão fechar dentro do aside

             // Definindo as funções
            function openAside() {
                overlay.classList.add('active'); //adiciona a classe active, ao overly
                aside.classList.add('active'); //adiciona a classe active ao aside
            }

            function closeAside() { //Tira as classes actives
                overlay.classList.remove('active');
                aside.classList.remove('active');
            }

             //Daqui pra baixo temos só listeners

            toggleBtn.addEventListener('click', function (e) { //seleciona o botão de login, e procura um clique
                e.preventDefault();
                if (!overlay.classList.contains('active')) { //Se overlay não tem classe ativa:
                    openAside();
                } else {
                    closeAside();
                }
            });

            closeBtn.addEventListener('click', function (e) { //se botão fechar for clicado.
                closeAside();
            });

            overlay.addEventListener('click', function (e) { //se overlay for clicado
                closeAside();
            });

            const duvida = document.querySelectorAll('.conteiner-duv-res');

                duvida.forEach(item => {

                item.addEventListener('click', () => {

                    item.classList.toggle('active');
                });
            })
        })();