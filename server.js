const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Загрузка переменных окружения из .env файла
function loadEnv() {
    try {
        const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
        const envVars = {};
        
        envFile.split('\n').forEach(line => {
            // Пропускаем комментарии и пустые строки
            if (!line || line.startsWith('#')) return;
            
            // Разбиваем строку на ключ и значение
            const [key, ...valueParts] = line.split('=');
            if (!key || !valueParts.length) return;
            
            // Объединяем значение обратно (на случай, если в значении есть знаки =)
            let value = valueParts.join('=');
            
            // Убираем кавычки, если они есть
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            
            process.env[key.trim()] = value.trim();
            envVars[key.trim()] = value.trim();
        });
        
        console.log('Переменные окружения загружены из .env файла');
        return envVars;
    } catch (error) {
        console.warn('Не удалось загрузить .env файл:', error.message);
        return {};
    }
}

// Загружаем переменные окружения
const envVars = loadEnv();

const app = express();

// Настройка CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://*", "wss://*"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://*"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://*"],
            imgSrc: ["'self'", "data:", "blob:", "https://*"],
            fontSrc: ["'self'", "https://*", "data:"],
            frameSrc: ["'self'", "https://*"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Основные middleware
app.use(express.json()); // Для парсинга JSON в теле запроса

// Настройка CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : 'http://localhost:3000',
    methods: ['GET', 'POST'], // Добавили POST для работы с waitlist
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Защита от DDoS атак
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Инициализация Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || ''
);

// Статические файлы
app.use('/src', express.static(path.join(__dirname, 'src')));

// API endpoints
app.post('/api/waitlist', async (req, res) => {
    try {
        const userData = req.body;
        const result = await waitlistService.addToWaitlist(userData);
        res.json(result);
    } catch (error) {
        console.error('Waitlist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/waitlist', async (req, res) => {
    try {
        const waitlist = await waitlistService.getWaitlist();
        res.json(waitlist);
    } catch (error) {
        console.error('Waitlist fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoints для работы с кошельками
app.post('/api/wallet/connect', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({
                error: 'Wallet address is required'
            });
        }
        console.log(`Received wallet address: ${walletAddress}`);

        // Сохраняем в Supabase
        const { data, error } = await supabase
            .from('wallets')
            .insert([{ address: walletAddress }]);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Wallet connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/wallet/disconnect', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Wallet address is required'
            });
        }

        const result = await walletService.disconnectWallet(walletAddress);
        res.json(result);
    } catch (error) {
        console.error('Wallet disconnection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const wallet = await walletService.getWalletByAddress(address);

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (error) {
        console.error('Wallet fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/wallet/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const wallets = await walletService.getUserWallets(userId);
        res.json(wallets);
    } catch (error) {
        console.error('User wallets fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint для сохранения адреса кошелька
app.post('/api/save-wallet', async (req, res) => {
    try {
        const { address } = req.body;
        const { data, error } = await supabase
            .from('wallets')
            .insert([{ address }]);

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error saving wallet:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API эндпоинт для получения публичных переменных окружения
app.get('/api/config', (req, res) => {
    // Отправляем только те переменные, которые безопасно показывать на фронтенде
    // или которые нужны для работы фронтенда
    res.json({
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
        OPENROUTER_API_URL: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
        OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-thinking-exp:free',
        AI_SYSTEM_PROMPT: process.env.AI_SYSTEM_PROMPT || 'Ты саркастичный ИИ, который отвечает кратко и по делу.'
    });
});

// Маршруты для страниц
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/waitlist.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'waitlist.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Запуск сервера
const host = '0.0.0.0';
const port = process.env.PORT || 3002;

app.listen(port, host, () => {
    console.log(`Server is running on ${host}:${port}`);
});
