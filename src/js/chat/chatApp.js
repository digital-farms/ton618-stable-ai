// Основной класс для чата
import config from '../config.js';

// Класс для работы с чатом
class ChatApp {
    constructor() {
        this.apiKey = config.openrouter.apiKey;
        this.apiUrl = config.openrouter.apiUrl;
        this.modelName = config.openrouter.model;
        this.messages = [];
        // Фиксированный системный промпт, который определяет характер ИИ
        this.systemPrompt = config.ai.systemPrompt;
        this.isTyping = false;
        this.configLoaded = false;

        // Загрузка конфигурации с сервера
        this.loadConfig();

        // Загрузка сохраненных сообщений
        this.loadFromStorage();

        // Инициализация UI
        this.initUI();

        // Добавление обработчиков событий
        this.addEventListeners();
    }

    // Загрузка конфигурации с сервера
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const serverConfig = await response.json();
                this.apiKey = serverConfig.OPENROUTER_API_KEY || this.apiKey;
                this.apiUrl = serverConfig.OPENROUTER_API_URL || this.apiUrl;
                this.modelName = serverConfig.OPENROUTER_MODEL || this.modelName;
                this.systemPrompt = serverConfig.AI_SYSTEM_PROMPT || this.systemPrompt;
                this.configLoaded = true;
                console.log('Конфигурация загружена с сервера');
            }
        } catch (error) {
            console.error('Ошибка при загрузке конфигурации:', error);
        }
    }

    initUI() {
        // Получение ссылок на элементы UI
        this.chatContainer = document.querySelector('.chat-container');
        this.messagesContainer = document.querySelector('.chat-messages');
        this.inputField = document.querySelector('.chat-input');
        this.sendButton = document.querySelector('.send-button');
        this.clearButton = document.querySelector('.clear-chat-button');

        // Отображение сохраненных сообщений
        this.renderMessages();
    }

    addEventListeners() {
        // Обработчик отправки сообщения
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Обработчик очистки истории
        this.clearButton.addEventListener('click', () => this.clearChat());
    }

    async sendMessage() {
        const userInput = this.inputField.value.trim();
        if (!userInput || this.isTyping) return;

        // Добавление сообщения пользователя
        this.addMessage('user', userInput);

        // Очистка поля ввода
        this.inputField.value = '';

        // Отправка запроса к API
        await this.fetchResponse(userInput);
    }

    async fetchResponse(userInput) {
        try {
            // Проверяем, загружена ли конфигурация
            if (!this.configLoaded && !this.apiKey) {
                // Если конфигурация не загружена, пробуем загрузить её
                await this.loadConfig();
                
                // Если после попытки загрузки ключа всё равно нет, выдаём ошибку
                if (!this.apiKey) {
                    throw new Error('API ключ не найден. Проверьте файл .env');
                }
            }

            this.isTyping = true;
            this.showTypingIndicator();

            // Формирование запроса
            const requestMessages = this.formatMessagesForAPI();

            // Проверяем, есть ли текущее сообщение пользователя в истории
            const lastMessage = this.messages[this.messages.length - 1];
            const isLastMessageFromUser = lastMessage && lastMessage.role === 'user' && lastMessage.content === userInput;
            
            // Добавляем текущее сообщение пользователя только если его еще нет в истории
            if (!isLastMessageFromUser) {
                requestMessages.push({
                    role: 'user',
                    content: userInput
                });
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: requestMessages
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const botResponse = data.choices[0].message.content;

            // Удаление индикатора набора текста
            this.removeTypingIndicator();

            // Добавление ответа бота
            this.addMessage('assistant', botResponse);

        } catch (error) {
            console.error('Error fetching response:', error);
            this.removeTypingIndicator();
            this.addMessage('assistant', 'Извините, произошла ошибка при получении ответа. Пожалуйста, попробуйте еще раз.');
        } finally {
            this.isTyping = false;
        }
    }

    formatMessagesForAPI() {
        const formattedMessages = [];

        // Добавление системного промпта
        formattedMessages.push({
            role: 'system',
            content: this.systemPrompt
        });

        // Добавление истории сообщений (ограничение до последних 10 для экономии токенов)
        const recentMessages = this.messages.slice(-10);
        recentMessages.forEach(msg => {
            formattedMessages.push({
                role: msg.role,
                content: msg.content
            });
        });

        return formattedMessages;
    }

    addMessage(role, content) {
        // Добавление сообщения в массив
        this.messages.push({ role, content });

        // Сохранение в localStorage
        this.saveToStorage();

        // Отображение сообщения
        this.renderMessage({ role, content });

        // Прокрутка к последнему сообщению
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        if (message.role === 'user') {
            messageElement.classList.add('user-message');
            messageElement.textContent = message.content;
        } else {
            messageElement.classList.add('bot-message');

            // Добавление аватара бота
            const avatarImg = document.createElement('img');
            avatarImg.src = '/src/pics/ton618_logo.svg';
            avatarImg.alt = 'Bot';
            avatarImg.classList.add('bot-avatar');

            // Обработка текста с выделением случайных слов
            const textContent = document.createElement('div');
            textContent.innerHTML = this.highlightRandomWords(message.content);

            messageElement.appendChild(avatarImg);
            messageElement.appendChild(textContent);
        }

        this.messagesContainer.appendChild(messageElement);
    }

    highlightRandomWords(text) {
        // Разбиение текста на слова
        const words = text.split(/\s+/);

        // Определение количества слов для выделения (примерно 10-15% от общего количества)
        const wordsToHighlight = Math.max(1, Math.floor(words.length * 0.12));

        // Выбор случайных слов для выделения
        const indices = new Set();
        while (indices.size < wordsToHighlight) {
            const randomIndex = Math.floor(Math.random() * words.length);
            // Выбираем только слова длиннее 3 символов
            if (words[randomIndex].length > 3) {
                indices.add(randomIndex);
            }
        }

        // Выделение выбранных слов
        const highlightedText = words.map((word, index) => {
            if (indices.has(index)) {
                return `<span class="highlighted-word">${word}</span>`;
            }
            return word;
        }).join(' ');

        return highlightedText;
    }

    showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'bot-message', 'typing-message');

        // Добавление аватара бота
        const avatarImg = document.createElement('img');
        avatarImg.src = '/src/pics/ton618_logo.svg';
        avatarImg.alt = 'Bot';
        avatarImg.classList.add('bot-avatar');

        // Добавление индикатора набора текста
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';

        typingElement.appendChild(avatarImg);
        typingElement.appendChild(typingIndicator);

        this.messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    renderMessages() {
        // Очистка контейнера сообщений
        this.messagesContainer.innerHTML = '';

        // Отображение всех сообщений
        this.messages.forEach(message => {
            this.renderMessage(message);
        });

        // Прокрутка к последнему сообщению
        this.scrollToBottom();
    }

    saveToStorage() {
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
    }

    loadFromStorage() {
        const savedMessages = localStorage.getItem('chatMessages');

        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
        }
    }

    clearChat() {
        // Очищаем массив сообщений
        this.messages = [];
        
        // Очищаем localStorage
        localStorage.removeItem('chatMessages');
        
        // Очищаем контейнер сообщений
        this.messagesContainer.innerHTML = '';
        
        // Добавляем системное сообщение об очистке
        // Важно: НЕ добавляем это сообщение в this.messages, чтобы не сохранять в контексте
        this.renderSystemMessage('История чата очищена. Контекст сброшен.');
    }
    
    // Метод для отображения системных сообщений без сохранения в контексте
    renderSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message', 'system-message');
        
        // Создаем контейнер для текста сообщения
        const textContainer = document.createElement('div');
        textContainer.classList.add('message-text');
        textContainer.textContent = content;
        
        messageElement.appendChild(textContainer);
        this.messagesContainer.appendChild(messageElement);
        
        // Прокрутка к последнему сообщению
        this.scrollToBottom();
    }

}

// Экспорт класса
export default ChatApp;
