// Конфигурация приложения
// Загрузка переменных окружения

// Функция для загрузки конфигурации с сервера
async function loadConfigFromServer() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            console.warn('Не удалось загрузить конфигурацию с сервера');
            return {};
        }
        
        const config = await response.json();
        console.log('Конфигурация загружена с сервера');
        return config;
    } catch (error) {
        console.error('Ошибка при загрузке конфигурации:', error);
        return {};
    }
}

// Загружаем конфигурацию
let serverConfig = {};
loadConfigFromServer().then(config => {
    serverConfig = config;
    console.log('Переменные окружения загружены с сервера');
});

// Функция для получения значения переменной окружения
// Если переменная не найдена, возвращает значение по умолчанию
function getEnvVariable(name, defaultValue) {
    // Проверяем, есть ли переменная в загруженных с сервера
    if (serverConfig[name]) {
        return serverConfig[name];
    }
    
    // В продакшене переменные могут быть в process.env
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    
    // Возвращаем значение по умолчанию
    return defaultValue;
}

// Экспорт конфигурации
export const config = {
    openrouter: {
        apiKey: getEnvVariable('OPENROUTER_API_KEY', ''),
        apiUrl: getEnvVariable('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1/chat/completions'),
        model: getEnvVariable('OPENROUTER_MODEL', 'google/gemini-2.0-flash-thinking-exp:free')
    },
    ai: {
        systemPrompt: getEnvVariable('AI_SYSTEM_PROMPT', 'Ты саркастичный ИИ, который отвечает кратко и по делу.')
    },
    supabase: {
        url: getEnvVariable('SUPABASE_URL', ''),
        key: getEnvVariable('SUPABASE_KEY', '')
    }
};

export default config;
