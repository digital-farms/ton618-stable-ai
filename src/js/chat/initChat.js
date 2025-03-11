// Инициализация чата
import ChatApp from './chatApp.js';

// Функция для создания HTML структуры чата
function createChatHTML() {
    const walletAddress = '0x6a91E85a923df1cB80AEe79f2A8533C1E061';
    const shortWalletAddress = formatWalletAddress(walletAddress);

    const chatHTML = `
        <div class="chat-container">
            <div class="user-info">
                <div class="user-card">
                    <div class="user-card-banner">
                        <img src="/src/pics/glif-animator-flux-sd3-murr-dftp3tc30glvpho6ab58yhgy.gif" alt="Banner Animation">
                    </div>
                    <div class="user-card-content">
                        <div class="user-avatar">
                            <div class="avatar-placeholder">U</div>
                        </div>
                        <div class="user-wallet">
                            <img src="/src/pics/crypto-wallet-icon.svg" alt="Wallet">
                            <span data-full-address="${walletAddress}">${shortWalletAddress}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="chat-messages">
                <!-- Здесь будут отображаться сообщения -->
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" placeholder="Введите сообщение...">
                <button class="send-button">
                    <img src="/src/pics/ton618_logo.svg" alt="Send">
                </button>
                <button class="clear-chat-button">
                    <span>Clear AI</span>
                </button>
            </div>
        </div>
    `;

    return chatHTML;
}

// Функция для сокращения адреса кошелька
function formatWalletAddress(address) {
    if (!address) return '';
    if (address.length <= 20) return address;

    const start = address.substring(0, 10);
    const end = address.substring(address.length - 5);
    return `${start}...${end}`;
}

// Функция для обработки изменения размера окна
function handleResize() {
    const walletSpan = document.querySelector('.user-wallet span');
    if (!walletSpan) return;

    const fullAddress = walletSpan.getAttribute('data-full-address');
    if (window.innerWidth <= 480) {
        walletSpan.textContent = formatWalletAddress(fullAddress);
    } else {
        walletSpan.textContent = fullAddress;
    }
}

// Функция инициализации чата
function initChat() {
    // Создание HTML структуры чата
    document.body.insertAdjacentHTML('beforeend', createChatHTML());

    // Инициализация приложения чата
    const chatApp = new ChatApp();

    // Обработчик изменения размера окна
    window.addEventListener('resize', handleResize);

    // Начальная обработка размера окна
    handleResize();

    // Возвращаем экземпляр приложения для возможного использования извне
    return chatApp;
}

export default initChat;
