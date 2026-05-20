(function () {
    const duvida = document.querySelectorAll('.conteiner-duv-res');

    duvida.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    })

})();
