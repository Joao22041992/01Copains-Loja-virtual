/**
 * =================================================================================================
 * SCRIPT PRINCIPAL DO PROJETO (SPA - Single Page Application)
 * =================================================================================================
 * Este arquivo centraliza todas as funcionalidades JavaScript do site. A estrutura está preparada
 * para uma Single Page Application (SPA), mas atualmente é usada para gerenciar funcionalidades
 * compartilhadas entre as páginas, como o carrinho, favoritos e menus.
 *
 * Organização do Código:
 * 1. EVENTO DOMContentLoaded: Garante que o script só execute após o HTML ser carregado.
 * 2. SELETORES DE ELEMENTOS: Referências aos elementos do DOM.
 * 3. ESTADO DA APLICAÇÃO: Variáveis que guardam os dados (carrinho, favoritos).
 * 4. LÓGICA DE NAVEGAÇÃO (SPA): Funções para carregar páginas dinamicamente (se aplicável).
 * 5. LÓGICA DO MENU RESPONSIVO: Controla o menu "hambúrguer".
 * 6. LÓGICA DO CARRINHO DE COMPRAS: Gerencia o estado e a interface do carrinho.
 * 7. LÓGICA DOS FAVORITOS: Gerencia a adição e remoção de produtos favoritos.
 * 8. INICIALIZAÇÃO: Funções que rodam na carga inicial da página.
 * =================================================================================================
 */

// O evento 'DOMContentLoaded' espera todo o HTML da página ser carregado e processado
// pelo navegador antes de executar o código JavaScript. Isso evita erros de "elemento não encontrado".
document.addEventListener('DOMContentLoaded', () => {
    /**
     * Seleciona e armazena referências aos elementos HTML que serão manipulados pelo script.
     * Fazer isso uma vez no início otimiza o desempenho, evitando buscas repetidas no DOM.
     */
    // --- SELETORES GERAIS ---
    const mainContent = document.getElementById('main-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu') || document.getElementById('navbarNav'); // Compatível com Tailwind e Bootstrap

    // --- SELETORES DO CARRINHO ---
    const cartIcon = document.getElementById('cart-icon');
    const cartModalOverlay = document.getElementById('cart-modal-overlay');
    const cartModal = document.getElementById('cart-modal');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartBody = document.getElementById('cart-body');
    const cartItemCount = document.getElementById('cart-item-count');
    const cartTotal = document.getElementById('cart-total');

    // --- SELETORES DOS FAVORITOS ---
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoritesCount = document.getElementById('favorites-count');

    // =======================================================================
    // ESTADO DA APLICAÇÃO
    // =======================================================================
    // Carrega o carrinho do `localStorage`. Se não houver nada salvo, `|| []` cria um array vazio.
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    // Carrega os favoritos do `localStorage`.
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // =======================================================================
    // LÓGICA DE NAVEGAÇÃO E ROTEAMENTO (SPA)
    // =======================================================================

    /**
     * Função para buscar e carregar o conteúdo de um arquivo HTML.
     * @param {string} url - O caminho para o arquivo HTML a ser carregado.
     * @returns {Promise<string>} O conteúdo HTML do corpo da página.
     */
    async function fetchPageContent(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro ao buscar página: ${response.statusText}`);
            const text = await response.text();
            // Extrai apenas o conteúdo dentro da tag <main> do arquivo buscado.
            const mainContentMatch = text.match(/<main[^>]*>([\s\S]*)<\/main>/i);
            return mainContentMatch ? mainContentMatch[1] : '<p>Erro: Conteúdo principal não encontrado.</p>';
        } catch (error) {
            console.error('Falha ao carregar conteúdo da página:', error);
            return '<section class="container py-5"><h2 class="text-center text-danger">Erro ao carregar a página.</h2></section>';
        }
    }

    /**
     * Roteador principal. Carrega o conteúdo da página solicitada no elemento <main>.
     * @param {string} pageUrl - A URL da página a ser carregada.
     */
    async function navigate(pageUrl) {
        if (!mainContent || !loadingOverlay) return;

        loadingOverlay.classList.add('visible');

        // Simula o carregamento ultra-rápido de 5ms, como solicitado.
        setTimeout(async () => {
            const content = await fetchPageContent(pageUrl);
            mainContent.innerHTML = content;
            window.scrollTo(0, 0); // Rola para o topo da página.
            updateActiveLink(pageUrl); // Atualiza o link ativo na navegação.
            loadingOverlay.classList.remove('visible');
        }, 5);
    }

    /**
     * Atualiza o estilo do link de navegação ativo.
     * @param {string} currentUrl - A URL da página atual.
     */
    function updateActiveLink(currentUrl) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentUrl) {
                link.classList.add('fw-bold', 'text-primary');
            } else {
                link.classList.remove('fw-bold', 'text-primary');
            }
        });
    }

    // =======================================================================
    // LÓGICA DO MENU RESPONSIVO (HAMBÚRGUER)
    // =======================================================================
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active'); // Para Tailwind
        });
    }

    // =======================================================================
    // LÓGICA DO CARRINHO DE COMPRAS
    // =======================================================================

    /**
     * Alterna a visibilidade do modal do carrinho e do seu overlay.
     * Adiciona/remove a classe 'active' para controlar a exibição via CSS.
     */
    function toggleCartModal() {
        if (!cartModalOverlay || !cartModal) return;
        // Verifica se o modal já está ativo para decidir se deve abrir ou fechar
        const isActive = cartModalOverlay.classList.contains('active');
        if (!isActive) updateCart(); // Atualiza o conteúdo do carrinho antes de abrir
        cartModalOverlay.classList.toggle('active');
        cartModal.classList.toggle('active');
    }

    /**
     * Adiciona um item ao carrinho.
     * Se o item já existe, incrementa a quantidade. Senão, adiciona como novo.
     * @param {string} id - O ID único do produto (pode incluir variantes).
     * @param {string} name - O nome do produto.
     * @param {number} price - O preço do produto.
     * @param {string} image - A URL da imagem do produto.
     * @param {string|null} variant - A descrição da variação (ex: "Tamanho: 40, Cor: Azul").
     */
    function addItemToCart(id, name, price, image, variant = null) {
        const cartItemId = variant ? `${id}-${variant.replace(/\s/g, '-')}` : id;
        const existingItem = cart.find(item => item.id === cartItemId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: cartItemId, name, price, image, quantity: 1, variant });
        }
        updateCart();
    }

    /**
     * Atualiza a quantidade de um item específico no carrinho.
     * Se a quantidade for 0 ou menos, o item é removido.
     * @param {string} id - O ID do item a ser atualizado.
     * @param {number} change - O valor a ser adicionado/subtraído (1 ou -1).
     */
    function updateItemQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (!item) return;

        item.quantity += change;

        if (item.quantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== id);
        }
        updateCart();
    }

    /**
     * Função central que orquestra as atualizações da interface do carrinho.
     * Renderiza os itens, o subtotal, o contador do ícone e salva no localStorage.
     */
    function updateCart() {
        // Não executa se os elementos do carrinho não estiverem na página
        renderCartItems();
        renderSubtotal();
        updateCartIconCount();
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

    /**
     * Gera e insere o HTML para cada item do carrinho dentro do modal.
     * Se o carrinho estiver vazio, exibe uma mensagem.
     */
    function renderCartItems() {
        if (!cartBody) return;
        if (cart.length === 0) {
            cartBody.innerHTML = '<p class="text-center p-4">Seu carrinho está vazio.</p>';
            return;
        }

        cartBody.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='https://placehold.co/80x80/eee/aaa?text=Img';">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${item.variant ? `<p class="text-muted small" style="font-size: 0.85rem; color: #6c757d;">${item.variant}</p>` : ''}
                    <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    <div class="cart-item-actions">
                        <button class="quantity-decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-increase">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Calcula o valor total de todos os itens no carrinho e o exibe no rodapé do modal.
     */
    function renderSubtotal() {
        if (!cartTotal) return;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    /**
     * Atualiza o número exibido no ícone do carrinho no cabeçalho.
     * O contador só é visível se houver pelo menos um item no carrinho.
     */
    function updateCartIconCount() {
        // `reduce` aqui soma a quantidade de todos os itens para obter o total de produtos.
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartItemCount) {
            cartItemCount.textContent = totalItems;
            cartItemCount.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    // =======================================================================
    // LÓGICA DE FAVORITOS
    // =======================================================================

    /**
     * Alterna um item na lista de favoritos.
     * Se o item não está na lista, ele é adicionado. Se já está, é removido.
     * @param {string} id - O ID do produto.
     * @param {string} name - O nome do produto.
     * @param {number} price - O preço do produto.
     * @param {string} image - A URL da imagem do produto.
     */
    function toggleFavorite(id, name, price, image) {
        const existingIndex = favorites.findIndex(item => item.id === id);

        if (existingIndex > -1) {
            // Remove o item se já for um favorito
            favorites.splice(existingIndex, 1);
        } else {
            // Adiciona o item se não for um favorito
            favorites.push({ id, name, price, image });
        }
        updateFavorites();
    }

    /**
     * Função central que orquestra as atualizações da interface de favoritos.
     */
    function updateFavorites() {
        updateFavoriteIconState();
        updateFavoritesCount();
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    /**
     * Atualiza o estado visual de todos os ícones de favorito na página.
     * Percorre todos os ícones e verifica se o produto correspondente está na lista de favoritos.
     */
    function updateFavoriteIconState() {
        // Seleciona todos os elementos que podem conter um ícone de favorito
        const productElements = document.querySelectorAll('.product-card[data-id], .product-details[data-id]');

        productElements.forEach(element => {
            const productId = element.dataset.id;
            const iconContainer = element.querySelector('.favorite-icon, #favorite-icon'); // Procura por classe ou ID
            if (!iconContainer) return;

            const icon = iconContainer.querySelector('i'); // O ícone <i> dentro do container
            if (!icon) return;

            const isFavorited = favorites.some(item => item.id === productId);

            if (isFavorited) {
                icon.classList.remove('far'); // Remove classe de coração vazio
                icon.classList.add('fas');   // Adiciona classe de coração preenchido
                iconContainer.style.color = 'var(--primary-color)'; // Aplica a cor primária
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                iconContainer.style.color = '#ccc'; // Volta para a cor padrão (cinza)
            }
        });
    }

    /**
     * Atualiza o contador de favoritos no cabeçalho.
     */
    function updateFavoritesCount() {
        if (favoritesCount) {
            const totalFavorites = favorites.length;
            favoritesCount.textContent = totalFavorites;
            favoritesCount.style.display = totalFavorites > 0 ? 'block' : 'none';
        }
    }

    /**
     * =======================================================================
     * LÓGICA DE EVENTOS DA PÁGINA
     * =======================================================================
    }

    /**
     * =======================================================================
     * 4. LÓGICA DE VARIANTES DE PRODUTO (TAMANHO, COR, ETC.)
     * =======================================================================
     */

    /**
     * Inicializa um seletor de variantes genérico (tamanho, cor, etc.).
     * Usa "delegação de evento" para ser mais eficiente, adicionando um único
     * "ouvinte" ao contêiner pai em vez de um para cada botão de opção.
     * @param {string} containerId - O ID do elemento HTML que contém as opções (ex: 'size-options').
     * @param {string} optionClass - A classe CSS comum a todas as opções clicáveis (ex: 'size-option').
     */
    function initializeVariantSelector(containerId, optionClass) {
        const optionsContainer = document.getElementById(containerId);
        if (optionsContainer) {
            optionsContainer.addEventListener('click', (event) => {
                const target = event.target;
                // Garante que o clique foi em um elemento de opção válido
                if (target.classList.contains(optionClass)) {
                    // Remove a seleção de todas as outras opções dentro deste container
                    optionsContainer.querySelectorAll('.selected').forEach(selected => selected.classList.remove('selected'));
                    // Adiciona a classe 'selected' apenas na opção clicada
                    target.classList.add('selected');
                }
            });
        }
    }

    // Adiciona evento de clique para os botões "Adicionar ao Carrinho".
    document.body.addEventListener('click', (e) => {
        // Adicionar ao carrinho
        if (e.target.closest('.add-to-cart-btn')) {
            const productElement = e.target.closest('.product-details[data-id]');
            if (!productElement) return;

            const id = productElement.dataset.id;
            const name = productElement.dataset.name;
            const price = parseFloat(productElement.dataset.price);
            const image = productElement.dataset.image;
            
            // Lógica para variantes (tamanho, cor, etc.)
            const sizeEl = document.querySelector('#size-options .selected, #size-options .active');
            const bandEl = document.querySelector('#band-options .active');
            let variant = null;
            if (sizeEl) variant = `Tamanho: ${sizeEl.dataset.size}`;
            if (bandEl) variant = `Pulseira: ${bandEl.dataset.band}`;

            addItemToCart(id, name, price, image, variant);
            toggleCartModal(); // Abre o carrinho ao adicionar um item
        }

        // Adicionar/Remover dos Favoritos
        if (e.target.closest('.favorite-icon, #favorite-icon')) {
            const productElement = e.target.closest('.product-card[data-id], .product-details[data-id]');
            if (!productElement) return;

            const id = productElement.dataset.id;
            const name = productElement.dataset.name;
            const price = parseFloat(productElement.dataset.price);
            const image = productElement.dataset.image;

            toggleFavorite(id, name, price, image);

            // Se estivermos na página de favoritos, remove o elemento da tela
            const favoritesContainer = document.getElementById('favorites-container');
            if (favoritesContainer) {
                const cardToRemove = e.target.closest('.favorite-card');
                if (cardToRemove) cardToRemove.remove();
            }
        }

        // Ações dentro do carrinho (aumentar/diminuir quantidade)
        if (e.target.closest('.cart-item')) {
            const id = e.target.closest('.cart-item').dataset.id;
            if (e.target.classList.contains('quantity-increase')) {
                updateItemQuantity(id, 1);
            }
            if (e.target.classList.contains('quantity-decrease')) {
                updateItemQuantity(id, -1);
            }
        }
    });

    // Eventos para abrir/fechar o modal do carrinho
    if (cartIcon) cartIcon.addEventListener('click', toggleCartModal);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', toggleCartModal);
    if (cartModalOverlay) {
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) toggleCartModal();
        });
    }

    // =======================================================================
    // INICIALIZAÇÃO
    // =======================================================================

    /**
     * Chamada inicial para atualizar o carrinho quando a página é carregada.
     * Garante que o contador de itens e o subtotal sejam carregados
     * corretamente do `localStorage` e exibidos na interface do usuário.
     */
    updateCart();
    updateFavorites();

    // Ativa os seletores de variantes (se existirem na página)
    initializeVariantSelector('size-options', 'size-option'); // Para tênis
    initializeVariantSelector('band-options', 'btn-band'); // Para relógios
});